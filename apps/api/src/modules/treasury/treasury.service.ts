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
  partners,
  creditNoteUsages,
} from '@repo/db';

import { eq, sql, and, desc, ne, isNull } from 'drizzle-orm';
import Decimal from 'decimal.js';
import { CurrenciesService } from '../settings/currencies/currencies.service';
import { RetentionsService } from '../accounting/retentions.service';

@Injectable()
export class TreasuryService {
  constructor(
    private readonly currenciesService: CurrenciesService,
    private readonly retentionsService: RetentionsService,
  ) {}

  // ... (existing code) ...

  async findAllMethods(branchId?: string) {
    const methods = await db.query.paymentMethods.findMany({
      where: branchId ? eq(paymentMethods.branchId, branchId) : undefined,
      with: {
        allowedAccounts: true,
      },
    });

    return methods;
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

  async createMethod(data: {
    name: string;
    code: string;
    branchId: string;
    currencyId?: string;
    isDigital: boolean;
  }) {
    const existing = await db.query.paymentMethods.findFirst({
      where: and(
        eq(paymentMethods.code, data.code),
        eq(paymentMethods.branchId, data.branchId),
      ),
    });

    if (existing) {
      throw new BadRequestException(
        `El código "${data.code}" ya existe en esta sucursal.`,
      );
    }

    const [method] = await db
      .insert(paymentMethods)
      .values({
        name: data.name,
        code: data.code,
        branchId: data.branchId,
        currencyId: data.currencyId || null,
        isDigital: data.isDigital,
      } as any)
      .returning();
    return method;
  }

  async updateMethod(
    id: string,
    data: {
      name?: string;
      code?: string;
      currencyId?: string;
      isDigital?: boolean;
    },
  ) {
    const current = await db.query.paymentMethods.findFirst({
      where: eq(paymentMethods.id, id),
    });
    if (!current) throw new BadRequestException('Método no encontrado');

    if (data.code && data.code !== current.code) {
      const existing = await db.query.paymentMethods.findFirst({
        where: and(
          eq(paymentMethods.code, data.code),
          current.branchId
            ? eq(paymentMethods.branchId, current.branchId)
            : isNull(paymentMethods.branchId),
        ),
      });

      if (existing) {
        throw new BadRequestException(
          `El código "${data.code}" ya está en uso en esta sucursal.`,
        );
      }
    }

    const [updated] = await db
      .update(paymentMethods)
      .set({
        name: data.name,
        code: data.code,
        currencyId: data.currencyId || null,
        isDigital: data.isDigital,
      })
      .where(eq(paymentMethods.id, id))
      .returning();
    return updated;
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
    exchangeRate?: string;
    type?: 'INCOME' | 'EXPENSE';
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

      // Method Validation & Sanitization
      const method = await tx.query.paymentMethods.findFirst({
        where: eq(paymentMethods.id, data.methodId),
      });

      // If method is CASH/EFECTIVO, force bankAccountId to null to avoid pollution
      // This fixes the issue where frontend sends bankAccountId even after switching to Cash
      let finalBankAccountId = data.bankAccountId;
      if (
        method &&
        (method.code.includes('CASH') ||
          method.code.includes('EFECTIVO') ||
          method.code.includes('DIVISA'))
      ) {
        finalBankAccountId = undefined;
      }

      const amount = new Decimal(data.amount);

      let exchangeRate = '1.0000000000';
      let paymentType = data.type || 'INCOME';
      let invoice: any = null;

      if (data.invoiceId) {
        [invoice] = await tx
          .select()
          .from(invoices)
          .where(eq(invoices.id, data.invoiceId));

        if (invoice) {
          if (invoice.type === 'PURCHASE') {
            paymentType = 'EXPENSE';
          }
          // INHERIT RATE FROM INVOICE IF NOT PROVIDED EXPLICITLY
          // This ensures fiscal consistency (Providencia 0102/0071)
          if (!data.exchangeRate && invoice.exchangeRate) {
            exchangeRate = invoice.exchangeRate;
          }
        }
      } else if (
        !data.type &&
        data.allocations &&
        data.allocations.length > 0
      ) {
        // INFER FROM FIRST ALLOCATION
        const [firstInv] = await tx
          .select()
          .from(invoices)
          .where(eq(invoices.id, data.allocations[0].invoiceId));
        if (firstInv && firstInv.type === 'PURCHASE') {
          paymentType = 'EXPENSE';
        }
      }

      // If rate is still 1.0 (default) AND was provided in data, use data.
      // If not in data and not inherited, try to fetch latest system rate.
      if (data.exchangeRate && new Decimal(data.exchangeRate).gt(0)) {
        exchangeRate = data.exchangeRate;
      } else if (exchangeRate === '1.0000000000' && !invoice) {
        // Fallback to system rate if purely standalone payment
        exchangeRate =
          (await this.currenciesService.getLatestRate(data.currencyId)) ||
          '1.0000000000';
      }

      // Validate Bank Balance for Expenses
      if (finalBankAccountId && paymentType === 'EXPENSE') {
        const account = await tx.query.bankAccounts.findFirst({
          where: eq(bankAccounts.id, finalBankAccountId),
        });

        if (account) {
          const currentBalance = new Decimal(account.currentBalance || 0);
          if (currentBalance.lt(amount)) {
            throw new BadRequestException(
              `Saldo insuficiente en la cuenta ${account.name}. Disponible: ${currentBalance.toFixed(2)}, Requerido: ${amount.toFixed(2)}`,
            );
          }
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
          type: paymentType,
          exchangeRate,
          bankAccountId: finalBankAccountId || null,
          reference: data.reference,
          metadata: data.metadata,
          userId: data.userId,
        } as any)
        .returning();

      // --- BALANCE PAYMENT (CRUCE) LOGIC ---
      if (method && method.code.startsWith('BALANCE')) {
        // 1. Get Available Credit Notes
        const availableCNs = await this.getAvailableCreditNotes(
          data.partnerId,
          data.currencyId,
          tx,
        );

        // 2. Distribute amount
        let remainingToCover = amount; // Decimal

        // Verify total availability
        const totalAvailable = availableCNs.reduce(
          (sum, cn) => sum.plus(new Decimal(cn.remainingAmount)),
          new Decimal(0),
        );

        if (totalAvailable.lt(remainingToCover)) {
          throw new BadRequestException(
            `Saldo insuficiente. Disponible: ${totalAvailable.toFixed(2)}, Requerido: ${remainingToCover.toFixed(2)}`,
          );
        }

        // 3. Consume Credit Notes
        for (const cn of availableCNs) {
          if (remainingToCover.lte(0)) break;

          const canTake = new Decimal(cn.remainingAmount);
          let take = canTake;
          if (canTake.gt(remainingToCover)) {
            take = remainingToCover;
          }

          await tx.insert(creditNoteUsages).values({
            creditNoteId: cn.id,
            paymentId: payment.id,
            amount: take.toFixed(2),
          });

          remainingToCover = remainingToCover.minus(take);
        }
      }

      // --- CHECK MANUAL RETENTION PAYMENT ---
      // If the payment method itself IS a retention (e.g. user selected "RET_IVA_75" in dialog)
      // Method is already fetched above
      // const method = ... (already fetched)

      if (method && method.code.startsWith('RET_') && data.invoiceId) {
        // This IS a manual retention payment. We MUST generate the fiscal voucher.
        // If metadata contains taxBase, use it, otherwise fetch invoice.
        const invoice = await tx.query.invoices.findFirst({
          where: eq(invoices.id, data.invoiceId),
        });

        if (invoice) {
          const type = method.code.includes('IVA') ? 'IVA' : 'ISLR';
          const baseAmount = data.metadata?.taxBase || invoice.totalBase || '0';
          const taxAmount = invoice.totalTax || '0'; // Simplified, assuming retention applies to full invoice tax

          // If it's partial retention, we might need logic, but usually RET payment amount IS the retained amount.
          const retainedAmount = amount.toFixed(2);

          await this.retentionsService.createRetention(
            {
              partnerId: data.partnerId,
              branchId: data.branchId || invoice.branchId,
              userId: data.userId || 'SYSTEM',
              type: type,
              period: new Date().toISOString().slice(0, 7).replace('-', ''),
              items: [
                {
                  invoiceId: invoice.id,
                  baseAmount: String(baseAmount),
                  taxAmount: String(taxAmount),
                  retainedAmount: retainedAmount,
                  paymentId: payment.id,
                },
              ],
            },
            tx, // Pass the ACTIVE transaction
          );
        }
      }

      // Update Bank Account Balance
      if (finalBankAccountId) {
        // Correctly handle Income vs Expense
        const operation =
          paymentType === 'INCOME'
            ? sql`${bankAccounts.currentBalance} + ${data.amount}`
            : sql`${bankAccounts.currentBalance} - ${data.amount}`;

        await tx
          .update(bankAccounts)
          .set({
            currentBalance: operation,
          })
          .where(eq(bankAccounts.id, finalBankAccountId));
      }

      // --- AUTOMATIC RETENTION GENERATION (VENEZUELA) ---
      // Only run automatic logic if this wasn't ALREADY a retention payment (to avoid double creation)
      if (
        paymentType === 'EXPENSE' &&
        data.invoiceId &&
        !method?.code.startsWith('RET_')
      ) {
        // Fetch Partner and Invoice details
        const partner = await tx.query.partners.findFirst({
          where: eq(partners.id, data.partnerId),
        });

        const invoice = await tx.query.invoices.findFirst({
          where: eq(invoices.id, data.invoiceId),
        });

        // Trigger if Partner is Special Taxpayer OR has specific retention rate > 0
        // And invoice has tax
        if (partner && invoice && Number(invoice.totalTax) > 0) {
          const retentionRate = Number(partner.retentionRate || 0);
          // Special Taxpayers usually retain 75% or 100%
          // If rate is 0 but is special, default to 75%? Or explicit rate required?
          // Let's rely on explicit rate or default to 75 if special.
          let rateToApply = retentionRate;
          if (rateToApply === 0 && partner.isSpecialTaxpayer) {
            rateToApply = 75;
          }

          if (rateToApply > 0) {
            // Calculate Proportion of Tax paid
            // If partial payment, we retain proportional tax?
            // SENIAT: "La retención se debe realizar cuando se efectúe el pago o abono en cuenta".
            // Usually calculated on the base of the payment.

            // Base = PaymentAmount / (1 + (TaxRate/100)) ??? No, payment amount includes tax.
            // Formula: Payment is Total (Base + Tax).
            // Tax Portion = Payment - (Payment / (1+TaxRate))
            // Retention = Tax Portion * (RetentionRate/100)

            // We need the tax rate from the invoice items... complex if mixed rates.
            // Simplified: Assume average tax rate from Invoice TotalTax / TotalBase

            const invBase = new Decimal(invoice.totalBase || 0);
            const invTax = new Decimal(invoice.totalTax || 0);
            const invTotal = new Decimal(invoice.total || 0);

            if (invTotal.gt(0)) {
              const paymentAmount = new Decimal(data.amount);

              // Proportional Base and Tax covered by this payment
              const ratio = paymentAmount.div(invTotal);
              const baseCovered = invBase.times(ratio);
              const taxCovered = invTax.times(ratio);

              const retainedAmount = taxCovered.times(rateToApply).div(100);

              if (retainedAmount.gt(0)) {
                await this.retentionsService.createRetention(
                  {
                    partnerId: data.partnerId,
                    branchId: data.branchId || invoice.branchId,
                    userId: data.userId || invoice.userId || 'SYSTEM',
                    type: 'IVA',
                    period: new Date()
                      .toISOString()
                      .slice(0, 7)
                      .replace('-', ''), // YYYYMM
                    items: [
                      {
                        invoiceId: invoice.id,
                        baseAmount: baseCovered.toFixed(2),
                        taxAmount: taxCovered.toFixed(2),
                        retainedAmount: retainedAmount.toFixed(2),
                        paymentId: payment.id,
                      },
                    ],
                  },
                  tx, // Pass the ACTIVE transaction
                );
              }
            }
          }
        }
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

      // --- AUTOMATIC CREDIT NOTE FOR SURPLUS (SALDO A FAVOR) ---
      // If the payment amount is greater than the sum of allocations,
      // generate a Credit Note for the difference so it can be used later.
      if (true) {
        // Allow for both INCOME and EXPENSE
        const totalAllocated = allocations.reduce(
          (sum, a) => sum.plus(new Decimal(a.amount)),
          new Decimal(0),
        );

        // If legacy invoiceId is present and NO allocations were explicit,
        // we assume full amount was for that invoice (unless specific logic says otherwise).
        // But here we are strict: Allocations define usage.
        // If invoiceId was provided but not in allocations list (legacy handled above),
        // totalAllocated includes it.

        const unallocated = amount.minus(totalAllocated);

        if (unallocated.gt(0.01)) {
          // Verify if we should create a credit note.
          // Yes, create it as an "Advance Payment"
          const codeSuffix = Math.random()
            .toString(36)
            .substring(7)
            .toUpperCase();
          await tx.insert(creditNotes).values({
            code: `NC-ADV-${Date.now()}-${codeSuffix}`,
            partnerId: data.partnerId,
            branchId: data.branchId,
            currencyId: data.currencyId,
            exchangeRate: exchangeRate,
            warehouseId: null, // No stock return involved
            status: 'POSTED',
            reason: `Excedente de pago Ref: ${data.reference || 'S/R'}`,
            total: unallocated.toFixed(2),
            totalBase: unallocated.toFixed(2), // Treat as nontaxable base or just total
            totalTax: '0',
            totalIgtf: '0',
            date: new Date(),
            userId: data.userId,
            parentPaymentId: payment.id,
          } as any);
        }
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

  async findAllPayments(branchId?: string, bankAccountId?: string) {
    const whereConditions: any[] = [];
    if (branchId) whereConditions.push(eq(payments.branchId, branchId));
    if (bankAccountId)
      whereConditions.push(eq(payments.bankAccountId, bankAccountId));

    const whereClause =
      whereConditions.length > 0 ? and(...whereConditions) : undefined;

    const rows = await db
      .select({
        payment: payments,
        user: users,
        bankAccount: bankAccounts,
        partner: partners, // Include partner info for description
        method: paymentMethods, // Include method name
      })
      .from(payments)
      .leftJoin(users, eq(payments.userId, users.id))
      .leftJoin(bankAccounts, eq(payments.bankAccountId, bankAccounts.id))
      .leftJoin(partners, eq(payments.partnerId, partners.id))
      .leftJoin(paymentMethods, eq(payments.methodId, paymentMethods.id))
      .where(whereClause)
      .orderBy(desc(payments.date)); // Newest first

    // Map to expected structure
    return rows.map(({ payment, user, bankAccount, partner, method }) => ({
      ...payment,
      user: user ? { id: user.id, name: user.name } : null,
      bankAccount: bankAccount
        ? { id: bankAccount.id, name: bankAccount.name }
        : null,
      partnerName: partner?.name || 'N/A', // Add Partner Name
      methodName: method?.name || 'N/A', // Add Method Name
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
        description: `Nota de Crédito ${cn.code}${(cn as any).parentPaymentId || cn.code.startsWith('NC-ADV') ? ' (Excedente)' : ''}`,
        debit: 0,
        credit:
          (cn as any).parentPaymentId || cn.code.startsWith('NC-ADV')
            ? 0
            : Number(cn.totalBase) + Number(cn.totalTax) + Number(cn.totalIgtf), // Reduces balance
        currency: cn.currency ? cn.currency.code : 'VES',
        status: cn.status,
      });
    }

    // 3. Sort Chronologically
    transactions.sort((a, b) => a.date.getTime() - b.date.getTime());

    // 4. Calculate Balances per Currency
    const summary: Record<string, { balance: number; unusedBalance: number }> =
      {};

    // Initialize summary for all involved currencies
    const involvedCurrencies = new Set(transactions.map((t) => t.currency));
    involvedCurrencies.forEach((curr) => {
      summary[curr] = { balance: 0, unusedBalance: 0 };
    });

    // Calculate Total Balance (Debit - Credit)
    for (const t of transactions) {
      if (summary[t.currency]) {
        summary[t.currency].balance += t.debit - t.credit;
      }
    }

    // 5. Calculate Unused Balance (Saldo Sin Ocupar) per Currency
    // Formula: (Credit Notes + Unallocated Payments) - (Balance Usage)

    // A. Credit Notes Total
    for (const cn of partnerCreditNotes) {
      const curr = cn.currency?.code || 'VES';
      if (!summary[curr]) summary[curr] = { balance: 0, unusedBalance: 0 };

      const total =
        Number(cn.totalBase) + Number(cn.totalTax) + Number(cn.totalIgtf);
      summary[curr].unusedBalance += total;
    }

    const paymentsWithAllocations = await db.query.payments.findMany({
      where: eq(payments.partnerId, partnerId),
      with: {
        method: true,
        allocations: true,
        currency: true,
      },
    });

    for (const p of paymentsWithAllocations) {
      const curr = p.currency?.code || 'VES';
      if (!summary[curr]) summary[curr] = { balance: 0, unusedBalance: 0 };

      const amount = Number(p.amount);
      const isBalance = p.method?.code?.startsWith('BALANCE');

      if (isBalance) {
        summary[curr].unusedBalance -= amount;
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

        // --- PREVENT DOUBLE COUNTING OF SURPLUS ---
        // If this payment has associated Credit Notes (surplus/advance),
        // those Credit Notes are ALREADY adding to unusedBalance in the loop above.
        // We should only add the portion of 'rem' that is NOT covered by Credit Notes.

        // Fetch child credit notes for this payment (using pre-fetched list to avoid N+1)
        // Heuristic: Link by parentPaymentId OR by NC-ADV code + matching amount (for legacy/failed links)
        const unallocatedSurplus = amount - allocated;
        const childCNs = partnerCreditNotes.filter(
          (cn) =>
            (cn as any).parentPaymentId === p.id ||
            (cn.code.startsWith('NC-ADV') &&
              Math.abs(Number(cn.total) - unallocatedSurplus) < 0.01 &&
              cn.currencyId === p.currencyId),
        );

        const childCNTotal = childCNs.reduce(
          (sum, cn) => sum + Number(cn.total),
          0,
        );
        const rem = Math.max(0, unallocatedSurplus - childCNTotal);

        summary[curr].unusedBalance += rem;
      }
    }

    // Ensure no negative unused balance (safety)
    Object.keys(summary).forEach((key) => {
      summary[key].unusedBalance = Math.max(0, summary[key].unusedBalance);
    });

    return {
      partnerId,
      summary, // { "USD": { balance: 100, unused: 0 }, "VES": ... }
      transactions: transactions.reverse(), // Show newest first
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

      const invCode = invoice?.code || payment.metadata?.invoiceCode || 'N/A';
      const invDate = invoice?.date
        ? new Date(invoice.date).toLocaleDateString()
        : payment.metadata?.voucherDate || '-';
      // Base: From invoice or metadata. Ideally metadata.taxBase
      const base = payment.metadata?.taxBase || invoice?.totalBase || '0.00';
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

      // Footer
      doc
        .fontSize(10)
        .text(
          'Este comprobante se emite conforme a la Providencia Administrativa SNAT/2013/0030.',
          50,
          700,
          { align: 'center' },
        );

      doc.end();
    });
  }

  async getAvailableCreditNotes(
    partnerId: string,
    currencyId: string,
    tx?: any,
  ) {
    const dbHandler = tx || db;

    // 1. Fetch POSTED Credit Notes
    const creditNotesList = await dbHandler.query.creditNotes.findMany({
      where: and(
        eq(creditNotes.partnerId, partnerId),
        eq(creditNotes.currencyId, currencyId),
        eq(creditNotes.status, 'POSTED'),
      ),
      with: { currency: true },
      orderBy: desc(creditNotes.date),
    });

    if (creditNotesList.length === 0) return [];

    const results = [];
    for (const cn of creditNotesList) {
      const usage = await dbHandler
        .select({
          amount: creditNoteUsages.amount,
        })
        .from(creditNoteUsages)
        .where(eq(creditNoteUsages.creditNoteId, cn.id));

      const totalUsed = usage.reduce(
        (sum: Decimal, u: { amount: string }) =>
          sum.plus(new Decimal(u.amount)),
        new Decimal(0),
      );
      const totalAmount = new Decimal(cn.total || 0);

      const remaining = totalAmount.minus(totalUsed);
      if (remaining.gt(0)) {
        results.push({
          ...cn,
          remainingAmount: remaining.toNumber(),
        });
      }
    }

    return results;
  }
}
