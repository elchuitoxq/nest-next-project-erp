import { Injectable, NotFoundException } from '@nestjs/common';
import { db, employeeBenefits, employees } from '@repo/db';
import { eq, desc, and } from 'drizzle-orm';
import { CreateBenefitDto, UpdateBenefitDto } from '../dto/benefit.dto';

@Injectable()
export class BenefitsService {
  async getBenefitsByEmployee(employeeId: string) {
    return db.query.employeeBenefits.findMany({
      where: eq(employeeBenefits.employeeId, employeeId),
      orderBy: [desc(employeeBenefits.year), desc(employeeBenefits.month)],
    });
  }

  async createBenefit(data: CreateBenefitDto) {
    // Verify employee exists
    const employee = await db.query.employees.findFirst({
      where: eq(employees.id, data.employeeId),
    });

    if (!employee) {
      throw new NotFoundException('Employee not found');
    }

    // Convert numbers to strings for decimal fields if necessary,
    // but Drizzle handles number->numeric mapping reasonably well usually.
    // Ensure precision.

    // Calculate accumulated amount: previous accumulated + current amount
    // Find last benefit to get previous accumulated
    const lastBenefit = await db.query.employeeBenefits.findFirst({
      where: and(
        eq(employeeBenefits.employeeId, data.employeeId),
        eq(employeeBenefits.type, 'REGULAR'),
      ),
      orderBy: [desc(employeeBenefits.year), desc(employeeBenefits.month)],
    });

    const previousAccumulated = lastBenefit
      ? Number(lastBenefit.accumulatedAmount)
      : 0;
    const currentAccumulated = previousAccumulated + data.amount;

    return await db
      .insert(employeeBenefits)
      .values({
        ...data,
        monthlySalary: data.monthlySalary.toString(),
        integralSalary: data.integralSalary.toString(),
        amount: data.amount.toString(),
        accumulatedAmount: currentAccumulated.toString(),
      })
      .returning();
  }

  async updateBenefit(id: string, data: UpdateBenefitDto) {
    const benefit = await db.query.employeeBenefits.findFirst({
      where: eq(employeeBenefits.id, id),
    });

    if (!benefit) {
      throw new NotFoundException('Benefit record not found');
    }

    const updateData: any = { ...data };

    if (data.amount) {
      updateData.amount = data.amount.toString();
      // Recalculating accumulated amount is complex if we update historical records.
      // For simplicity in this iteration, we assume updates are mostly for payment status or notes on recent records.
      // If amount changes, we might need a full recalculation trigger.
    }

    if (data.paymentDate) {
      updateData.paymentDate = new Date(data.paymentDate);
    }

    return await db
      .update(employeeBenefits)
      .set(updateData)
      .where(eq(employeeBenefits.id, id))
      .returning();
  }

  // Future: Method to auto-calculate benefit based on active contract and salary

  async deleteBenefit(id: string) {
    const existing = await db.query.employeeBenefits.findFirst({
      where: eq(employeeBenefits.id, id),
    });

    if (!existing) {
      throw new NotFoundException('Benefit record not found');
    }

    // TODO: Handle accumulated amount Recalculation on delete
    // For now, allow deletion but warn or handle manually

    return await db
      .delete(employeeBenefits)
      .where(eq(employeeBenefits.id, id))
      .returning();
  }
}
