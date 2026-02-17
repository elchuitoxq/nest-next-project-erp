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

import {
  eq,
  sql,
  and,
  desc,
  ne,
  ilike,
  gte,
  inArray,
  isNull,
} from 'drizzle-orm';
import Decimal from 'decimal.js';
import { CurrenciesService } from '../settings/currencies/currencies.service';
import { RetentionsService } from '../accounting/retentions.service';
import { DocumentsService } from '../documents/documents.service';

@Injectable()
export class TreasuryService {
  constructor(
    private readonly currenciesService: CurrenciesService,
    private readonly retentionsService: RetentionsService,
    private readonly documentsService: DocumentsService,
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
    const payment = await db.transaction(async (tx) => {
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
          // INHERIT RATE FROM INVOICE ONLY IF CURRENCIES MATCH
          // This ensures fiscal consistency but avoids applying USD rate (1.0) to VES payments
          if (
            !data.exchangeRate &&
            invoice.exchangeRate &&
            invoice.currencyId === data.currencyId
          ) {
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

      // If rate is provided, use it.
      // If NOT provided and NOT inherited (e.g. diff currency), fetch system rate.
      if (data.exchangeRate && new Decimal(data.exchangeRate).gt(0)) {
        exchangeRate = data.exchangeRate;
      } else if (
        exchangeRate === '1.0000000000' &&
        (!invoice || invoice.currencyId !== data.currencyId)
      ) {
        // Fallback to system rate if standalone OR cross-currency payment
        const systemRate = await this.currenciesService.getLatestRate(
          data.currencyId,
        );
        if (systemRate) {
          exchangeRate = systemRate;
        }
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

      // --- DOCUMENT FLOW: LINK PAYMENT TO INVOICES ---
      const linkedInvoiceIds = new Set<string>();
      if (data.allocations) {
        data.allocations.forEach((a) => linkedInvoiceIds.add(a.invoiceId));
      }
      if (data.invoiceId) {
        linkedInvoiceIds.add(data.invoiceId);
      }

      for (const invId of linkedInvoiceIds) {
        await this.documentsService.createLink({
          sourceId: invId,
          sourceTable: 'invoices',
          targetId: payment.id,
          targetTable: 'payments',
          type: 'INVOICE_TO_PAYMENT',
          userId: data.userId,
        });
      }

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

      // Handle Allocations (Refactored)
      const finalAllocations: { invoiceId: string; amount: number }[] = [];

      // 1. Process Explicit Allocations from Frontend
      if (data.allocations && data.allocations.length > 0) {
        for (const alloc of data.allocations) {
          // Fetch invoice for this allocation
          const [targetInvoice] = await tx
            .select()
            .from(invoices)
            .where(eq(invoices.id, alloc.invoiceId));

          if (!targetInvoice) continue;

          // Normalize Amount: Payment Currency -> Invoice Currency

          let normalizedAmount = new Decimal(alloc.amount);

          // Fetch Currencies
          const invCurrency = await tx.query.currencies.findFirst({
            where: eq(currencies.id, targetInvoice.currencyId),
          });
          const payCurrency = await tx.query.currencies.findFirst({
            where: eq(currencies.id, data.currencyId),
          });

          if (invCurrency && payCurrency && invCurrency.id !== payCurrency.id) {
            const pRate = new Decimal(exchangeRate || '1');
            const invRate = new Decimal(targetInvoice.exchangeRate || '1');

            const allocAmountDecimal = new Decimal(alloc.amount);

            // Case 1: Payment Weak (VES), Invoice Hard (USD) -> Divide
            if (invCurrency.code === 'USD' && payCurrency.code !== 'USD') {
              if (invRate.gt(1)) {
                normalizedAmount = allocAmountDecimal.div(invRate);
              } else if (pRate.gt(1)) {
                normalizedAmount = allocAmountDecimal.div(pRate);
              }
            }
            // Case 2: Payment Hard (USD), Invoice Weak (VES) -> Multiply
            else if (payCurrency.code === 'USD' && invCurrency.code !== 'USD') {
              if (pRate.equals(1) && invRate.gt(1)) {
                normalizedAmount = allocAmountDecimal.times(invRate);
              } else if (pRate.gt(1)) {
                normalizedAmount = allocAmountDecimal.times(pRate);
              }
            }
          }

          finalAllocations.push({
            invoiceId: alloc.invoiceId,
            amount: normalizedAmount.toNumber(),
          });
        }
      }

      // 2. Process Legacy Single Invoice (if not already in allocations)
      if (
        data.invoiceId &&
        !finalAllocations.some((a) => a.invoiceId === data.invoiceId)
      ) {
        if (invoice) {
          // Only if explicit allocations were empty, we assume full payment goes to invoiceId?
          if (finalAllocations.length === 0) {
            // Convert full payment amount to invoice currency
            let normalizedAmount = new Decimal(data.amount); // Payment Ccy

            const payCurrency = await tx.query.currencies.findFirst({
              where: eq(currencies.id, data.currencyId),
            });
            const invCurrency = await tx.query.currencies.findFirst({
              where: eq(currencies.id, invoice.currencyId),
            });

            if (
              invCurrency &&
              payCurrency &&
              invCurrency.id !== payCurrency.id
            ) {
              const pRate = new Decimal(exchangeRate || '1');
              const invRate = new Decimal(invoice.exchangeRate || '1');

              if (invCurrency.code === 'USD' && payCurrency.code !== 'USD') {
                if (invRate.gt(1))
                  normalizedAmount = normalizedAmount.div(invRate);
                else if (pRate.gt(1))
                  normalizedAmount = normalizedAmount.div(pRate);
              } else if (
                payCurrency.code === 'USD' &&
                invCurrency.code !== 'USD'
              ) {
                if (pRate.equals(1) && invRate.gt(1))
                  normalizedAmount = normalizedAmount.times(invRate);
                else if (pRate.gt(1))
                  normalizedAmount = normalizedAmount.times(pRate);
              }
            }

            finalAllocations.push({
              invoiceId: data.invoiceId,
              amount: normalizedAmount.toNumber(),
            });
          }
        }
      }

      // 3. Insert All Processed Allocations
      if (finalAllocations.length > 0) {
        await tx.insert(paymentAllocations).values(
          finalAllocations.map((a) => ({
            paymentId: payment.id,
            invoiceId: a.invoiceId,
            amount: a.amount.toString(),
          })),
        );
      }

      // End of Allocation Logic

      // --- AUTOMATIC CREDIT NOTE FOR SURPLUS ---
      // Warning: This logic assumes 'allocations' matches 'amount' in Payment Currency.
      // But now 'allocations' is in Invoice Currency.
      // We cannot compare sum(allocations) vs amount(Payment) directly if currencies differ.
      // We need to compare sum(allocations_converted_to_payment) vs amount.
      // OR compare sum(allocations) vs (amount_converted_to_invoice).

      // --- AUTOMATIC CREDIT NOTE FOR SURPLUS ---
      // Standardized comparison in INVOICE CURRENCY, iterating over FINAL Allocations
      // Note: If multiple invoices were paid, surplus logic is complex.
      // Usually "Procesar Cobranza" (Bulk) assumes exact matches or user defined amounts.
      // Surplus usually applies when TotalPayment > Sum(Allocations). (e.g. Rounding error or intent)

      // Calculate Total Allocated in PAYMENT CURRENCY?
      // No, allocations are now in Invoice Currency. Converting back to Payment Currency is inexact.

      // Better strategy: Compare PaymentAmount (Payment Ccy) vs Sum(Allocations converted to Payment Ccy).

      let totalAllocatedInPaymentCcy = new Decimal(0);

      for (const finalAlloc of finalAllocations) {
        // Inverse conversion: Invoice -> Payment
        const allocAmount = new Decimal(finalAlloc.amount); // Invoice Ccy

        // We need Inv Currency and Rates again...
        // Optimization: could map this during the first loop.
        // For now, let's fetch fast.
        const [targetInvoice] = await tx
          .select()
          .from(invoices)
          .where(eq(invoices.id, finalAlloc.invoiceId));

        if (targetInvoice) {
          const invCurrency = await tx.query.currencies.findFirst({
            where: eq(currencies.id, targetInvoice.currencyId),
          });
          const payCurrency = await tx.query.currencies.findFirst({
            where: eq(currencies.id, data.currencyId),
          });

          let converted = allocAmount;

          if (invCurrency && payCurrency) {
            if (invCurrency.id !== payCurrency.id) {
              const invRate = new Decimal(targetInvoice.exchangeRate || '1');
              const pRate = new Decimal(exchangeRate || '1');

              // Inverse of standardization
              if (invCurrency.code === 'USD' && payCurrency.code !== 'USD') {
                // Invoice USD -> Payment VES: Multiply
                if (invRate.gt(1)) converted = allocAmount.times(invRate);
                else if (pRate.gt(1)) converted = allocAmount.times(pRate);
              } else if (
                payCurrency.code === 'USD' &&
                invCurrency.code !== 'USD'
              ) {
                // Invoice VES -> Payment USD: Divide
                if (invRate.gt(1)) converted = allocAmount.div(invRate);
                else if (pRate.gt(1)) converted = allocAmount.div(pRate);
              }
            }
          }
          totalAllocatedInPaymentCcy =
            totalAllocatedInPaymentCcy.plus(converted);
        }
      }

      // If Payment > Allocated (e.g. paid 500,000, allocated 499,999.99)
      const paymentTotal = new Decimal(amount);
      const remainingUnused = paymentTotal.minus(totalAllocatedInPaymentCcy);

      if (remainingUnused.gt(0.01)) {
        // Create Credit Note for the Surplus (Advance Payment)
        const codeSuffix = Math.random()
          .toString(36)
          .substring(7)
          .toUpperCase();

        await tx.insert(creditNotes).values({
          code: `NC-ADV-${Date.now()}-${codeSuffix}`,
          partnerId: data.partnerId,
          branchId: data.branchId,
          currencyId: data.currencyId, // Credit Note in Payment Currency (unused balance)
          exchangeRate: exchangeRate,
          warehouseId: null,
          status: 'POSTED',
          reason: `Excedente de pago Ref: ${data.reference || 'S/R'}`,
          total: remainingUnused.toFixed(2),
          totalBase: remainingUnused.toFixed(2),
          totalTax: '0',
          totalIgtf: '0',
          date: new Date(),
          userId: data.userId,
          parentPaymentId: payment.id,
        } as any);
      }

      // Helper to update invoice status
      const updateInvoiceStatus = async (invoiceId: string) => {
        // ... (Keep existing update logic, assuming it reads from paymentAllocations correctly)
        // Actually, we must ensure updateInvoiceStatus reads the NEW allocations.
        // Since we are in the same transaction, it should read what we just inserted.

        const [inv] = await tx
          .select()
          .from(invoices)
          .where(eq(invoices.id, invoiceId));
        if (!inv) return;

        // ... (rest of logic is fine as it sums allocations)

        // Copying the existing update logic to be safe/consistent
        const allocs = await tx
          .select({
            amount: paymentAllocations.amount,
          })
          .from(paymentAllocations)
          .where(eq(paymentAllocations.invoiceId, invoiceId));

        const totalAllocated = allocs.reduce(
          (sum, a) => sum.plus(new Decimal(a.amount)),
          new Decimal(0),
        );

        // Only need to add Legacy Direct payments (if any exist that are NOT allocated)
        const directPayments = await tx
          .select()
          .from(payments)
          .where(eq(payments.invoiceId, invoiceId));
        const explicitAllocPaymentIds = new Set(
          (
            await tx
              .select({ pid: paymentAllocations.paymentId })
              .from(paymentAllocations)
              .where(eq(paymentAllocations.invoiceId, invoiceId))
          ).map((x) => x.pid),
        );

        let legacyDirectTotal = new Decimal(0);
        for (const dp of directPayments) {
          if (!explicitAllocPaymentIds.has(dp.id)) {
            // Normalize legacy
            // Re-implement simplified normalization for status update
            const pCurrency = await tx.query.currencies.findFirst({
              where: eq(currencies.id, dp.currencyId),
            });
            const invCurrency = await tx.query.currencies.findFirst({
              where: eq(currencies.id, inv.currencyId),
            });

            let amount = new Decimal(dp.amount);
            if (pCurrency && invCurrency && pCurrency.id !== invCurrency.id) {
              const rate = new Decimal(dp.exchangeRate || '1');
              const invRate = new Decimal(inv.exchangeRate || '1');
              if (invCurrency.code === 'USD' && pCurrency.code !== 'USD') {
                if (invRate.gt(1)) amount = amount.div(invRate);
                else if (rate.gt(1)) amount = amount.div(rate);
              } else if (
                pCurrency.code === 'USD' &&
                invCurrency.code !== 'USD'
              ) {
                if (invRate.gt(1)) amount = amount.times(invRate);
                else if (rate.gt(1)) amount = amount.times(rate);
              }
            }
            legacyDirectTotal = legacyDirectTotal.plus(amount);
          }
        }

        const grandTotalPaid = totalAllocated.plus(legacyDirectTotal);
        const invTotal = new Decimal(inv.total || 0);

        let newStatus = 'POSTED';
        if (grandTotalPaid.gte(invTotal.minus(0.01))) newStatus = 'PAID';
        else if (grandTotalPaid.gt(0)) newStatus = 'PARTIALLY_PAID';

        if (newStatus !== inv.status) {
          await tx
            .update(invoices)
            .set({ status: newStatus })
            .where(eq(invoices.id, invoiceId));
        }
      };

      // Update All Affected Invoices
      const uniqueInvoiceIds = [
        ...new Set(finalAllocations.map((a) => a.invoiceId)),
      ];
      for (const invId of uniqueInvoiceIds) {
        await updateInvoiceStatus(invId);
      }

      // 4. Return Full Payment Object (for Audit & UI)
      return await tx.query.payments.findFirst({
        where: eq(payments.id, payment.id),
        with: {
          bankAccount: true,
          method: true,
          currency: true,
        },
      });
    });

    return {
      message: 'Pago registrado con éxito y nota de crédito generada si aplica',
      payment,
    };
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
        partner: partners,
        method: paymentMethods,
        // Helper to aggregate allocations (Postgres)
        // We will fetch allocations separately or use a leftJoin with aggregation?
        // Drizzle doesn't support easy nested relations in .select() without query builder mode.
        // Let's use query builder mode or map results.
        // Actually, since we are using .select(), we get a flat list.
        // Let's use db.query which is easier for nested relations if performance allows.
      })
      .from(payments)
      .leftJoin(users, eq(payments.userId, users.id))
      .leftJoin(bankAccounts, eq(payments.bankAccountId, bankAccounts.id))
      .leftJoin(partners, eq(payments.partnerId, partners.id))
      .leftJoin(paymentMethods, eq(payments.methodId, paymentMethods.id))
      .where(whereClause)
      .orderBy(desc(payments.date));

    // To avoid N+1, let's fetch all allocations for these payments
    const paymentIds = rows.map((r) => r.payment.id);
    const allocationsMap = new Map<string, any[]>();

    if (paymentIds.length > 0) {
      const allocs = await db.query.paymentAllocations.findMany({
        where: sql`${paymentAllocations.paymentId} IN ${paymentIds}`,
        with: {
          invoice: true,
        },
      });

      for (const a of allocs) {
        if (!allocationsMap.has(a.paymentId)) {
          allocationsMap.set(a.paymentId, []);
        }
        allocationsMap.get(a.paymentId)?.push({
          invoiceId: a.invoiceId,
          invoiceCode: a.invoice.code,
          amount: a.amount,
        });
      }
    }

    // Also handle legacy single invoiceId
    // If payment has invoiceId but NO allocations, we can treat it as one allocation.
    // Fetch legacy invoices
    const legacyInvoiceIds = rows
      .filter((r) => r.payment.invoiceId && !allocationsMap.has(r.payment.id))
      .map((r) => r.payment.invoiceId as string);

    const legacyInvoicesMap = new Map<string, string>();
    if (legacyInvoiceIds.length > 0) {
      const legacyInvs = await db.query.invoices.findMany({
        where: sql`${invoices.id} IN ${legacyInvoiceIds}`,
        columns: { id: true, code: true },
      });
      legacyInvs.forEach((inv) => legacyInvoicesMap.set(inv.id, inv.code));
    }

    return rows.map(({ payment, user, bankAccount, partner, method }) => {
      const finalAllocations = allocationsMap.get(payment.id) || [];

      // Backwards compatibility for legacy single-invoice payments without allocations
      if (finalAllocations.length === 0 && payment.invoiceId) {
        const code = legacyInvoicesMap.get(payment.invoiceId);
        if (code) {
          finalAllocations.push({
            invoiceId: payment.invoiceId,
            invoiceCode: code,
            amount: payment.amount,
          });
        }
      }

      return {
        ...payment,
        user: user ? { id: user.id, name: user.name } : null,
        bankAccount: bankAccount
          ? { id: bankAccount.id, name: bankAccount.name }
          : null,
        partnerName: partner?.name || 'N/A',
        methodName: method?.name || 'N/A',
        allocations: finalAllocations,
      };
    });
  }

  async getAccountStatement(
    partnerId: string,
    branchId?: string,
    reportingCurrencyId?: string,
  ) {
    // Default to USD if not provided (or find system default)
    // For now, we'll try to find USD or fallback to the first available currency in the partner's transactions
    // ideally this should be a system setting, but let's look it up dynamically if needed.
    let targetCurrencyCode = 'USD'; // Safe default for international reports
    let targetCurrencyId = reportingCurrencyId;

    if (reportingCurrencyId) {
      const targetCurrency = await db.query.currencies.findFirst({
        where: eq(currencies.id, reportingCurrencyId),
      });
      if (targetCurrency) targetCurrencyCode = targetCurrency.code;
    } else {
      // Try to find USD id
      const usd = await db.query.currencies.findFirst({
        where: eq(currencies.code, 'USD'),
      });
      if (usd) {
        targetCurrencyId = usd.id;
        targetCurrencyCode = 'USD';
      }
    }

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
          with: {
            allocations: {
              with: {
                invoice: {
                  with: { currency: true },
                },
              },
            },
            invoice: {
              with: { currency: true },
            }, // Legacy link
            bankAccount: true,
            currency: true,
          },
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

    // Helper to convert amounts
    // NOTE: This uses the invoice's exchange rate for the invoice itself.
    // For payments, it relies on the payment's rate implicitly if converting to base.
    // If reporting currency is NOT base, we might need cross-rate logic.
    // For simplicity in this unified view, we assume:
    // - If transaction currency == reporting currency -> use amount
    // - If transaction currency != reporting currency -> use rate to convert to reporting.
    //   (Assuming reporting is usually the stable/hard currency like USD)

    for (const inv of partnerInvoices) {
      const currencyCode = inv.currency ? inv.currency.code : 'VES';
      const isTarget = currencyCode === targetCurrencyCode;
      const rate = Number(inv.exchangeRate) || 1;

      // Calculate Reporting Value
      let reportingValue = Number(inv.total);
      if (!isTarget) {
        // If Invoice is VES and Target is USD -> Divide by Rate
        // If Invoice is USD and Target is VES -> Multiply by Rate
        // Assumption: Rate is always VES/USD (e.g. 50.00)
        if (targetCurrencyCode === 'USD' && currencyCode === 'VES') {
          reportingValue = Number(inv.total) / rate;
        } else if (targetCurrencyCode === 'VES' && currencyCode === 'USD') {
          reportingValue = Number(inv.total) * rate;
        }
      }

      transactions.push({
        id: inv.id,
        date: inv.date ? new Date(inv.date) : new Date(),
        type: 'INVOICE',
        reference: inv.code,
        description: `Factura ${inv.code}`,
        originalAmount: Number(inv.total),
        originalCurrency: currencyCode,
        exchangeRate: rate,
        // Reporting
        reportingAmount: reportingValue,
        reportingCurrency: targetCurrencyCode,
        // Direction
        debit: reportingValue, // Charge
        credit: 0,
        status: inv.status,
      });
    }

    const allMethods = await db.select().from(paymentMethods);
    const methodMap = new Map(allMethods.map((m) => [m.id, m]));

    for (const pay of partnerPayments) {
      const method = methodMap.get(pay.methodId);
      const currencyCode = pay.currency ? pay.currency.code : 'VES';
      const isTarget = currencyCode === targetCurrencyCode;
      const rate = Number(pay.exchangeRate) || 1; // Rate at moment of payment

      const isBalancePayment = method?.code?.startsWith('BALANCE');

      // Determine Reporting Value for Payment
      let reportingValue = Number(pay.amount);
      const isCrossCurrency = false;

      // Special handling for Allocations (Cross-Currency Payments)
      // If a payment has allocations to invoices in Target Currency, use the allocated amount in THAT currency
      // This solves "Paid 4000 VES for 100 USD Invoice" -> We want to show 100 USD credit.
      let calculatedReportingValue = 0;
      let hasTargetAllocations = false;

      if (pay.allocations && pay.allocations.length > 0) {
        for (const alloc of pay.allocations) {
          const invCurrency = alloc.invoice?.currency?.code || 'VES';
          if (invCurrency === targetCurrencyCode) {
            // Invoice is in Target Currency (e.g. USD).
            // The allocation amount in the allocation table is usually in the INVOICE currency (if consistent with design)
            // OR it needs to be calculated.
            // Verification: In `registerPayment`, we check if currencies match.
            // If payment is VES and Invoice USD, we convert.
            // Ideally, we should store the 'value' in the invoice's currency.
            // Let's assume standard logic:
            // If I pay 50 USD for a 100 USD invoice, `paymentAllocations.amount` is 50.

            // However, our `paymentAllocations` table usually stores the amount taken from the PAYMENT.
            // Let's check `paymentAllocations` schema definition if possible.
            // Assuming `amount` in `payment_allocations` is in PAYMENT currency.

            const allocAmount = Number(alloc.amount);

            if (currencyCode === targetCurrencyCode) {
              calculatedReportingValue += allocAmount;
            } else {
              // Payment in VES, Target in USD.
              // Convert allocation (VES) to USD using Payment Rate.
              if (targetCurrencyCode === 'USD' && currencyCode === 'VES') {
                calculatedReportingValue += allocAmount / rate;
              } else if (
                targetCurrencyCode === 'VES' &&
                currencyCode === 'USD'
              ) {
                calculatedReportingValue += allocAmount * rate;
              }
            }
            hasTargetAllocations = true;
          }
        }
      }

      // If we found specific allocations to the target currency, that's our "Real" impact.
      // But what about the rest of the payment (unallocated)?
      // For the unallocated part, we just convert using standard rate.

      if (hasTargetAllocations) {
        // This logic is complex because a payment might pay mixed currencies.
        // For simplicity in V1:
        // If not isTarget, convert the WHOLE amount using the rate.
        // This is usually correct: 4000 VES / 40 = 100 USD.
        // The fact that it paid a 100 USD invoice confirms it.
        // So standard conversion should work for 99% of cases.

        if (targetCurrencyCode === 'USD' && currencyCode === 'VES') {
          reportingValue = Number(pay.amount) / rate;
        } else if (targetCurrencyCode === 'VES' && currencyCode === 'USD') {
          reportingValue = Number(pay.amount) * rate;
        }
      } else {
        // Standard Conversion
        if (!isTarget) {
          if (targetCurrencyCode === 'USD' && currencyCode === 'VES') {
            reportingValue = Number(pay.amount) / rate;
          } else if (targetCurrencyCode === 'VES' && currencyCode === 'USD') {
            reportingValue = Number(pay.amount) * rate;
          }
        }
      }

      const creditAmount = isBalancePayment ? 0 : reportingValue;

      // Build description
      const invoiceCodes = new Set<string>();
      if (pay.allocations) {
        pay.allocations.forEach((a) => {
          if (a.invoice?.code) invoiceCodes.add(a.invoice.code);
        });
      }
      if (pay.invoice?.code && invoiceCodes.size === 0) {
        invoiceCodes.add(pay.invoice.code);
      }

      const invoiceDetail =
        invoiceCodes.size > 0
          ? ` (Facturas: ${Array.from(invoiceCodes).join(', ')})`
          : '';
      const bankInfo = pay.bankAccount ? ` - ${pay.bankAccount.name}` : '';

      transactions.push({
        id: pay.id,
        date: pay.date ? new Date(pay.date) : new Date(),
        type: 'PAYMENT',
        reference: pay.reference || '-',
        description: `Pago ${method ? method.name : ''}${bankInfo}${invoiceDetail}`,
        originalAmount: Number(pay.amount),
        originalCurrency: currencyCode,
        exchangeRate: rate,
        // Reporting
        reportingAmount: reportingValue,
        reportingCurrency: targetCurrencyCode,
        debit: 0,
        credit: creditAmount,
        status: 'COMPLETED',
      });
    }

    // Credit Notes
    for (const cn of partnerCreditNotes) {
      // @ts-ignore
      const date = cn.date || cn.createdAt || new Date();
      const currencyCode = cn.currency ? cn.currency.code : 'VES';
      const isTarget = currencyCode === targetCurrencyCode;
      // We need rate for CN. Usually stored or we assume current if not?
      // CNs should have exchangeRate too.
      const rate = Number((cn as any).exchangeRate) || 1;

      const total =
        Number(cn.totalBase) + Number(cn.totalTax) + Number(cn.totalIgtf);

      let reportingValue = total;
      if (!isTarget) {
        if (targetCurrencyCode === 'USD' && currencyCode === 'VES') {
          reportingValue = total / rate;
        } else if (targetCurrencyCode === 'VES' && currencyCode === 'USD') {
          reportingValue = total * rate;
        }
      }

      const isSurplus =
        (cn as any).parentPaymentId || cn.code.startsWith('NC-ADV');

      transactions.push({
        id: cn.id,
        date: new Date(date),
        type: 'CREDIT_NOTE',
        reference: cn.code,
        description: `Nota de Crédito ${cn.code}${isSurplus ? ' (Excedente)' : ''}`,
        originalAmount: total,
        originalCurrency: currencyCode,
        exchangeRate: rate,
        reportingAmount: reportingValue,
        reportingCurrency: targetCurrencyCode,
        debit: 0,
        credit: isSurplus ? 0 : reportingValue,
        status: cn.status,
      });
    }

    // 3. Sort Chronologically
    transactions.sort((a, b) => a.date.getTime() - b.date.getTime());

    // 4. Calculate Unified Summary
    let runningBalance = 0;
    const processedTransactions = transactions.map((t) => {
      // Apply debit/credit to running balance
      runningBalance += t.debit - t.credit;
      return {
        ...t,
        balance: runningBalance,
      };
    });

    return {
      partnerId,
      reportingCurrency: targetCurrencyCode,
      summary: {
        balance: runningBalance,
        // We could still return the separated 'original' summaries if needed,
        // but for the Unified View, the global balance is what matters.
      },
      transactions: processedTransactions.reverse(),
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
