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
  partners,
} from '@repo/db';
import { eq, desc, and, sql, inArray, or, ilike, SQL } from 'drizzle-orm';
import { CreateOrderDto } from './dto/create-order.dto';
import { FindOrdersDto } from './dto/find-orders.dto';
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
  async findAll(branchId: string, query: FindOrdersDto) {
    const { page = 1, limit = 10, search, type, status, partnerId } = query;
    const offset = (page - 1) * limit;

    const conditions = [eq(orders.branchId, branchId)];

    if (type && type.length > 0) {
      if (Array.isArray(type)) {
        conditions.push(inArray(orders.type, type));
      } else {
        conditions.push(eq(orders.type, type));
      }
    }

    if (status && status.length > 0) {
      if (Array.isArray(status)) {
        conditions.push(inArray(orders.status, status));
      } else {
        conditions.push(eq(orders.status, status));
      }
    }

    if (partnerId) conditions.push(eq(orders.partnerId, partnerId));

    if (search) {
      const searchTerms = search
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean);

      if (searchTerms.length > 0) {
        const termConditions = [];

        const matchingPartners = await db
          .select({ id: partners.id })
          .from(partners)
          .where(
            or(...searchTerms.map((term) => ilike(partners.name, `%${term}%`))),
          );

        const partnerIds = matchingPartners.map((p) => p.id);

        for (const term of searchTerms) {
          termConditions.push(ilike(orders.code, `%${term}%`));
        }

        if (partnerIds.length > 0) {
          termConditions.push(inArray(orders.partnerId, partnerIds));
        }

        if (termConditions.length > 0) {
          conditions.push(or(...termConditions)!);
        }
      }
    }

    const whereClause = and(...conditions) as SQL<unknown>;

    // 1. Get Total Count
    const [countResult] = await db
      .select({ count: sql<number>`count(*)` })
      .from(orders)
      .where(whereClause);

    const total = Number(countResult?.count || 0);

    // 2. Get Paginated Data
    const items = await db.query.orders.findMany({
      where: whereClause,
      limit,
      offset,
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

    return {
      data: items,
      meta: {
        total,
        page,
        lastPage: Math.ceil(total / limit),
      },
    };
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

  async getStats(branchId: string, type: string) {
    const stats = await db
      .select({
        status: orders.status,
        count: sql<number>`count(*)`,
      })
      .from(orders)
      .where(and(eq(orders.branchId, branchId), eq(orders.type, type)))
      .groupBy(orders.status);

    return stats;
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

      // FIX: Find the Foreign / Market Currency (Usually USD)
      // We need the rate of the FOREIGN currency to do conversions.
      // E.g. If Foreign is USD, we need rate ~45.00.

      const marketCurrency = await db.query.currencies.findFirst({
        where: eq(currencies.isBase, false), // Assuming Foreign is NOT base (VES is Base)
      });

      let orderRateStr = '1';

      if (marketCurrency) {
        orderRateStr =
          (await this.currenciesService.getLatestRate(marketCurrency.id)) ||
          '1';
      }

      const orderRate = new Decimal(orderRateStr);

      let newTotal = new Decimal(0);

      for (const item of order.items) {
        const product = item.product;
        // Product Price is usually stored in product.currencyId (e.g., USD)
        // If product.currencyId is missing, assume it matches the product.price context (e.g. USD).

        // Check if Purchase or Sale
        // If Purchase, we use COST. If Sale, we use PRICE.
        const basePrice =
          order.type === 'PURCHASE'
            ? new Decimal(product.cost || '0')
            : new Decimal(product.price || '0');

        const productPrice = basePrice;
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
            // Foreign (VES) -> Base (USD)
            // Example: 3500 VES -> $10 USD. Rate 350.
            // Operation: Divide by Rate.
            const prodRateStr =
              (await this.currenciesService.getLatestRate(productCurrencyId)) ||
              '1';
            const prodRate = new Decimal(prodRateStr);
            finalPrice = productPrice.div(prodRate);
          } else if (productCurrency.isBase && !orderCurrency.isBase) {
            // Base (USD) -> Foreign (VES)
            // Example: $10 USD -> 3500 VES. Rate 350.
            // Operation: Multiply by Rate.
            // We need the rate of the TARGET currency (VES).
            const targetRateStr =
              (await this.currenciesService.getLatestRate(targetCurrencyId)) ||
              '1';
            const targetRate = new Decimal(targetRateStr);
            finalPrice = productPrice.times(targetRate);
          } else if (!productCurrency.isBase && !orderCurrency.isBase) {
            // VES -> EUR (Not supported, assume 1:1)
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
