import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { db, employees, employeeContracts, employeeBenefits } from '@repo/db';
import { eq, and } from 'drizzle-orm';
import {
  CalculateTerminationDto,
  ExecuteTerminationDto,
} from '../dto/termination.dto';
import Decimal from 'decimal.js';

@Injectable()
export class TerminationsService {
  async calculate(data: CalculateTerminationDto) {
    const employee = await db.query.employees.findFirst({
      where: eq(employees.id, data.employeeId),
      with: {
        contracts: true, // Need active contract to know start date
      },
    });

    if (!employee) throw new NotFoundException('Empleado no encontrado');

    const activeContract = employee.contracts.find(
      (c) => c.status === 'ACTIVE',
    );
    if (!activeContract) {
      // Allow calculation even if no active contract found? Maybe just warn.
      // For now, let's proceed with current date as end.
    }

    // --- MOCK CALCULATION LOGIC ---
    // In a real Venezuelan system, this is complex (LOTTT Art 142).
    // We will do a basic approximation for Phase 2.

    const terminationDate = new Date(data.date);
    const startDate = activeContract
      ? new Date(activeContract.startDate)
      : new Date(); // Fallback

    // Tenure in years
    const diffTime = Math.abs(terminationDate.getTime() - startDate.getTime());
    const yearsTenure = diffTime / (1000 * 60 * 60 * 24 * 365);

    const baseSalary = new Decimal(employee.baseSalary || 0);

    // Concept: Guarantee (Prestaciones Sociales) - 30 days per year or fraction > 6 months
    // Simplified: 5 days per month active.
    // Let's assume we read the accumulated benefits from DB.

    const lastBenefit = await db.query.employeeBenefits.findFirst({
      where: and(
        eq(employeeBenefits.employeeId, employee.id),
        eq(employeeBenefits.type, 'REGULAR'),
      ),
      orderBy: (benefits, { desc }) => [
        desc(benefits.year),
        desc(benefits.month),
      ],
    });

    const accumulatedBenefits = new Decimal(
      lastBenefit?.accumulatedAmount || 0,
    );

    // Concept: Vacaciones Fraccionadas
    // 15 days / 12 months = 1.25 days per month worked in current year.
    // We'd need to check vacation balance. For now mock 5 days.
    const vacationDaysPending = 5;
    const vacationAmount = baseSalary.div(30).times(vacationDaysPending);

    // Concept: Utilidades Fraccionadas
    // 30 days / 12 months = 2.5 days per month.
    const profitDaysPending = 10;
    const profitAmount = baseSalary.div(30).times(profitDaysPending);

    // Double Indemnification (Doblete) if Unjustified Dismissal
    const doubleIndemnity =
      data.reason === 'DISMISSAL_UNJUSTIFIED'
        ? accumulatedBenefits
        : new Decimal(0);

    const total = accumulatedBenefits
      .plus(vacationAmount)
      .plus(profitAmount)
      .plus(doubleIndemnity);

    return {
      employee: {
        id: employee.id,
        name: `${employee.firstName} ${employee.lastName}`,
        startDate: startDate.toISOString(),
        terminationDate: terminationDate.toISOString(),
      },
      calculation: {
        tenureYears: yearsTenure.toFixed(2),
        accumulatedBenefits: accumulatedBenefits.toFixed(2),
        vacationPending: {
          days: vacationDaysPending,
          amount: vacationAmount.toFixed(2),
        },
        profitSharingPending: {
          days: profitDaysPending,
          amount: profitAmount.toFixed(2),
        },
        doubleIndemnity: doubleIndemnity.toFixed(2),
        total: total.toFixed(2),
        currency: 'VES', // Should fetch from employee salary currency
      },
    };
  }

  async execute(data: ExecuteTerminationDto) {
    const calc = await this.calculate(data);

    return await db.transaction(async (tx) => {
      // 1. Terminate all active contracts
      await tx
        .update(employeeContracts)
        .set({
          status: 'TERMINATED',
          endDate: new Date(data.date),
          updatedAt: new Date(),
        })
        .where(
          and(
            eq(employeeContracts.employeeId, data.employeeId),
            eq(employeeContracts.status, 'ACTIVE'),
          ),
        );

      // 2. Set employee status to INACTIVE
      await tx
        .update(employees)
        .set({
          status: 'INACTIVE',
          updatedAt: new Date(),
        })
        .where(eq(employees.id, data.employeeId));

      // 3. Register Liquidation Record in Benefits (as a payment/outcome)
      // We register it as 'LIQUIDACION' type so it resets the accumulated for re-hiring or tracking.
      await tx.insert(employeeBenefits).values({
        employeeId: data.employeeId,
        year: new Date(data.date).getFullYear(),
        month: new Date(data.date).getMonth() + 1,
        type: 'LIQUIDACION',
        monthlySalary: '0',
        integralSalary: '0',
        days: 0,
        amount: calc.calculation.total,
        accumulatedAmount: '0',
        notes: `Liquidación por ${data.reason}. ${data.notes || ''}`,
        paymentDate: new Date(),
        paid: false,
      });

      return { success: true, liquidacion: calc };
    });
  }
}
