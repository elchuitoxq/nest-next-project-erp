import { Injectable, NotFoundException } from '@nestjs/common';
import { db, employeeVacations, employees } from '@repo/db';
import { eq, desc } from 'drizzle-orm';
import { CreateVacationDto, UpdateVacationDto } from '../dto/vacation.dto';

@Injectable()
export class VacationsService {
  async getVacationsByEmployee(employeeId: string) {
    return db.query.employeeVacations.findMany({
      where: eq(employeeVacations.employeeId, employeeId),
      orderBy: [desc(employeeVacations.year)],
    });
  }

  async createVacation(data: CreateVacationDto) {
    // Basic validation logic
    const employee = await db.query.employees.findFirst({
      where: eq(employees.id, data.employeeId),
    });

    if (!employee) {
      throw new NotFoundException('Employee not found');
    }

    // Calculate days taken roughly or use provided logic
    // Currently we just store manual input for simplicity in this iteration
    const daysTaken = data.totalDays; // Assuming standard request takes all available days for period
    const daysPending = 0; // TODO: Implement proper balance logic

    return await db
      .insert(employeeVacations)
      .values({
        ...data,
        daysTaken,
        daysPending,
        startDate: new Date(data.startDate),
        endDate: new Date(data.endDate),
        returnDate: new Date(data.returnDate),
        amount: data.amount?.toString(),
      })
      .returning();
  }

  async updateVacation(id: string, data: UpdateVacationDto) {
    const vacation = await db.query.employeeVacations.findFirst({
      where: eq(employeeVacations.id, id),
    });

    if (!vacation) {
      throw new NotFoundException('Vacation record not found');
    }

    const updateData: any = { ...data };

    if (data.startDate) updateData.startDate = new Date(data.startDate);
    if (data.endDate) updateData.endDate = new Date(data.endDate);
    if (data.returnDate) updateData.returnDate = new Date(data.returnDate);
    if (data.amount) updateData.amount = data.amount.toString();
    if (data.totalDays) updateData.daysTaken = data.totalDays; // sync logic

    return await db
      .update(employeeVacations)
      .set(updateData)
      .where(eq(employeeVacations.id, id))
      .returning();
  }

  async deleteVacation(id: string) {
    const existing = await db.query.employeeVacations.findFirst({
      where: eq(employeeVacations.id, id),
    });

    if (!existing) {
      throw new NotFoundException('Vacation record not found');
    }

    return await db
      .delete(employeeVacations)
      .where(eq(employeeVacations.id, id))
      .returning();
  }
}
