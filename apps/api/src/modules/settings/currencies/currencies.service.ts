import { Injectable } from '@nestjs/common';
import { db, currencies, exchangeRates } from '@repo/db';
import { desc, eq, and, sql } from 'drizzle-orm';

@Injectable()
export class CurrenciesService {
  async findAll() {
    return await db.select().from(currencies);
  }

  async create(data: typeof currencies.$inferInsert) {
    return await db.insert(currencies).values(data).returning();
  }

  async getLatestRates() {
    // Use proper join to include currency details
    const allRates = await db
      .select({
        id: exchangeRates.id,
        currencyId: exchangeRates.currencyId,
        rate: exchangeRates.rate,
        date: exchangeRates.date,
        source: exchangeRates.source,
        currency: {
          code: currencies.code,
          symbol: currencies.symbol,
        },
      })
      .from(exchangeRates)
      .innerJoin(currencies, eq(exchangeRates.currencyId, currencies.id))
      .orderBy(desc(exchangeRates.date));

    // Group by currencyId (take latest for each currency)
    const rateMap = new Map();
    for (const rate of allRates) {
      if (!rateMap.has(rate.currencyId)) {
        rateMap.set(rate.currencyId, rate);
      }
    }

    return Array.from(rateMap.values());
  }

  async addRate(currencyId: string, rate: string, source: string = 'MANUAL') {
    return await db
      .insert(exchangeRates)
      .values({
        currencyId,
        rate,
        source,
      })
      .returning();
  }

  async getLatestRate(currencyId: string) {
    const [latestRate] = await db
      .select({ rate: exchangeRates.rate })
      .from(exchangeRates)
      .where(eq(exchangeRates.currencyId, currencyId))
      .orderBy(desc(exchangeRates.date))
      .limit(1);

    return latestRate?.rate || null;
  }
}
