import { Injectable } from '@nestjs/common';
import { db, banks } from '@repo/db';
import { eq, asc, desc } from 'drizzle-orm';

@Injectable()
export class BanksService {
  async findAll() {
    return await db.query.banks.findMany({
      orderBy: [asc(banks.name)],
    });
  }

  async create(data: { name: string; code: string }) {
    const [bank] = await db.insert(banks).values(data).returning();
    return bank;
  }

  async update(id: string, data: { name?: string; code?: string }) {
    const [bank] = await db
      .update(banks)
      .set(data)
      .where(eq(banks.id, id))
      .returning();
    return bank;
  }

  async toggleActive(id: string) {
    const bank = await db.query.banks.findFirst({
      where: eq(banks.id, id),
    });

    if (!bank) return null;

    const [updated] = await db
      .update(banks)
      .set({ isActive: !bank.isActive })
      .where(eq(banks.id, id))
      .returning();

    return updated;
  }
}
