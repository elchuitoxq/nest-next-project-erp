import { Injectable } from '@nestjs/common';
import { db, currencies, exchangeRates } from '@repo/db';
import { desc, eq, and } from 'drizzle-orm';

@Injectable()
export class CurrenciesService {
  async findAll(branchId?: string) {
    return await db
      .select()
      .from(currencies)
      .where(branchId ? eq(currencies.branchId, branchId) : undefined);
  }

  async create(data: typeof currencies.$inferInsert) {
    return await db.insert(currencies).values(data).returning();
  }

  async getLatestRates(branchId?: string) {
    const whereClause = branchId
      ? eq(exchangeRates.branchId, branchId)
      : undefined;

    const allRates = await db
      .select()
      .from(exchangeRates)
      .where(whereClause)
      .orderBy(desc(exchangeRates.date));

    // Group by currencyId in memory
    const latestRates = new Map();
    for (const rate of allRates) {
      if (!latestRates.has(rate.currencyId)) {
        latestRates.set(rate.currencyId, rate);
      }
    }
    return Array.from(latestRates.values());
  }

  async addRate(
    currencyId: string,
    rate: string,
    branchId: string,
    source: string = 'MANUAL',
  ) {
    return await db
      .insert(exchangeRates)
      .values({
        currencyId,
        rate,
        branchId,
        source,
      })
      .returning();
  }

  async getLatestRate(currencyId: string, branchId: string) {
    const [rate] = await db
      .select({ rate: exchangeRates.rate })
      .from(exchangeRates)
      .where(
        and(
          eq(exchangeRates.currencyId, currencyId),
          eq(exchangeRates.branchId, branchId),
        ),
      )
      .orderBy(desc(exchangeRates.date))
      .limit(1);

    return rate?.rate || null;
  }
}
