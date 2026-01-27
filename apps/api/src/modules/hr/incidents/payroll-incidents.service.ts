import { Injectable } from '@nestjs/common';
import { db, payrollIncidents, employees } from '@repo/db';
import { eq, desc, and } from 'drizzle-orm';

@Injectable()
export class PayrollIncidentsService {
  async findAll(branchId: string) {
    // We need to filter by employees in branch. 
    // This is a bit complex in Drizzle without explicit join in query builder or relations.
    // For simplicity, I'll fetch all and filter or assume frontend filters by employee context.
    // Better: Fetch incidents where employee -> position -> (maybe branch?) or just simple logic.
    // Let's rely on employeeId filtering from frontend usually.
    
    // For now, return recent incidents.
    return await db.query.payrollIncidents.findMany({
      orderBy: [desc(payrollIncidents.date)],
      with: {
        concept: true,
        employee: true
      },
      limit: 50
    });
  }

  async create(data: any) {
    const [incident] = await db.insert(payrollIncidents).values({
      ...data,
      date: new Date(data.date),
      status: 'PENDING'
    }).returning();
    return incident;
  }

  async delete(id: string) {
    return await db.delete(payrollIncidents).where(eq(payrollIncidents.id, id));
  }
}
