import { Injectable } from '@nestjs/common';
import { db, taxConcepts } from '@repo/db';
import { eq, asc } from 'drizzle-orm';

@Injectable()
export class TaxConceptsService {
  async findAll() {
    return await db.query.taxConcepts.findMany({
      orderBy: [asc(taxConcepts.code)],
    });
  }

  async findOne(id: string) {
    return await db.query.taxConcepts.findFirst({
      where: eq(taxConcepts.id, id),
    });
  }

  async create(data: any) {
    const [concept] = await db.insert(taxConcepts).values(data).returning();
    return concept;
  }

  async update(id: string, data: any) {
    const [concept] = await db
      .update(taxConcepts)
      .set(data)
      .where(eq(taxConcepts.id, id))
      .returning();
    return concept;
  }

  async remove(id: string) {
    return await db.delete(taxConcepts).where(eq(taxConcepts.id, id));
  }
}
