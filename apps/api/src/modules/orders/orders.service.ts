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
} from '@repo/db';
import { eq, desc, and } from 'drizzle-orm';
import { CreateOrderDto } from './dto/create-order.dto';
import Decimal from 'decimal.js';
import { CurrenciesService } from '../finance/currencies/currencies.service';

@Injectable()
export class OrdersService {
  constructor(
    private readonly inventoryService: InventoryService,
    private readonly billingService: BillingService,
    private readonly currenciesService: CurrenciesService,
  ) {}
  async findAll(branchId?: string) {
    const whereClause = branchId ? eq(orders.branchId, branchId) : undefined;
    return await db.query.orders.findMany({
      where: whereClause,
      orderBy: desc(orders.date),
      with: {
        partner: true,
        branch: true,
        warehouse: true,
        user: true,
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

      // Validate Stock if warehouse is selected
      if (data.warehouseId) {
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
          exchangeRate: data.exchangeRate?.toString() || '1',
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

      // Create Inventory Move (OUT)
      // We map order items to inventory move lines
      const moveLines = order.items.map((item) => ({
        productId: item.productId,
        quantity: parseFloat(item.quantity),
        cost: 0, // Cost will be calculated by inventory service or is irrelevant for OUT
      }));

      await this.inventoryService.createMove({
        type: 'OUT',
        lines: moveLines,
        fromWarehouseId: order.warehouseId,
        note: `Pedido Confirmado #${order.code}`,
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
        // Create Inventory Move (IN - Restocking)
        const moveLines = order.items.map((item) => ({
          productId: item.productId,
          quantity: parseFloat(item.quantity),
          cost: 0,
        }));

        await this.inventoryService.createMove({
          type: 'IN', // Treating as return/entry
          lines: moveLines,
          toWarehouseId: order.warehouseId!, // Return to same warehouse
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
      // Fetch default currency (VES) to get its UUID
      const currency = await db.query.currencies.findFirst({
        where: eq(currencies.code, 'VES'),
      });

      if (!currency) {
        throw new BadRequestException(
          'No se encontró la moneda base (VES) para facturar.',
        );
      }

      const defaultCurrencyId = currency.id;

      // Fetch latest exchange rate for VES (Target)
      const exchangeRateStr =
        (await this.currenciesService.getLatestRate(
          defaultCurrencyId,
          order.branchId,
        )) || '1.0000000000';
      const exchangeRate = new Decimal(exchangeRateStr);

      const invoiceItemsInput = order.items.map((item) => {
        const product = item.product;
        let finalPrice = new Decimal(product.price || '0');

        // Logic: Convert Product Base Price -> Invoice Currency (VES)
        if (product.currencyId && product.currencyId !== defaultCurrencyId) {
          finalPrice = finalPrice.times(exchangeRate);
        }

        return {
          productId: item.productId,
          quantity: new Decimal(item.quantity).toNumber(),
          price: finalPrice.toNumber(),
        };
      });

      const invoice = await this.billingService.createInvoice({
        partnerId: order.partnerId,
        branchId: order.branchId,
        currencyId: defaultCurrencyId,
        date: new Date().toISOString(),
        items: invoiceItemsInput,
        userId,
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

      // 1. Fetch Latest Exchange Rate (VES) for this branch
      const currency = await db.query.currencies.findFirst({
        where: eq(currencies.code, 'VES'),
      });
      if (!currency) throw new BadRequestException('Moneda VES no encontrada');
      const defaultCurrencyId = currency.id;

      const currentRateStr =
        (await this.currenciesService.getLatestRate(
          defaultCurrencyId,
          order.branchId,
        )) || '1.0000000000';
      const currentRate = new Decimal(currentRateStr);

      // 2. Recalculate Items
      let newTotal = new Decimal(0);

      for (const item of order.items) {
        const product = item.product;
        let finalPrice = new Decimal(product.price || '0');

        // Convert if Product is USD (or different from VES)
        if (product.currencyId && product.currencyId !== defaultCurrencyId) {
          finalPrice = finalPrice.times(currentRate);
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
          exchangeRate: currentRate.toFixed(10),
        })
        .where(eq(orders.id, id))
        .returning();

      return updatedOrder;
    });
  }
}
