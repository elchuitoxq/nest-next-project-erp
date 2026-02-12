import { Injectable, NotFoundException } from '@nestjs/common';
import { db, payrollConceptTypes } from '@repo/db';
import { eq, asc } from 'drizzle-orm';

@Injectable()
export class PayrollConceptsService {
  async findAll(branchId: string) {
    return await db.query.payrollConceptTypes.findMany({
      where: eq(payrollConceptTypes.branchId, branchId),
      orderBy: [asc(payrollConceptTypes.name)],
    });
  }

  async create(data: {
    name: string;
    code: string;
    category: string;
    branchId: string;
  }) {
    const [concept] = await db
      .insert(payrollConceptTypes)
      .values(data)
      .returning();
    return concept;
  }

  async update(
    id: string,
    data: { name?: string; code?: string; category?: string },
  ) {
    const [updated] = await db
      .update(payrollConceptTypes)
      .set(data)
      .where(eq(payrollConceptTypes.id, id))
      .returning();

    if (!updated)
      throw new NotFoundException('Concepto de nómina no encontrado');
    return updated;
  }

  async delete(id: string) {
    return await db
      .delete(payrollConceptTypes)
      .where(eq(payrollConceptTypes.id, id));
  }
}
