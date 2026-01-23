import { Injectable, NotFoundException } from '@nestjs/common';
import { db, bankAccounts } from '@repo/db';
import { eq, desc, and } from 'drizzle-orm';

@Injectable()
export class BankAccountsService {
  async findAll(branchId?: string) {
    return await db.query.bankAccounts.findMany({
      where: branchId ? eq(bankAccounts.branchId, branchId) : undefined,
      with: {
        currency: true,
      },
      orderBy: desc(bankAccounts.isActive),
    });
  }

  async findOne(id: string, branchId?: string) {
    const account = await db.query.bankAccounts.findFirst({
      where: branchId
        ? and(eq(bankAccounts.id, id), eq(bankAccounts.branchId, branchId))
        : eq(bankAccounts.id, id),
      with: {
        currency: true,
      },
    });
    if (!account) throw new NotFoundException('Cuenta bancaria no encontrada');
    return account;
  }

  async create(data: typeof bankAccounts.$inferInsert) {
    return await db.insert(bankAccounts).values(data).returning();
  }

  async update(
    id: string,
    data: Partial<typeof bankAccounts.$inferInsert>,
    branchId?: string,
  ) {
    const whereClause = branchId
      ? and(eq(bankAccounts.id, id), eq(bankAccounts.branchId, branchId))
      : eq(bankAccounts.id, id);

    const [updated] = await db
      .update(bankAccounts)
      .set({ ...data, updatedAt: new Date() })
      .where(whereClause)
      .returning();
    return updated;
  }

  async toggleActive(id: string, branchId?: string) {
    const account = await this.findOne(id, branchId);
    return await this.update(id, { isActive: !account.isActive }, branchId);
  }
}
