import { Injectable, NotFoundException } from '@nestjs/common';
import { db, payrollIncidents, payrollConceptTypes, employees } from '@repo/db';
import { eq, desc, and } from 'drizzle-orm';
import {
  CreateIncidentDto,
  UpdateIncidentDto,
} from '../dto/payroll-incident.dto';

@Injectable()
export class PayrollIncidentsService {
  async findAll(employeeId?: string) {
    const query = db.query.payrollIncidents.findMany({
      where: employeeId
        ? eq(payrollIncidents.employeeId, employeeId)
        : undefined,
      orderBy: [desc(payrollIncidents.date)],
      with: {
        concept: true,
        employee: true,
      },
    });
    return query;
  }

  async create(data: CreateIncidentDto) {
    // Validate concept exists
    const concept = await db.query.payrollConceptTypes.findFirst({
      where: eq(payrollConceptTypes.id, data.conceptId),
    });
    if (!concept) throw new NotFoundException('Concepto no encontrado');

    const result = await db
      .insert(payrollIncidents)
      .values({
        ...data,
        date: new Date(data.date),
        quantity: data.quantity?.toString() || '1',
        amount: data.amount?.toString(),
        status: 'PENDING',
      })
      .returning();
    return result[0];
  }

  async update(id: string, data: UpdateIncidentDto) {
    const [updated] = await db
      .update(payrollIncidents)
      .set({
        ...data,
        quantity: data.quantity?.toString(),
        amount: data.amount?.toString(),
      })
      .where(eq(payrollIncidents.id, id))
      .returning();
    return updated;
  }

  async delete(id: string) {
    // Logic to prevent deleting processed incidents could be added here
    return await db.delete(payrollIncidents).where(eq(payrollIncidents.id, id));
  }
}
