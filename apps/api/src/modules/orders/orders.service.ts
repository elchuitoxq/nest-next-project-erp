import {
  Injectable,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { InventoryService } from '../inventory/inventory.service';
import { BillingService } from '../billing/billing.service';
import {
  db,
  orders,
  orderItems,
  stock,
  currencies,
  exchangeRates,
  warehouses,
} from '@repo/db';
import { eq, desc, and } from 'drizzle-orm';
import { CreateOrderDto } from './dto/create-order.dto';
import { InvoiceType } from '../billing/dto/create-invoice.dto';
import Decimal from 'decimal.js';
import { CurrenciesService } from '../settings/currencies/currencies.service';

@Injectable()
export class OrdersService {
  constructor(
    private readonly inventoryService: InventoryService,
    private readonly billingService: BillingService,
    private readonly currenciesService: CurrenciesService,
  ) {}
  async findAll(branchId?: string, type?: string) {
    const conditions = [];
    if (branchId) conditions.push(eq(orders.branchId, branchId));
    if (type) conditions.push(eq(orders.type, type));

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

    return await db.query.orders.findMany({
      where: whereClause,
      orderBy: desc(orders.date),
      with: {
        partner: true,
        branch: true,
        warehouse: true,
        user: true,
        currency: true,
        items: {
          with: {
            product: true,
          },
        },
      },
    });
  }

  async findOne(id: string) {
    return await db.query.orders.findFirst({
      where: eq(orders.id, id),
      with: {
        partner: true,
        branch: true,
        warehouse: true,
        user: true,
        currency: true,
        items: {
          with: {
            product: true,
          },
        },
      },
    });
  }

  // Modified signature to handle extended DTO with branchId
  async create(data: CreateOrderDto & { branchId?: string }, userId: string) {
    return await db.transaction(async (tx) => {
      if (!data.branchId) {
        throw new BadRequestException(
          'Branch context is required to create an order',
        );
      }

      // Calculate total
      const total = data.items.reduce(
        (sum, item) =>
          sum.plus(new Decimal(item.quantity).times(new Decimal(item.price))),
        new Decimal(0),
      );

      // Validate Stock if warehouse is selected AND it is a SALE
      // For Purchase, we don't check stock (we are adding it)
      if (data.warehouseId && data.type !== 'PURCHASE') {
        // Validation: Warehouse MUST belong to the active branch
        const warehouse = await db.query.warehouses.findFirst({
          where: eq(warehouses.id, data.warehouseId),
        });

        if (!warehouse) {
          throw new BadRequestException('Almacén no encontrado');
        }

        if (warehouse.branchId !== data.branchId) {
          throw new BadRequestException(
            'El almacén seleccionado no pertenece a la sucursal activa',
          );
        }

        for (const item of data.items) {
          const stockItem = await db.query.stock.findFirst({
            where: and(
              eq(stock.warehouseId, data.warehouseId!),
              eq(stock.productId, item.productId),
            ),
          });

          const currentStock = stockItem
            ? parseFloat(stockItem.quantity || '0')
            : 0;
          if (item.quantity > currentStock) {
            throw new BadRequestException(
              `No hay stock suficiente para el producto ${item.productId} (Disponible: ${currentStock})`,
            );
          }
        }
      }

      // 1. Create Header
      // New Logic: Always fetch and save the Global VES Rate
      const vesCurrency = await db.query.currencies.findFirst({
        where: eq(currencies.code, 'VES'),
      });

      let exchangeRateToSave = '1.0000000000';
      if (vesCurrency) {
        exchangeRateToSave =
          (await this.currenciesService.getLatestRate(vesCurrency.id)) ||
          '1.0000000000';
      }

      const [order] = await tx
        .insert(orders)
        .values({
          code: `PED-${Date.now()}`, // Temporary Code Gen
          partnerId: data.partnerId,
          branchId: data.branchId,
          warehouseId: data.warehouseId,
          userId: userId,
          status: 'PENDING',
          total: total.toString(),
          exchangeRate: exchangeRateToSave, // Use the fetched VES Rate
          type: data.type || 'SALE',
          // @ts-ignore
          currencyId: data.currencyId, // Save Transaction Currency
        })
        .returning();

      // 2. Create Items
      if (data.items.length > 0) {
        await tx.insert(orderItems).values(
          data.items.map((item) => ({
            orderId: order.id,
            productId: item.productId,
            quantity: item.quantity.toString(),
            price: item.price.toString(),
          })),
        );
      }

      return order;
    });
  }
  async confirm(id: string, userId: string) {
    return await db.transaction(async (tx) => {
      const order = await db.query.orders.findFirst({
        where: eq(orders.id, id),
        with: {
          items: true,
        },
      });

      if (!order) {
        throw new NotFoundException('Pedido no encontrado');
      }

      if (order.status === 'CONFIRMED') {
        throw new BadRequestException('El pedido ya está confirmado');
      }

      if (!order.warehouseId) {
        throw new BadRequestException('El pedido no tiene almacén asignado');
      }

      // Create Inventory Move
      // If PURCHASE -> IN (Restocking/Reception)
      // If SALE -> OUT (Delivery)
      const isPurchase = order.type === 'PURCHASE';
      const moveType = isPurchase ? 'IN' : 'OUT';

      const moveLines = order.items.map((item) => ({
        productId: item.productId,
        quantity: parseFloat(item.quantity),
        cost: 0, // Cost logic should ideally come from order price for Purchases
      }));

      await this.inventoryService.createMove({
        type: moveType,
        lines: moveLines,
        fromWarehouseId: !isPurchase ? order.warehouseId : undefined,
        toWarehouseId: isPurchase ? order.warehouseId : undefined,
        note: `Pedido Confirmado #${order.code} (${isPurchase ? 'Compra' : 'Venta'})`,
        userId,
      });

      // Update Order Status
      const [updatedOrder] = await tx
        .update(orders)
        .set({ status: 'CONFIRMED' })
        .where(eq(orders.id, id))
        .returning();

      return updatedOrder;
    });
  }

  async cancel(id: string, userId: string) {
    return await db.transaction(async (tx) => {
      const order = await db.query.orders.findFirst({
        where: eq(orders.id, id),
        with: {
          items: true,
        },
      });

      if (!order) {
        throw new NotFoundException('Pedido no encontrado');
      }

      if (order.status === 'CANCELLED') {
        throw new BadRequestException('El pedido ya está cancelado');
      }

      if (order.status === 'COMPLETED') {
        throw new BadRequestException(
          'No se puede cancelar un pedido completado',
        );
      }

      // If Confirmed, we need to return stock
      if (order.status === 'CONFIRMED') {
        const isPurchase = order.type === 'PURCHASE';
        // Reverse Logic: Sale -> IN (Return), Purchase -> OUT (Return to Vendor)
        const moveType = isPurchase ? 'OUT' : 'IN';

        const moveLines = order.items.map((item) => ({
          productId: item.productId,
          quantity: parseFloat(item.quantity),
          cost: 0,
        }));

        await this.inventoryService.createMove({
          type: moveType,
          lines: moveLines,
          toWarehouseId: !isPurchase ? order.warehouseId! : undefined,
          fromWarehouseId: isPurchase ? order.warehouseId! : undefined,
          note: `Cancelación Pedido #${order.code}`,
          userId,
        });
      }

      // Update Order Status
      const [updatedOrder] = await tx
        .update(orders)
        .set({ status: 'CANCELLED' })
        .where(eq(orders.id, id))
        .returning();

      return updatedOrder;
    });
  }

  async generateInvoice(id: string, userId: string) {
    return await db.transaction(async (tx) => {
      const order = await db.query.orders.findFirst({
        where: eq(orders.id, id),
        with: {
          items: {
            with: {
              product: true,
            },
          },
        },
      });

      if (!order) throw new NotFoundException('Pedido no encontrado');

      if (order.status !== 'CONFIRMED') {
        throw new BadRequestException(
          'Solo se pueden facturar pedidos confirmados',
        );
      }

      // 1. Create Invoice
      // Use Order Currency as Invoice Currency
      // @ts-ignore
      let targetCurrencyId = order.currencyId;

      if (!targetCurrencyId) {
        // Fallback to VES logic if not set on order
        const currency = await db.query.currencies.findFirst({
          where: eq(currencies.code, 'VES'),
        });
        if (!currency)
          throw new BadRequestException('Moneda VES no encontrada');
        targetCurrencyId = currency.id;
      }

      const invoiceCurrencyId = targetCurrencyId;

      // Fetch Rate for accounting purposes (always VES rate for fiscal reporting)
      // If Invoice is USD: Rate = VES Rate (e.g. 45.00)
      // If Invoice is VES: Rate = 1
      const vesCurrency = await db.query.currencies.findFirst({
        where: eq(currencies.code, 'VES'),
      });
      const invoiceCurrency = await db.query.currencies.findFirst({
        where: eq(currencies.id, invoiceCurrencyId),
      });

      let exchangeRateStr = '1.0000000000';
      // Always fetch global VES rate (USD -> VES parity)
      if (vesCurrency) {
        exchangeRateStr =
          (await this.currenciesService.getLatestRate(vesCurrency.id)) ||
          '1.0000000000';
      }
      const exchangeRate = new Decimal(exchangeRateStr);

      const invoiceItemsInput = order.items.map((item) => {
        // Items are already priced in Order Currency (due to recalculate logic or creation logic)
        // So we just pass them 1:1.
        return {
          productId: item.productId,
          quantity: new Decimal(item.quantity).toNumber(),
          price: new Decimal(item.price).toNumber(),
        };
      });

      const invoice = await this.billingService.createInvoice({
        partnerId: order.partnerId,
        branchId: order.branchId,
        currencyId: invoiceCurrencyId,
        date: new Date().toISOString(),
        items: invoiceItemsInput,
        userId,
        type:
          order.type === 'PURCHASE' ? InvoiceType.PURCHASE : InvoiceType.SALE,
        orderId: order.id,
        warehouseId: order.warehouseId || undefined,
        status: 'DRAFT', // Explicitly DRAFT
        exchangeRate: exchangeRate.toNumber(),
      });

      // 2. Update Order Status to COMPLETED
      const [updatedOrder] = await tx
        .update(orders)
        .set({ status: 'COMPLETED' })
        .where(eq(orders.id, id))
        .returning();

      return { order: updatedOrder, invoice };
    });
  }

  async recalculate(id: string, userId: string) {
    return await db.transaction(async (tx) => {
      const order = await db.query.orders.findFirst({
        where: eq(orders.id, id),
        with: {
          items: {
            with: {
              product: true,
            },
          },
        },
      });

      if (!order) throw new NotFoundException('Pedido no encontrado');
      if (order.status !== 'PENDING' && order.status !== 'CONFIRMED') {
        throw new BadRequestException(
          'Solo se pueden recalcular pedidos pendientes o confirmados',
        );
      }

      // Determine Target Currency (Order Currency or Branch Default)
      // @ts-ignore
      let targetCurrencyId = order.currencyId;
      if (!targetCurrencyId) {
        // Fallback to VES if not set
        const ves = await db.query.currencies.findFirst({
          where: eq(currencies.code, 'VES'),
        });
        targetCurrencyId = ves?.id || null;
      }

      if (!targetCurrencyId)
        throw new BadRequestException('Moneda de referencia no encontrada');

      // Fetch Exchange Rate for accounting purposes
      // Always store the VES rate (market rate) for fiscal reporting
      // If Order is USD: Rate = VES Rate (e.g. 45.00)
      // If Order is VES: Rate = 1

      // Get VES currency for rate lookup
      const vesCurrency = await db.query.currencies.findFirst({
        where: eq(currencies.code, 'VES'),
      });

      // Get target currency info
      const targetCurrency = await db.query.currencies.findFirst({
        where: eq(currencies.id, targetCurrencyId),
      });

      let orderRateStr = '1';
      // Always fetch global VES rate (USD -> VES parity)
      if (vesCurrency) {
        orderRateStr =
          (await this.currenciesService.getLatestRate(vesCurrency.id)) || '1';
      }
      const orderRate = new Decimal(orderRateStr);

      let newTotal = new Decimal(0);

      for (const item of order.items) {
        const product = item.product;
        // Product Price is usually stored in product.currencyId (e.g., USD)
        // If product.currencyId is missing, assume it matches the product.price context (e.g. USD).

        const productPrice = new Decimal(product.price || '0');
        const productCurrencyId = product.currencyId;

        let finalPrice = productPrice;

        // Conversion Logic:
        // Case 1: Product USD -> Order USD => No Change
        // Case 2: Product USD -> Order VES => Price * Rate
        // Case 3: Product VES -> Order USD => Price / Rate
        // Case 4: Product VES -> Order VES => No Change

        // We assume 'orderRate' is price of 1 Unit of OrderCurrency in VES (e.g. 1 USD = 45 VES).
        // Wait, 'getLatestRate' usually returns VES per Currency (e.g. 45.00 for USD).

        // If Product is USD and Order is VES:
        // PriceUSD * Rate = PriceVES
        if (
          productCurrencyId !== targetCurrencyId &&
          productCurrencyId &&
          targetCurrencyId
        ) {
          // Check if Product is Foreign (USD) and Order is Base (VES)
          // How do we know which is base? We query currencies.isBase
          const productCurrency = await db.query.currencies.findFirst({
            where: eq(currencies.id, productCurrencyId),
          });
          const orderCurrency = await db.query.currencies.findFirst({
            where: eq(currencies.id, targetCurrencyId),
          });

          if (!productCurrency || !orderCurrency) continue;

          if (!productCurrency.isBase && orderCurrency.isBase) {
            // USD -> VES
            // We need Rate of ProductCurrency.
            // But 'orderRate' above was fetched for TargetCurrency (VES), which is 1.
            // We need Rate of ProductCurrency (USD).
            const prodRateStr =
              (await this.currenciesService.getLatestRate(productCurrencyId)) ||
              '1';
            const prodRate = new Decimal(prodRateStr);
            finalPrice = productPrice.times(prodRate);
          } else if (productCurrency.isBase && !orderCurrency.isBase) {
            // VES -> USD
            // We need Rate of OrderCurrency (USD).
            // 'orderRate' is 45.
            finalPrice = productPrice.div(orderRate);
          } else if (!productCurrency.isBase && !orderCurrency.isBase) {
            // USD -> EUR (Cross Rate) - Not supported yet, assume 1:1 or handle later
          }
        }

        // Update Item Price in DB
        await tx
          .update(orderItems)
          .set({ price: finalPrice.toFixed(2) })
          .where(eq(orderItems.id, item.id));

        newTotal = newTotal.plus(finalPrice.times(new Decimal(item.quantity)));
      }

      // 3. Update Order Header
      const [updatedOrder] = await tx
        .update(orders)
        .set({
          total: newTotal.toFixed(2),
          exchangeRate: orderRate.toFixed(10),
          // @ts-ignore
          currencyId: targetCurrencyId, // Ensure it is set
        })
        .where(eq(orders.id, id))
        .returning();

      return updatedOrder;
    });
  }
}
