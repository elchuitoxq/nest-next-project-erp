import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import {
  db,
  payrollRuns,
  payrollItems,
  employees,
  currencies,
  payrollIncidents,
  payrollConceptTypes,
} from '@repo/db';
import { eq, and, desc, inArray, between, gte, lte } from 'drizzle-orm';
import { CurrenciesService } from '../../settings/currencies/currencies.service';
import Decimal from 'decimal.js';

@Injectable()
export class PayrollService {
  constructor(private readonly currenciesService: CurrenciesService) {}

  async findAll(branchId: string) {
    return await db.query.payrollRuns.findMany({
      where: eq(payrollRuns.branchId, branchId),
      orderBy: [desc(payrollRuns.startDate)],
      with: {
        currency: true,
      },
    });
  }

  async findOne(id: string) {
    const run = await db.query.payrollRuns.findFirst({
      where: eq(payrollRuns.id, id),
      with: {
        items: {
          with: {
            employee: {
              with: {
                bank: true,
              },
            },
          },
        },
        currency: true,
      },
    });
    if (!run) throw new NotFoundException('Nómina no encontrada');
    return run;
  }

  async generate(data: {
    branchId: string;
    startDate: string;
    endDate: string;
    frequency: string; // BIWEEKLY, WEEKLY
    description?: string;
  }) {
    const start = new Date(data.startDate);
    const end = new Date(data.endDate);

    // ... Currency fetch logic remains ...
    const vesCurrency = await db.query.currencies.findFirst({
      where: eq(currencies.code, 'VES'),
    });
    if (!vesCurrency)
      throw new BadRequestException('Moneda VES no configurada');

    const rateStr = await this.currenciesService.getLatestRate(vesCurrency.id);
    const exchangeRate = new Decimal(rateStr || 1);

    // ... Employee fetch logic remains ...
    const activeEmployees = await db.query.employees.findMany({
      where: and(
        eq(employees.status, 'ACTIVE'),
        eq(employees.payFrequency, data.frequency),
      ),
      with: {
        salaryCurrency: true,
      },
    });

    if (activeEmployees.length === 0) {
      throw new BadRequestException(
        'No hay empleados activos para esta frecuencia de pago',
      );
    }

    // NEW: Fetch Pending Incidents
    const employeeIds = activeEmployees.map((e) => e.id);
    const incidents = await db.query.payrollIncidents.findMany({
      where: and(
        inArray(payrollIncidents.employeeId, employeeIds),
        gte(payrollIncidents.date, start),
        lte(payrollIncidents.date, end),
        eq(payrollIncidents.status, 'PENDING'),
      ),
      with: {
        concept: true,
      },
    });

    // Group incidents by employee
    const incidentsMap = new Map<
      string,
      { income: Decimal; deduction: Decimal }
    >();

    for (const incident of incidents) {
      if (!incidentsMap.has(incident.employeeId)) {
        incidentsMap.set(incident.employeeId, {
          income: new Decimal(0),
          deduction: new Decimal(0),
        });
      }
      const acc = incidentsMap.get(incident.employeeId)!;
      const amount = new Decimal(incident.amount || 0); // Assuming amount is already calculated or we'd calc here based on qty

      // Note: If incident only has quantity (e.g. 2 hours), we need logic to calc amount.
      // For MVP, assume 'amount' is provided or we use 0. Ideally we compute: (Salary/30/8) * qty * factor.
      // Let's assume amount is passed for now to keep it simple, or user enters the $ value.

      if (incident.concept.category === 'INCOME') {
        acc.income = acc.income.plus(amount);
      } else {
        acc.deduction = acc.deduction.plus(amount);
      }
    }

    // 4. Calculate Items
    const itemsToInsert: any[] = [];
    let totalPayrollAmount = new Decimal(0);

    // Cestaticket Logic (Fixed $40 indexed)
    const cestaticketMonthlyUsd = new Decimal(40);
    let cestaticketAmountUsd = new Decimal(0);

    if (data.frequency === 'BIWEEKLY') {
      cestaticketAmountUsd = cestaticketMonthlyUsd.div(2);
    } else if (data.frequency === 'WEEKLY') {
      cestaticketAmountUsd = cestaticketMonthlyUsd.div(4);
    } else {
      cestaticketAmountUsd = cestaticketMonthlyUsd; // Monthly
    }

    // Convert Cestaticket to VES
    const cestaticketVes = cestaticketAmountUsd.times(exchangeRate);

    for (const emp of activeEmployees) {
      // Base Salary Calculation
      const monthlySalary = new Decimal(emp.baseSalary);
      let periodSalary = new Decimal(0);

      if (data.frequency === 'BIWEEKLY') {
        periodSalary = monthlySalary.div(2);
      } else if (data.frequency === 'WEEKLY') {
        periodSalary = monthlySalary.div(4);
      } else {
        periodSalary = monthlySalary;
      }

      // Convert to VES if needed
      let finalBaseAmountVes = periodSalary;
      if (emp.salaryCurrency?.code === 'USD') {
        finalBaseAmountVes = periodSalary.times(exchangeRate);
      }

      // Add Incidents
      const incidentData = incidentsMap.get(emp.id) || {
        income: new Decimal(0),
        deduction: new Decimal(0),
      };

      // Total Bonuses = Cestaticket + Incident Income
      const totalBonuses = cestaticketVes.plus(incidentData.income);

      // Total Deductions = Incident Deductions
      const totalDeductions = incidentData.deduction;

      // Total for Employee
      const netTotal = finalBaseAmountVes
        .plus(totalBonuses)
        .minus(totalDeductions);

      totalPayrollAmount = totalPayrollAmount.plus(netTotal);

      itemsToInsert.push({
        employeeId: emp.id,
        baseAmount: finalBaseAmountVes.toFixed(2),
        bonuses: totalBonuses.toFixed(2),
        deductions: totalDeductions.toFixed(2),
        netTotal: netTotal.toFixed(2),
      });
    }

    // 5. Transaction
    const code = `NOM-${data.frequency.substring(0, 3)}-${start.toISOString().split('T')[0]}`;

    return await db.transaction(async (tx) => {
      const [run] = await tx
        .insert(payrollRuns)
        .values({
          code,
          branchId: data.branchId,
          frequency: data.frequency,
          currencyId: vesCurrency.id,
          startDate: start,
          endDate: end,
          totalAmount: totalPayrollAmount.toFixed(2),
          status: 'DRAFT',
        })
        .returning();

      if (itemsToInsert.length > 0) {
        await tx
          .insert(payrollItems)
          .values(itemsToInsert.map((item) => ({ ...item, runId: run.id })));
      }

      // Mark incidents as PROCESSED
      // Get list of incident IDs that were included
      const includedIncidentIds = incidents.map((i) => i.id);
      if (includedIncidentIds.length > 0) {
        await tx
          .update(payrollIncidents)
          .set({ status: 'PROCESSED', processedInRunId: run.id })
          .where(inArray(payrollIncidents.id, includedIncidentIds));
      }

      return run;
    });
  }

  async updateStatus(id: string, status: string) {
    const [updated] = await db
      .update(payrollRuns)
      .set({ status })
      .where(eq(payrollRuns.id, id))
      .returning();
    return updated;
  }
}
