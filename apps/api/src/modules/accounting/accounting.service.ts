import { Injectable } from '@nestjs/common';
import {
  db,
  accountingEntries,
  accountingEntryLines,
  accountingAccounts,
  accountingMaps,
  invoices,
  invoiceItems,
  inventoryMoves,
} from '@repo/db';
import { eq, and, desc, or, isNull } from 'drizzle-orm';
import { Decimal } from 'decimal.js';

@Injectable()
export class AccountingService {
  /**
   * Crea un asiento contable (Journal Entry)
   */
  async createEntry(data: {
    date: Date;
    description: string;
    reference?: string;
    branchId: string;
    userId?: string;
    lines: {
      accountId: string;
      debit: number;
      credit: number;
      description?: string;
    }[];
  }) {
    return await db.transaction(async (tx) => {
      // 1. Create Header
      const [entry] = await tx
        .insert(accountingEntries)
        .values({
          date: data.date,
          description: data.description,
          reference: data.reference,
          branchId: data.branchId,
          userId: data.userId,
          status: 'POSTED',
        } as any)
        .returning();

      // 2. Create Lines
      if (data.lines.length > 0) {
        await tx.insert(accountingEntryLines).values(
          data.lines.map((l) => ({
            entryId: entry.id,
            accountId: l.accountId,
            debit: new Decimal(l.debit).toFixed(2),
            credit: new Decimal(l.credit).toFixed(2),
            description: l.description || data.description,
          })),
        );
      }

      return entry;
    });
  }

  /**
   * Busca o crea una cuenta contable por código y nombre.
   * Útil para asegurar que existen las cuentas base (Sueldos, Pasivos Laborales).
   */
  async ensureAccount(data: {
    code: string;
    name: string;
    type: 'ASSET' | 'LIABILITY' | 'EQUITY' | 'INCOME' | 'EXPENSE';
    branchId: string;
  }) {
    const existing = await db.query.accountingAccounts.findFirst({
      where: and(
        eq(accountingAccounts.code, data.code),
        eq(accountingAccounts.branchId, data.branchId),
      ),
    });

    if (existing) return existing;

    const [created] = await db
      .insert(accountingAccounts)
      .values({
        code: data.code,
        name: data.name,
        type: data.type,
        branchId: data.branchId,
        isActive: true,
      } as any)
      .returning();

    return created;
  }

  /**
   * Encuentra el mapa contable más específico para los criterios dados.
   * Prioridad: Producto específico > Categoría > Global (sólo módulo)
   */
  async findMap(data: {
    branchId: string;
    module: string;
    transactionType?: string;
    categoryId?: string;
    productId?: string;
    paymentMethodId?: string;
  }) {
    const maps = await db
      .select()
      .from(accountingMaps)
      .where(
        and(
          eq(accountingMaps.branchId, data.branchId),
          eq(accountingMaps.module, data.module),
          data.transactionType
            ? eq(accountingMaps.transactionType, data.transactionType)
            : undefined,
          // Match specific criteria or null (general)
          or(
            data.productId
              ? eq(accountingMaps.productId, data.productId)
              : undefined,
            isNull(accountingMaps.productId),
          ),
          or(
            data.categoryId
              ? eq(accountingMaps.categoryId, data.categoryId)
              : undefined,
            isNull(accountingMaps.categoryId),
          ),
          or(
            data.paymentMethodId
              ? eq(accountingMaps.paymentMethodId, data.paymentMethodId)
              : undefined,
            isNull(accountingMaps.paymentMethodId),
          ),
        ),
      )
      .orderBy(
        // Prioritize specific matches over nulls
        desc(accountingMaps.productId),
        desc(accountingMaps.categoryId),
        desc(accountingMaps.paymentMethodId),
      )
      .limit(1);

    return maps[0];
  }

  /**
   * Crea un asiento contable automáticamente usando un mapa.
   */
  async createEntryFromMap(data: {
    branchId: string;
    date: Date;
    description: string;
    reference: string;
    amount: number;
    userId?: string;
    // Map Criteria
    module: string;
    transactionType?: string;
    categoryId?: string;
    productId?: string;
    paymentMethodId?: string;
  }) {
    const map = await this.findMap(data);

    if (!map) {
      // In strict mode, throw.
      // For now, log and maybe return null or draft without accounts?
      // Let's create a DRAFT entry with 0 lines or fail.
      throw new Error(
        `No se encontró configuración contable para ${data.module} / ${data.transactionType}`,
      );
    }

    if (!map.debitAccountId || !map.creditAccountId) {
      throw new Error(
        `El mapa contable ${map.id} no tiene cuentas completas (Debe/Haber).`,
      );
    }

    return this.createEntry({
      branchId: data.branchId,
      date: data.date,
      description: data.description,
      reference: data.reference,
      userId: data.userId,
      lines: [
        {
          accountId: map.debitAccountId,
          debit: data.amount,
          credit: 0,
        },
        {
          accountId: map.creditAccountId,
          debit: 0,
          credit: data.amount,
        },
      ],
    });
  }

  /**
   * Genera el asiento contable para una factura de VENTA (Sale).
   * - Debe: Cuentas por Cobrar (SALES_AR)
   * - Haber: Ingresos por Ventas (SALES_REVENUE) desglosado por producto
   * - Haber: Débito Fiscal IVA (TAX_IVA)
   */
  async createEntryForInvoice(invoiceId: string) {
    return await db.transaction(async (tx) => {
      const invoice = await tx.query.invoices.findFirst({
        where: eq(invoices.id, invoiceId),
        with: {
          items: {
            with: {
              product: true,
            },
          },
        },
      });

      if (!invoice) throw new Error('Factura no encontrada para contabilizar');
      if (invoice.type !== 'SALE')
        throw new Error('Solo se soporta contabilización de Ventas por ahora');

      // 1. Find AR Account (Sales Accounts Receivable)
      // Criteria: module=SALES, transactionType=INVOICE_AR
      const arMap = await this.findMap({
        branchId: invoice.branchId,
        module: 'SALES',
        transactionType: 'INVOICE_AR',
      });

      if (!arMap?.debitAccountId) {
        throw new Error(
          'Configuración incompleta: No se encontró cuenta de Cuentas por Cobrar (SALES / INVOICE_AR)',
        );
      }
      const arAccount = arMap.debitAccountId;

      // 2. Find TAX Account (IVA)
      // Criteria: module=TAXES, transactionType=IVA_OUTPUT
      const taxMap = await this.findMap({
        branchId: invoice.branchId,
        module: 'TAXES',
        transactionType: 'IVA_OUTPUT',
      });
      // Allow missing tax map if tax is 0? No, safer to fail or warn.
      const taxAccount = taxMap?.creditAccountId;

      const lines = [];

      // A. Account Receivable (Total Amount) -> DEBIT
      lines.push({
        accountId: arAccount,
        debit: parseFloat(invoice.total || '0'),
        credit: 0,
        description: `Cuentas por Cobrar - Factura ${invoice.code}`,
      });

      // B. Tax (Total Tax) -> CREDIT
      if (parseFloat(invoice.totalTax || '0') > 0) {
        if (!taxAccount)
          throw new Error(
            'Configuración incompleta: No se encontró cuenta de IVA Débito Fiscal (TAXES / IVA_OUTPUT)',
          );
        lines.push({
          accountId: taxAccount,
          debit: 0,
          credit: parseFloat(invoice.totalTax || '0'),
          description: `Débito Fiscal IVA - Factura ${invoice.code}`,
        });
      }

      // C. Revenue (Per Item) -> CREDIT
      for (const item of invoice.items) {
        const revenueMap = await this.findMap({
          branchId: invoice.branchId,
          module: 'SALES',
          transactionType: 'SALES_REVENUE',
          productId: item.productId,
          categoryId: item.product.categoryId || undefined,
        });

        if (!revenueMap?.creditAccountId) {
          throw new Error(
            `Configuración incompleta: No se encontró cuenta de Ingresos para producto ${item.product.sku} (SALES / SALES_REVENUE)`,
          );
        }

        const baseAmount = new Decimal(item.price).times(
          new Decimal(item.quantity),
        );

        lines.push({
          accountId: revenueMap.creditAccountId,
          debit: 0,
          credit: baseAmount.toNumber(),
          description: `Venta ${item.product.name} x${item.quantity}`,
        });
      }

      // 3. Create Entry calls existing createEntry
      return await this.createEntry({
        date: invoice.date || new Date(),
        description: `Venta Factura ${invoice.code}`,
        reference: invoice.code,
        branchId: invoice.branchId,
        userId: invoice.userId || undefined,
        lines,
      });
    });
  }
  /**
   * Genera el asiento de Costo de Ventas o Ajuste de Inventario.
   */
  async createEntryForInventoryMove(moveId: string) {
    return await db.transaction(async (tx) => {
      const move = await tx.query.inventoryMoves.findFirst({
        where: eq(inventoryMoves.id, moveId),
        with: {
          lines: {
            with: {
              product: true,
            },
          },
          fromWarehouse: true,
          toWarehouse: true,
        },
      });

      if (!move) throw new Error('Movimiento no encontrado');

      // Resolve Branch ID from warehouses
      const branchId =
        move.fromWarehouse?.branchId || move.toWarehouse?.branchId;
      if (!branchId) {
        throw new Error(
          'No se pudo determinar la sucursal del movimiento de inventario',
        );
      }

      // Logic depends on Type
      // OUT (Sale/Adjustment): Debit COGS/Loss, Credit Inventory
      // IN (Adjustment): Debit Inventory, Credit Gain
      // IN (Purchase): Handled by Invoice usually, but if independent?

      const lines = [];

      for (const line of move.lines) {
        // 1. Find Inventory Asset Account (Credit for OUT, Debit for IN)
        const assetMap = await this.findMap({
          branchId: branchId,
          module: 'INVENTORY',
          transactionType: 'ASSET',
          productId: line.productId,
          categoryId: line.product.categoryId || undefined,
        });

        if (!assetMap?.debitAccountId)
          throw new Error(
            `No cuenta Activo Inventario para ${line.product.sku}`,
          );

        // 2. Find Contra Account (COGS or Adjustment)
        let contraType = 'COGS'; // Default for OUT
        if (move.type === 'ADJUST') contraType = 'ADJUSTMENT';
        // if (move.type === 'IN') contraType = 'GRNI'?

        const contraMap = await this.findMap({
          branchId: branchId,
          module: 'INVENTORY',
          transactionType: contraType,
          productId: line.productId,
          categoryId: line.product.categoryId || undefined,
        });

        if (!contraMap?.debitAccountId)
          throw new Error(
            `No cuenta Contrapartida (${contraType}) para ${line.product.sku}`,
          );

        const cost = parseFloat(line.cost || line.product.cost || '0');
        const total = new Decimal(line.quantity).times(cost).toNumber();

        if (move.type === 'OUT') {
          // Credit Inventory (Asset), Debit COGS (Expense)
          lines.push({
            accountId: assetMap.debitAccountId, // Asset Account
            debit: 0,
            credit: total,
            description: `Salida Inventario ${line.product.sku}`,
          });
          lines.push({
            accountId: contraMap.debitAccountId, // COGS Account
            debit: total,
            credit: 0,
            description: `Costo de Ventas ${line.product.sku}`,
          });
        } else if (move.type === 'IN' || move.type === 'ADJUST') {
          // Detail: IN Adjustment -> Debit Inventory, Credit Gain
          // IN Purchase -> Debit Inventory, Credit GRNI/AP (Skip if Invoice)

          // For IN:
          lines.push({
            accountId: assetMap.debitAccountId, // Asset
            debit: total,
            credit: 0,
            description: `Entrada Inventario ${line.product.sku}`,
          });
          lines.push({
            accountId: contraMap.creditAccountId || contraMap.debitAccountId, // Use Credit ID if Gain?
            debit: 0,
            credit: total,
            description: `Contrapartida Entrada ${line.product.sku}`,
          });
        }
      }

      if (lines.length > 0) {
        return await this.createEntry({
          date: move.date || new Date(),
          description: `Movimiento Inventario ${move.code} (${move.type})`,
          reference: move.code,
          branchId: branchId,
          userId: move.userId || undefined,
          lines,
        });
      }
    });
  }
}
