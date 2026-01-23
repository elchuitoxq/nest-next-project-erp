import { Injectable } from '@nestjs/common';
import { db, partners } from '@repo/db';
import { eq, desc, ilike, or, and } from 'drizzle-orm';

@Injectable()
export class PartnersService {
  async findAll(search?: string, type?: string) {
    const conditions = [];

    if (search) {
      conditions.push(
        or(
          ilike(partners.name, `%${search}%`),
          ilike(partners.taxId, `%${search}%`),
        ),
      );
    }

    if (type) {
      // Logic: If I ask for 'CUSTOMER', I want CUSTOMER or BOTH.
      // If I ask for 'SUPPLIER', I want SUPPLIER or BOTH.
      conditions.push(or(eq(partners.type, type), eq(partners.type, 'BOTH')));
    }

    return await db
      .select()
      .from(partners)
      .where(conditions.length > 0 ? and(...conditions) : undefined)
      .orderBy(desc(partners.createdAt));
  }

  async findOne(id: string) {
    const result = await db.select().from(partners).where(eq(partners.id, id));
    return result[0];
  }

  async create(data: typeof partners.$inferInsert) {
    return await db.insert(partners).values(data).returning();
  }

  async update(id: string, data: Partial<typeof partners.$inferInsert>) {
    return await db
      .update(partners)
      .set(data)
      .where(eq(partners.id, id))
      .returning();
  }

  async delete(id: string) {
    return await db.delete(partners).where(eq(partners.id, id)).returning();
  }
}
