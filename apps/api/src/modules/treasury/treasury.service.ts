import { Injectable, BadRequestException } from '@nestjs/common';
// Trigger rebuild
import {
  db,
  payments,
  invoices,
  paymentMethods,
  creditNotes,
  currencies,
  paymentAllocations,
  bankAccounts,
  paymentMethodAccounts,
  users,
} from '@repo/db';

import { eq, sql, and, desc } from 'drizzle-orm';
import Decimal from 'decimal.js';
import { CurrenciesService } from '../finance/currencies/currencies.service';

@Injectable()
export class TreasuryService {
  constructor(private readonly currenciesService: CurrenciesService) {}

  // ... (existing code) ...

  async findAllMethods(branchId?: string) {
    return await db.query.paymentMethods.findMany({
      where: branchId ? eq(paymentMethods.branchId, branchId) : undefined,
      with: {
        allowedAccounts: true,
      },
    });
  }

  async updateMethodAccounts(methodId: string, accountIds: string[]) {
    return await db.transaction(async (tx) => {
      // Clear existing
      await tx
        .delete(paymentMethodAccounts)
        .where(eq(paymentMethodAccounts.methodId, methodId));

      // Insert new
      if (accountIds.length > 0) {
        await tx.insert(paymentMethodAccounts).values(
          accountIds.map((accId) => ({
            methodId,
            bankAccountId: accId,
          })),
        );
      }
      return { success: true };
    });
  }

  async registerPayment(data: {
    invoiceId?: string;
    partnerId: string;
    methodId: string;
    currencyId: string;
    amount: string;
    reference?: string;
    metadata?: any;
    allocations?: { invoiceId: string; amount: number }[];
    bankAccountId?: string;
    userId?: string;
    branchId?: string;
  }) {
    return await db.transaction(async (tx) => {
      // Check for duplicate reference
      if (data.reference) {
        const whereConditions = [eq(payments.reference, data.reference)];

        if (data.bankAccountId) {
          // If bank account is specified, reference must be unique for THAT account
          whereConditions.push(eq(payments.bankAccountId, data.bankAccountId));
        } else {
          // Fallback: If no bank account (e.g. some cash/legacy), scope by Method
          whereConditions.push(eq(payments.methodId, data.methodId));
        }

        const existingRef = await tx
          .select()
          .from(payments)
          .where(and(...whereConditions));

        if (existingRef.length > 0) {
          throw new BadRequestException(
            `Ya existe un pago con la referencia "${data.reference}" en este destino (Banco/Método).`,
          );
        }
      }

      const amount = new Decimal(data.amount);

      // Fetch latest exchange rate
      // Fetch latest exchange rate
      const exchangeRate =
        (await this.currenciesService.getLatestRate(data.currencyId)) ||
        '1.0000000000';

      // Determine type based on invoice
      let paymentType = 'INCOME';
      if (data.invoiceId) {
        const [invoice] = await tx
          .select()
          .from(invoices)
          .where(eq(invoices.id, data.invoiceId));
        if (invoice && invoice.type === 'PURCHASE') {
          paymentType = 'EXPENSE';
        }
      }

      // Insert Payment
      const [payment] = await tx
        .insert(payments)
        .values({
          invoiceId: data.invoiceId, // Keep for legacy/single compat
          partnerId: data.partnerId,
          methodId: data.methodId,
          currencyId: data.currencyId,
          branchId: data.branchId, // Save branchId
          amount: amount.toFixed(2),
          type: paymentType as 'INCOME' | 'EXPENSE',
          exchangeRate,
          bankAccountId: data.bankAccountId || null,
          reference: data.reference,
          metadata: data.metadata,
          userId: data.userId,
        } as any)
        .returning();

      // Update Bank Account Balance
      if (data.bankAccountId) {
        await tx
          .update(bankAccounts)
          .set({
            currentBalance: sql`${bankAccounts.currentBalance} + ${data.amount}`,
          })
          .where(eq(bankAccounts.id, data.bankAccountId));
      }

      // Handle Allocations
      const allocations = data.allocations || [];

      // If legacy invoiceId provided AND not in allocations, add it
      if (
        data.invoiceId &&
        !allocations.some((a) => a.invoiceId === data.invoiceId)
      ) {
        allocations.push({
          invoiceId: data.invoiceId,
          amount: amount.toNumber(),
        });
      }

      if (allocations.length > 0) {
        await tx.insert(paymentAllocations).values(
          allocations.map((a) => ({
            paymentId: payment.id,
            invoiceId: a.invoiceId,
            amount: a.amount.toString(),
          })),
        );
      }

      // Helper to update invoice status
      const updateInvoiceStatus = async (invoiceId: string) => {
        const [inv] = await tx
          .select()
          .from(invoices)
          .where(eq(invoices.id, invoiceId));
        if (!inv) return;

        // Sum Legacy Payments (Direct link AND NOT in allocations table to avoid double count)
        // Since we just inserted allocation for this payment, the new payment IS in allocations.
        // So we only care about OLD legacy payments that imply 1:1.
        // Complex query? prefer simple:
        // Total = Sum(Allocation.amount where invoiceId)
        //       + Sum(Payment.amount where invoiceId AND id NOT IN (select paymentId from Allocations))

        // 1. Allocations Sum
        const allocs = await tx
          .select()
          .from(paymentAllocations)
          .where(eq(paymentAllocations.invoiceId, invoiceId));
        const allocSum = allocs.reduce(
          (sum, a) => sum.plus(new Decimal(a.amount)),
          new Decimal(0),
        );

        // 2. Legacy Direct Sum (excluding those that have allocations)
        // We can just fetch all payments with invoiceId, and filter in JS if list is small, or use SQL.
        // Let's use JS filter for safety/simplicity given ORM limitations on subqueries sometimes.
        const directPayments = await tx
          .select()
          .from(payments)
          .where(eq(payments.invoiceId, invoiceId));

        // We need to check if these direct payments have allocations.
        // Efficient way: Get all allocation paymentIds for this invoice? No, for ANY invoice.
        // Better: "If a payment has ANY allocation record, ignore its direct invoiceId link for calculation purposes".
        // Ensure we don't count it twice.
        // Since we just inserted allocation for current payment, it WILL have allocation.

        // For now, let's assume we are migrating fully to allocations for New payments.
        // Old payments don't have allocations.
        // So:
        // If a payment is in `allocs` list (by paymentId), we count it via Allocations.
        // If a payment is NOT in `allocs` list (by paymentId) BUT is in `directPayments` list...
        // Wait, `allocs` list contains `paymentAllocations` records, which have `paymentId`.

        const allocatedPaymentIds = new Set(allocs.map((a) => a.paymentId));

        let totalPaid = allocSum;

        for (const dp of directPayments) {
          if (!allocatedPaymentIds.has(dp.id)) {
            totalPaid = totalPaid.plus(new Decimal(dp.amount));
          }
        }

        const invoiceTotal = new Decimal(inv.total || 0);
        let newStatus = 'POSTED';

        if (totalPaid.gte(invoiceTotal.minus(0.01))) {
          newStatus = 'PAID';
        } else if (totalPaid.gt(0)) {
          newStatus = 'PARTIALLY_PAID';
        }

        if (newStatus !== inv.status) {
          await tx
            .update(invoices)
            .set({ status: newStatus })
            .where(eq(invoices.id, invoiceId));
        }
      };

      // Update All Affected Invoices
      const uniqueInvoiceIds = [
        ...new Set(allocations.map((a) => a.invoiceId)),
      ];
      for (const invId of uniqueInvoiceIds) {
        await updateInvoiceStatus(invId);
      }

      return payment;
    });
  }

  async findAllPayments(branchId?: string) {
    const whereClause = branchId ? eq(payments.branchId, branchId) : undefined;
    const rows = await db
      .select()
      .from(payments)
      .leftJoin(users, eq(payments.userId, users.id))
      .leftJoin(bankAccounts, eq(payments.bankAccountId, bankAccounts.id))
      .where(whereClause);

    // Map to expected structure
    return rows.map(({ payments, users, bank_accounts }) => ({
      ...payments,
      user: users ? { id: users.id, name: users.name } : null,
      bankAccount: bank_accounts
        ? { id: bank_accounts.id, name: bank_accounts.name }
        : null,
    }));
  }

  async getAccountStatement(partnerId: string, branchId?: string) {
    // 1. Fetch transactions
    const [partnerInvoices, partnerPayments, partnerCreditNotes] =
      await Promise.all([
        db.query.invoices.findMany({
          where: and(
            eq(invoices.partnerId, partnerId),
            sql`${invoices.status} IN ('POSTED', 'PARTIALLY_PAID', 'PAID')`,
            branchId ? eq(invoices.branchId, branchId) : undefined,
          ),
          orderBy: desc(invoices.date),
          with: { currency: true },
        }),
        db.query.payments.findMany({
          where: and(
            eq(payments.partnerId, partnerId),
            branchId ? eq(payments.branchId, branchId) : undefined,
          ),
          // with: {
          //   method: true,
          //   currency: true,
          // },
        }),
        db.query.creditNotes.findMany({
          where: and(
            eq(creditNotes.partnerId, partnerId),
            sql`${creditNotes.status} = 'POSTED'`,
            branchId ? eq(creditNotes.branchId, branchId) : undefined,
          ),
          orderBy: desc(creditNotes.id),
          with: { currency: true },
        }),
      ]);

    // 2. Normalize transactions
    const transactions = [];

    for (const inv of partnerInvoices) {
      transactions.push({
        id: inv.id,
        date: inv.date ? new Date(inv.date) : new Date(),
        type: 'INVOICE',
        reference: inv.code,
        description: `Factura ${inv.code}`,
        debit: Number(inv.total), // Charge to customer
        credit: 0,
        currency: inv.currency ? inv.currency.code : 'VES',
        status: inv.status,
      });
    }

    // Fetch auxiliary data manually to avoid relation issues
    const allMethods = await db.select().from(paymentMethods);
    const methodMap = new Map(allMethods.map((m) => [m.id, m]));

    const allCurrencies = await db.select().from(currencies);
    const currencyMap = new Map(allCurrencies.map((c) => [c.id, c]));

    for (const p of partnerPayments) {
      const pay = p as any;
      const method = methodMap.get(pay.methodId);
      const currency = currencyMap.get(pay.currencyId);

      const isBalancePayment = method?.code?.startsWith('BALANCE');
      const creditAmount = isBalancePayment ? 0 : Number(pay.amount);

      transactions.push({
        id: pay.id,
        date: pay.date ? new Date(pay.date) : new Date(),
        type: 'PAYMENT',
        reference: pay.reference || '-',
        description: `Pago ${method ? method.name : ''} ${isBalancePayment ? `(Cruce) - Monto: ${Number(pay.amount).toFixed(2)}` : ''}`,
        debit: 0,
        credit: creditAmount,
        currency: currency ? currency.code : 'VES',
        status: 'COMPLETED',
        // Optional: pass real amount for UI display even if credit is 0
        realAmount: Number(pay.amount),
      });
    }

    for (const cn of partnerCreditNotes) {
      // @ts-ignore
      const date = cn.date || cn.createdAt || new Date();
      transactions.push({
        id: cn.id,
        date: new Date(date),
        type: 'CREDIT_NOTE',
        reference: cn.code,
        description: `Nota de Crédito ${cn.code}`,
        debit: 0,
        credit:
          Number(cn.totalBase) + Number(cn.totalTax) + Number(cn.totalIgtf), // Reduces balance
        currency: cn.currency ? cn.currency.code : 'VES',
        status: cn.status,
      });
    }

    // 3. Sort Chronologically
    transactions.sort((a, b) => a.date.getTime() - b.date.getTime());

    // 4. Calculate Running Balance
    let balance = 0;
    const result = transactions.map((t) => {
      balance += t.debit - t.credit;
      return { ...t, balance };
    });

    // 5. Calculate Unused Balance (Saldo Sin Ocupar)
    // Formula: (Credit Notes + Unallocated Payments) - (Balance Usage aka Cross Payments)

    // A. Credit Notes Total
    const totalCreditNotes = partnerCreditNotes.reduce((sum, cn) => {
      const total =
        Number(cn.totalBase) + Number(cn.totalTax) + Number(cn.totalIgtf);
      return sum + total;
    }, 0);

    const paymentsWithAllocations = await db.query.payments.findMany({
      where: eq(payments.partnerId, partnerId),
      with: {
        method: true,
        allocations: true,
      },
    });

    let totalUnallocatedPayments = 0;
    let totalBalanceUsed = 0;

    for (const p of paymentsWithAllocations) {
      const amount = Number(p.amount);
      const isBalance = p.method?.code?.startsWith('BALANCE');

      if (isBalance) {
        totalBalanceUsed += amount;
      } else {
        // Calculate allocated amount
        let allocated = p.allocations.reduce(
          (sum, a) => sum + Number(a.amount),
          0,
        );

        // Legacy handling: if linked to invoice and NOT in allocations table
        if (p.invoiceId && p.allocations.length === 0) {
          allocated += amount; // Assume fully allocated
        }

        const rem = Math.max(0, amount - allocated);
        totalUnallocatedPayments += rem;
      }
    }

    const unusedBalance =
      totalCreditNotes + totalUnallocatedPayments - totalBalanceUsed;

    return {
      partnerId,
      balance,
      unusedBalance: Math.max(0, unusedBalance), // Safety floor
      transactions: result.reverse(), // Show newest first
    };
  }

  async getDailyClose(dateStr: string, branchId?: string) {
    const startOfDay = new Date(dateStr);
    startOfDay.setHours(0, 0, 0, 0);

    const endOfDay = new Date(dateStr);
    endOfDay.setHours(23, 59, 59, 999);

    const whereClause = and(
      sql`${payments.date} >= ${startOfDay.toISOString()}`,
      sql`${payments.date} <= ${endOfDay.toISOString()}`,
      branchId ? eq(payments.branchId, branchId) : undefined,
    );

    // Fetch payments for the day
    const dailyPayments = await db.query.payments.findMany({
      where: whereClause,
    });

    const allMethods = await db.select().from(paymentMethods);
    const methodMap = new Map(allMethods.map((m) => [m.id, m]));

    const allCurrencies = await db.select().from(currencies);
    const currencyMap = new Map(allCurrencies.map((c) => [c.id, c]));

    const totalsByCurrency: Record<string, number> = {};
    const byMethod: any[] = [];

    // Grouping map: key = currencyId_methodId
    const groups = new Map<
      string,
      { currencyId: string; methodId: string; amount: Decimal; count: number }
    >();

    for (const p of dailyPayments) {
      const method = methodMap.get(p.methodId);

      // Skip internal Balance payments for Cash Audit
      if (method?.code?.startsWith('BALANCE')) continue;

      const key = `${p.currencyId}_${p.methodId}`;
      const existing = groups.get(key);
      const current = existing || {
        currencyId: p.currencyId,
        methodId: p.methodId,
        amount: new Decimal(0),
        count: 0,
      };

      current.amount = current.amount.plus(new Decimal(p.amount));
      current.count += 1;
      groups.set(key, current);
    }

    // Format results
    for (const [key, val] of groups.entries()) {
      const currency = currencyMap.get(val.currencyId);
      const method = methodMap.get(val.methodId);
      const currencyCode = currency?.code || 'UNK';

      // Update Totals
      if (!totalsByCurrency[currencyCode]) totalsByCurrency[currencyCode] = 0;
      totalsByCurrency[currencyCode] += val.amount.toNumber();

      byMethod.push({
        method: method?.name || 'Unknown',
        currency: currencyCode,
        amount: val.amount.toNumber(),
        count: val.count,
      });
    }

    return {
      date: dateStr,
      totals: totalsByCurrency,
      byMethod,
    };
  }
  async findAllRetentions(type: 'IVA' | 'ISLR', branchId?: string) {
    const searchString = type === 'IVA' ? 'RET_IVA' : 'RET_ISLR';

    // We look for payments where metadata->>'type' like 'RET_IVA%' or 'RET_ISLR'
    // Or check method code via join.
    // Drizzle JSON filtering is tricky.
    // Easier approach: Join with paymentMethods and filter by code.

    const rows = await db
      .select({
        id: payments.id,
        date: payments.date,
        reference: payments.reference,
        amount: payments.amount,
        metadata: payments.metadata,
        partnerName: sql<string>`"partners"."name"`,
        partnerTaxId: sql<string>`"partners"."tax_id"`,
        invoiceCode: sql<string>`"invoices"."code"`,
        invoiceTotalBase: sql<string>`"invoices"."total_base"`,
        invoiceTotalTax: sql<string>`"invoices"."total_tax"`,
        invoiceTotal: sql<string>`"invoices"."total"`,
      })
      .from(payments)
      .leftJoin(paymentMethods, eq(payments.methodId, paymentMethods.id))
      .leftJoin(
        sql`"partners"`, // Assuming 'partners' table exists and is linked
        eq(payments.partnerId, sql`"partners"."id"`),
      )
      .leftJoin(invoices, eq(payments.invoiceId, invoices.id)) // Legacy link for now
      .where(
        and(
          branchId ? eq(payments.branchId, branchId) : undefined,
          sql`"payment_methods"."code" LIKE ${searchString + '%'}`,
        ),
      )
      .orderBy(desc(payments.date));

    return rows;
  }

  async generateRetentionPdf(paymentId: string): Promise<Buffer> {
    const PDFDocument = require('pdfkit');

    const payment = await (db.query.payments as any).findFirst({
      where: eq(payments.id, paymentId),
      with: {
        partner: true,
        branch: true,
      },
    });

    if (!payment || !payment.partner)
      throw new BadRequestException('Retención no encontrada');

    const invoice = payment.invoiceId
      ? await db.query.invoices.findFirst({
          where: eq(invoices.id, payment.invoiceId),
        })
      : null;

    return new Promise((resolve, reject) => {
      const doc = new PDFDocument();
      const buffers: Buffer[] = [];

      doc.on('data', buffers.push.bind(buffers));
      doc.on('end', () => resolve(Buffer.concat(buffers)));

      // --- PDF CONTENT ---
      // Header
      doc.fontSize(16).text('COMPROBANTE DE RETENCIÓN', { align: 'center' });
      doc
        .fontSize(12)
        .text(
          payment.metadata?.type?.includes('IVA')
            ? 'IMPUESTO AL VALOR AGREGADO'
            : 'ISLR',
          { align: 'center' },
        );
      doc.moveDown();

      // Agent (Branch/Company) Info - Placeholder
      doc
        .fontSize(10)
        .text(
          `AGENTE DE RETENCIÓN: ${payment.branch?.name || 'EMPRESA PRINCIPAL'}`,
        );
      doc.text(`FECHA: ${new Date().toLocaleDateString()}`); // Emission date
      doc.moveDown();

      // Provider Info
      doc.text(`SUJETO RETENIDO: ${payment.partner.name}`);
      doc.text(`RIF: ${payment.partner.taxId || 'N/A'}`);
      doc.text(`DIRECCIÓN: ${payment.partner.address || 'N/A'}`);
      doc.moveDown();

      // Details Table
      const startY = doc.y;
      doc.text('FACTURA', 50, startY);
      doc.text('FECHA DOC', 150, startY);
      doc.text('BASE IMPONIBLE', 250, startY, { width: 100, align: 'right' });
      doc.text('MONTO RETENIDO', 400, startY, { width: 100, align: 'right' });

      doc
        .moveTo(50, startY + 15)
        .lineTo(550, startY + 15)
        .stroke();

      const invCode =
        invoice?.code || (payment.metadata as any)?.invoiceCode || 'N/A';
      const invDate = invoice?.date
        ? new Date(invoice.date).toLocaleDateString()
        : (payment.metadata as any)?.voucherDate || '-';
      // Base: From invoice or metadata. Ideally metadata.taxBase
      const base =
        (payment.metadata as any)?.taxBase || invoice?.totalBase || '0.00';
      const retained = payment.amount;

      doc.text(invCode, 50, startY + 25);
      doc.text(invDate, 150, startY + 25);
      doc.text(Number(base).toFixed(2), 250, startY + 25, {
        width: 100,
        align: 'right',
      });
      doc.text(Number(retained).toFixed(2), 400, startY + 25, {
        width: 100,
        align: 'right',
      });

      doc.moveDown(4);
      doc.text('__________________________', { align: 'center' });
      doc.text('Firma y Sello', { align: 'center' });

      doc.end();
    });
  }
}
