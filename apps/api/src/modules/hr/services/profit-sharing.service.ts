import { Injectable, NotFoundException } from '@nestjs/common';
import { db, employeeProfitSharing, employees } from '@repo/db';
import { eq, desc } from 'drizzle-orm';
import {
  CreateProfitSharingDto,
  UpdateProfitSharingDto,
} from '../dto/profit-sharing.dto';

@Injectable()
export class ProfitSharingService {
  async getByEmployee(employeeId: string) {
    return db.query.employeeProfitSharing.findMany({
      where: eq(employeeProfitSharing.employeeId, employeeId),
      orderBy: [desc(employeeProfitSharing.year)],
    });
  }

  async create(data: CreateProfitSharingDto) {
    const employee = await db.query.employees.findFirst({
      where: eq(employees.id, data.employeeId),
    });

    if (!employee) {
      throw new NotFoundException('Employee not found');
    }

    return await db
      .insert(employeeProfitSharing)
      .values({
        ...data,
        amount: data.amount.toString(),
        paymentDate: data.paymentDate ? new Date(data.paymentDate) : null,
      })
      .returning();
  }
}
