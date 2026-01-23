import { Injectable, BadRequestException } from '@nestjs/common';
import { db, employees, payrollRuns, payrollItems } from '@repo/db';
import { eq, desc } from 'drizzle-orm';
import Decimal from 'decimal.js';

@Injectable()
export class HrService {
  async findAllEmployees() {
    return await db.select().from(employees);
  }

  async createPayrollRun(data: {
    startDate: string;
    endDate: string;
    code: string;
  }) {
    return await db.transaction(async (tx) => {
      // 1. Create Run Header
      const [run] = await tx
        .insert(payrollRuns)
        .values({
          code: data.code,
          startDate: new Date(data.startDate),
          endDate: new Date(data.endDate),
          status: 'DRAFT',
        })
        .returning();

      // 2. Fetch Active Employees
      const activeEmployees = await tx
        .select()
        .from(employees)
        .where(eq(employees.status, 'ACTIVE'));

      let totalRunAmount = new Decimal(0);

      // 3. Generate Items
      for (const emp of activeEmployees) {
        const baseSalary = new Decimal(emp.baseSalary);
        let payAmount = baseSalary;

        // Simple logic: if Biweekly, divide by 2. If Weekly, divide by 4.
        if (emp.payFrequency === 'BIWEEKLY') payAmount = baseSalary.div(2);
        if (emp.payFrequency === 'WEEKLY') payAmount = baseSalary.div(4);

        totalRunAmount = totalRunAmount.plus(payAmount);

        await tx.insert(payrollItems).values({
          runId: run.id,
          employeeId: emp.id,
          baseAmount: payAmount.toString(),
          netTotal: payAmount.toString(),
        });
      }

      // 4. Update Header Total
      await tx
        .update(payrollRuns)
        .set({ totalAmount: totalRunAmount.toString() })
        .where(eq(payrollRuns.id, run.id));

      return run;
    });
  }

  async findAllRuns() {
    return await db
      .select()
      .from(payrollRuns)
      .orderBy(desc(payrollRuns.createdAt));
  }

  async getRunDetails(runId: string) {
    const header = await db
      .select()
      .from(payrollRuns)
      .where(eq(payrollRuns.id, runId));
    const items = await db
      .select({
        id: payrollItems.id,
        empName: employees.firstName,
        empLastName: employees.lastName,
        base: payrollItems.baseAmount,
        total: payrollItems.netTotal,
      })
      .from(payrollItems)
      .leftJoin(employees, eq(payrollItems.employeeId, employees.id))
      .where(eq(payrollItems.runId, runId));

    return { header: header[0], items };
  }
}
