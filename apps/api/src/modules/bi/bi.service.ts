import { Injectable } from '@nestjs/common';
import {
  db,
  invoices,
  stock,
  products,
  orders,
  warehouses,
  payments,
  paymentMethods,
  inventoryMoves,
} from '@repo/db';
import { eq, sql, sum, count, and, gte, ne, inArray, lte, desc } from 'drizzle-orm';
import { CurrenciesService } from '../settings/currencies/currencies.service';

@Injectable()
export class BiService {
  constructor(private readonly currenciesService: CurrenciesService) {}

  private getDateRange(startDate?: string, endDate?: string) {
    const end = endDate ? new Date(endDate) : new Date();
    const start = startDate ? new Date(startDate) : new Date();
    if (!startDate) start.setDate(end.getDate() - 30); // Default 30 days
    return { start, end };
  }

  async getKpis(branchId?: string, startDate?: string, endDate?: string) {
    const { start, end } = this.getDateRange(startDate, endDate);

    // 1. Total Sales (Period)
    const salesWhere = and(
      ne(invoices.status, 'DRAFT'),
      ne(invoices.status, 'VOID'),
      eq(invoices.type, 'SALE'),
      gte(invoices.date, start),
      lte(invoices.date, end),
      branchId ? eq(invoices.branchId, branchId) : undefined,
    );

    const salesResult = await db
      .select({ value: sum(invoices.totalBase) })
      .from(invoices)
      .where(salesWhere);
    const totalSales = parseFloat(salesResult[0]?.value || '0');

    // 2. Total Purchases (Period)
    const purchasesWhere = and(
      ne(invoices.status, 'DRAFT'),
      ne(invoices.status, 'VOID'),
      eq(invoices.type, 'PURCHASE'),
      gte(invoices.date, start),
      lte(invoices.date, end),
      branchId ? eq(invoices.branchId, branchId) : undefined,
    );
    const purchasesResult = await db
      .select({ value: sum(invoices.totalBase) })
      .from(invoices)
      .where(purchasesWhere);
    const totalPurchases = parseFloat(purchasesResult[0]?.value || '0');

    // 3. Accounts Receivable (Total Open Invoices) - Not filtered by date, but by status
    const pendingWhere = and(
      inArray(invoices.status, ['POSTED', 'PARTIALLY_PAID']),
      eq(invoices.type, 'SALE'),
      branchId ? eq(invoices.branchId, branchId) : undefined,
    );
    const pendingResult = await db
      .select({ value: sum(invoices.total) })
      .from(invoices)
      .where(pendingWhere);
    const totalPending = parseFloat(pendingResult[0]?.value || '0');

    // 4. Inventory Value
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
    const inventoryValue = parseFloat(inventoryResult[0]?.value || '0');

    // 5. Active Products Count
    const productsResult = await db
      .select({ value: count(products.id) })
      .from(products);
    
    // 6. Pending Orders
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
      totalSales,
      totalPurchases,
      accountsReceivable: totalPending,
      activeProducts: Number(productsResult[0]?.value) || 0,
      inventoryValue,
      pendingOrders: Number(pendingOrdersResult[0]?.value) || 0,
    };
  }

  async getFinancialChart(branchId?: string, startDate?: string, endDate?: string) {
    const { start, end } = this.getDateRange(startDate, endDate);

    // Get Daily Income (Sales)
    const incomeData = await db
      .select({
        date: sql<string>`DATE(${invoices.date})`,
        total: sum(invoices.totalBase),
      })
      .from(invoices)
      .where(
        and(
          eq(invoices.type, 'SALE'),
          ne(invoices.status, 'DRAFT'),
          ne(invoices.status, 'VOID'),
          gte(invoices.date, start),
          lte(invoices.date, end),
          branchId ? eq(invoices.branchId, branchId) : undefined,
        ),
      )
      .groupBy(sql`DATE(${invoices.date})`)
      .orderBy(sql`DATE(${invoices.date})`);

    // Get Daily Expense (Purchases)
    const expenseData = await db
      .select({
        date: sql<string>`DATE(${invoices.date})`,
        total: sum(invoices.totalBase),
      })
      .from(invoices)
      .where(
        and(
          eq(invoices.type, 'PURCHASE'),
          ne(invoices.status, 'DRAFT'),
          ne(invoices.status, 'VOID'),
          gte(invoices.date, start),
          lte(invoices.date, end),
          branchId ? eq(invoices.branchId, branchId) : undefined,
        ),
      )
      .groupBy(sql`DATE(${invoices.date})`)
      .orderBy(sql`DATE(${invoices.date})`);

    // Merge Data
    const map = new Map<string, { income: number; expense: number }>();
    
    // Initialize dates
    for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
      map.set(d.toISOString().slice(0, 10), { income: 0, expense: 0 });
    }

    incomeData.forEach((row) => {
      const key = new Date(row.date).toISOString().slice(0, 10);
      if (map.has(key)) {
        const entry = map.get(key)!;
        entry.income = parseFloat(row.total || '0');
      }
    });

    expenseData.forEach((row) => {
      const key = new Date(row.date).toISOString().slice(0, 10);
      if (map.has(key)) {
        const entry = map.get(key)!;
        entry.expense = parseFloat(row.total || '0');
      }
    });

    return Array.from(map.entries())
      .map(([date, values]) => ({ date, ...values }))
      .sort((a, b) => a.date.localeCompare(b.date));
  }

  async getRecentActivity(branchId?: string, limit = 10) {
    // Combine Invoices, Payments, Inventory Moves
    
    // 1. Invoices (Sales/Purchases)
    const recentInvoices = await db
      .select({
        id: invoices.id,
        type: invoices.type,
        code: invoices.code,
        date: invoices.date,
        total: invoices.total,
        status: invoices.status,
      })
      .from(invoices)
      .where(
        and(
            branchId ? eq(invoices.branchId, branchId) : undefined,
            ne(invoices.status, 'DRAFT')
        )
      )
      .orderBy(desc(invoices.date))
      .limit(limit);

    // 2. Payments
    const recentPayments = await db
      .select({
        id: payments.id,
        type: sql<string>`'PAYMENT'`,
        code: payments.reference, // or method code
        date: payments.date,
        total: payments.amount,
        status: payments.type, // INCOME / EXPENSE
      })
      .from(payments)
      .where(branchId ? eq(payments.branchId, branchId) : undefined)
      .orderBy(desc(payments.date))
      .limit(limit);

    // 3. Inventory Adjustments
    const recentMoves = await db
      .select({
        id: inventoryMoves.id,
        type: inventoryMoves.type, // ADJUST, TRANSFER
        code: inventoryMoves.code,
        date: inventoryMoves.date,
        total: sql<string>`'0'`, // No monetary value easily accessible in header
        status: sql<string>`'COMPLETED'`,
      })
      .from(inventoryMoves)
      .where(
         and(
            branchId ? eq(inventoryMoves.fromWarehouseId, sql`(SELECT id FROM warehouses WHERE branch_id = ${branchId} LIMIT 1)`) : undefined,
            // Simple approach for now
         )
      )
      .orderBy(desc(inventoryMoves.date))
      .limit(limit);
    
    // Combine and Sort
    const combined = [
        ...recentInvoices.map(i => ({...i, entity: 'INVOICE'})),
        ...recentPayments.map(p => ({...p, entity: 'PAYMENT'})),
        ...recentMoves.map(m => ({...m, entity: 'INVENTORY'}))
    ];

    return combined
        .sort((a, b) => new Date(b.date!).getTime() - new Date(a.date!).getTime())
        .slice(0, limit);
  }
}
