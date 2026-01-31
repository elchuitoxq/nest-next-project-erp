import { Injectable } from '@nestjs/common';
import { db, partners } from '@repo/db';
import { eq, desc, ilike, or, and, inArray, sql, SQL } from 'drizzle-orm';
import { FindPartnersDto } from './dto/find-partners.dto';

@Injectable()
export class PartnersService {
  async findAll(query: FindPartnersDto) {
    const { page = 1, limit = 10, search, type } = query;
    const offset = (page - 1) * limit;

    const conditions = [];

    if (search) {
      // Split search terms
      const searchTerms = search.split(',').map(s => s.trim()).filter(Boolean);
      const termConditions = [];

      for (const term of searchTerms) {
        termConditions.push(ilike(partners.name, `%${term}%`));
        termConditions.push(ilike(partners.taxId, `%${term}%`));
        termConditions.push(ilike(partners.email, `%${term}%`));
      }
      
      if (termConditions.length > 0) {
        conditions.push(or(...termConditions)!);
      }
    }

    if (type && type.length > 0) {
      // Logic: If I ask for 'CUSTOMER', I want CUSTOMER or BOTH.
      // If I ask for 'SUPPLIER', I want SUPPLIER or BOTH.
      // If I ask for multiple types, handle accordingly.
      
      const typeConditions = [];
      if (Array.isArray(type)) {
        if (type.includes('CUSTOMER')) {
           typeConditions.push(eq(partners.type, 'CUSTOMER'));
        }
        if (type.includes('SUPPLIER')) {
           typeConditions.push(eq(partners.type, 'SUPPLIER'));
        }
        // Always include BOTH if we are filtering by type at all? 
        // Usually yes, a partner that is BOTH is also a CUSTOMER and a SUPPLIER.
        typeConditions.push(eq(partners.type, 'BOTH'));
        
        conditions.push(or(...typeConditions)!);
      } else {
         // Single value legacy support or if array check failed
         conditions.push(or(eq(partners.type, type), eq(partners.type, 'BOTH'))!);
      }
    }

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

    // 1. Get Total Count
    const [countResult] = await db
      .select({ count: sql<number>`count(*)` })
      .from(partners)
      .where(whereClause);
    
    const total = Number(countResult?.count || 0);

    // 2. Get Paginated Data
    const data = await db
      .select()
      .from(partners)
      .where(whereClause)
      .limit(limit)
      .offset(offset)
      .orderBy(desc(partners.createdAt));

    return {
      data,
      meta: {
        total,
        page,
        lastPage: Math.ceil(total / limit),
      },
    };
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
