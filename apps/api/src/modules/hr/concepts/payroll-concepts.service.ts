import { Injectable } from '@nestjs/common';
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

  async create(data: { name: string; code: string; category: string; branchId: string }) {
    const [concept] = await db.insert(payrollConceptTypes).values(data).returning();
    return concept;
  }

  async delete(id: string) {
    return await db.delete(payrollConceptTypes).where(eq(payrollConceptTypes.id, id));
  }
}
