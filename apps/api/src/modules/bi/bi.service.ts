import { Injectable } from '@nestjs/common';
import {
  db,
  invoices,
  stock,
  products,
  invoiceItems,
  orders,
  currencies,
  exchangeRates,
  warehouses,
} from '@repo/db';
import { eq, sql, sum, count, desc, and, gte, ne, inArray } from 'drizzle-orm';
import Decimal from 'decimal.js';
import { CurrenciesService } from '../finance/currencies/currencies.service';

@Injectable()
export class BiService {
  constructor(private readonly currenciesService: CurrenciesService) {}

  async getKpis(branchId?: string) {
    const fullKpis = await this.getKpisFull(branchId);
    return {
      totalSales: fullKpis.totalSales,
      accountsReceivable: fullKpis.accountsReceivable,
      activeProducts: fullKpis.activeProducts,
      inventoryValue: fullKpis.inventoryValue,
      pendingOrders: fullKpis.pendingOrders,
    };
  }

  async getKpisFull(branchId?: string) {
    // 1. Total Sales (Non-Draft)
    const salesWhere = and(
      ne(invoices.status, 'DRAFT'),
      ne(invoices.status, 'VOID'),
      branchId ? eq(invoices.branchId, branchId) : undefined,
    );
    const salesResult = await db
      .select({ value: sum(invoices.totalBase) })
      .from(invoices)
      .where(salesWhere);
    const totalSales = salesResult[0]?.value || '0';

    // 2. Pending Collections (Receivable)
    const pendingWhere = and(
      inArray(invoices.status, ['POSTED', 'PARTIALLY_PAID']),
      branchId ? eq(invoices.branchId, branchId) : undefined,
    );
    const pendingResult = await db
      .select({ value: sum(invoices.total) })
      .from(invoices)
      .where(pendingWhere);
    const totalPending = pendingResult[0]?.value || '0';

    // 3. Inventory Value (Stock * Cost)
    let stockQuery = db
      .select({
        value: sql<string>`sum(${stock.quantity} * ${products.cost})`,
      })
      .from(stock)
      .innerJoin(products, eq(stock.productId, products.id));

    if (branchId) {
      stockQuery = stockQuery
        .innerJoin(warehouses, eq(stock.warehouseId, warehouses.id))
        .where(eq(warehouses.branchId, branchId)) as any;
    }

    const inventoryResult = await stockQuery;
    const inventoryValue = inventoryResult[0]?.value || '0';

    // 4. Counts
    const productsResult = await db
      .select({ value: count(products.id) })
      .from(products);

    const pendingOrdersResult = await db
      .select({ value: count(orders.id) })
      .from(orders)
      .where(
        and(
          eq(orders.status, 'PENDING'),
          branchId ? eq(orders.branchId, branchId) : undefined,
        ),
      );

    return {
      totalSales: parseFloat(totalSales),
      accountsReceivable: parseFloat(totalPending),
      activeProducts: Number(productsResult[0]?.value) || 0,
      inventoryValue: parseFloat(inventoryValue),
      pendingOrders: Number(pendingOrdersResult[0]?.value) || 0,
    };
  }

  async getSalesChart(branchId?: string) {
    // Last 7 days sales
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const whereClause = and(
      gte(invoices.date, sevenDaysAgo),
      ne(invoices.status, 'DRAFT'),
      branchId ? eq(invoices.branchId, branchId) : undefined,
    );

    const rawdata = await db
      .select({
        date: invoices.date,
        total: invoices.totalBase,
      })
      .from(invoices)
      .where(whereClause)
      .orderBy(invoices.date);

    const aggregated: Record<string, number> = {};

    for (let i = 0; i < 7; i++) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      aggregated[d.toISOString().slice(0, 10)] = 0;
    }

    rawdata.forEach((Row) => {
      if (!Row.date) return;
      const key = Row.date.toISOString().slice(0, 10);
      if (aggregated[key] !== undefined) {
        aggregated[key] += parseFloat(Row.total || '0');
      }
    });

    return Object.entries(aggregated)
      .map(([date, total]) => ({ date, total }))
      .sort((a, b) => a.date.localeCompare(b.date));
  }
}
