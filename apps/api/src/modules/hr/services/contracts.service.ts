import { Injectable, NotFoundException } from '@nestjs/common';
import { db, employeeContracts } from '@repo/db';
import { eq, desc } from 'drizzle-orm';
import { CreateContractDto, UpdateContractDto } from '../dto/contract.dto';

@Injectable()
export class ContractsService {
  async findByEmployee(employeeId: string) {
    return await db.query.employeeContracts.findMany({
      where: eq(employeeContracts.employeeId, employeeId),
      orderBy: desc(employeeContracts.startDate),
    });
  }

  async create(data: CreateContractDto) {
    // Si hay un contrato activo, lo marcamos como terminado o expirado?
    // Por ahora solo creamos el nuevo. La lógica de negocio puede ser más compleja después.

    const [contract] = await db
      .insert(employeeContracts)
      .values({
        employeeId: data.employeeId,
        type: data.type,
        startDate: new Date(data.startDate),
        endDate: data.endDate ? new Date(data.endDate) : null,
        trialPeriodEnd: data.trialPeriodEnd
          ? new Date(data.trialPeriodEnd)
          : null,
        weeklyHours: data.weeklyHours ? data.weeklyHours.toString() : '40',
        notes: data.notes,
        status: 'ACTIVE',
      })
      .returning();

    return contract;
  }

  async update(id: string, data: UpdateContractDto) {
    const [updated] = await db
      .update(employeeContracts)
      .set({
        type: data.type,
        startDate: data.startDate ? new Date(data.startDate) : undefined,
        endDate: data.endDate ? new Date(data.endDate) : undefined,
        trialPeriodEnd: data.trialPeriodEnd
          ? new Date(data.trialPeriodEnd)
          : undefined,
        weeklyHours: data.weeklyHours ? data.weeklyHours.toString() : undefined,
        notes: data.notes,
        status: data.status,
        updatedAt: new Date(),
      })
      .where(eq(employeeContracts.id, id))
      .returning();

    if (!updated) throw new NotFoundException('Contrato no encontrado');
    return updated;
  }

  async terminate(id: string, endDate: string) {
    const [updated] = await db
      .update(employeeContracts)
      .set({
        status: 'TERMINATED',
        endDate: new Date(endDate),
        updatedAt: new Date(),
      })
      .where(eq(employeeContracts.id, id))
      .returning();

    if (!updated) throw new NotFoundException('Contrato no encontrado');
    return updated;
  }
}
