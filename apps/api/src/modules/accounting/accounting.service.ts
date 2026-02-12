import { Injectable } from '@nestjs/common';
import {
  db,
  accountingEntries,
  accountingEntryLines,
  accountingAccounts,
} from '@repo/db';
import { eq, and } from 'drizzle-orm';
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
}
