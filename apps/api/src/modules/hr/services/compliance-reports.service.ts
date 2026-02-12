import { Injectable } from '@nestjs/common';
import { db, employees, payrollRuns } from '@repo/db';
import { eq, and, gte, lte } from 'drizzle-orm';
import { Decimal } from 'decimal.js';

@Injectable()
export class ComplianceReportsService {
  /**
   * Genera la estructura para el archivo de carga masiva de FAOV (Banavih).
   * Formato aproximado: Txt o CSV con RIF, Cédula, Nombre, Saldo, Aporte Empleado, Aporte Patrono.
   */
  async generateFaovTxt(runId: string) {
    const run = await db.query.payrollRuns.findFirst({
      where: eq(payrollRuns.id, runId),
      with: {
        items: {
          with: {
            employee: true,
            lines: true,
          },
        },
      },
    });

    if (!run) return '';

    let content =
      'RIF,CEDULA,NOMBRE,SALARIO,APORTE_TRABAJADOR,APORTE_PATRONO\n';

    for (const item of run.items) {
      const faovDeduction = item.lines.find(
        (l) => l.conceptCode === 'FAOV' && l.category === 'DEDUCTION',
      );
      const faovEmployer = item.lines.find(
        (l) => l.conceptCode === 'FAOV_PATRONAL' && l.category === 'EMPLOYER',
      );

      if (!faovDeduction && !faovEmployer) continue;

      const salary = new Decimal(item.baseAmount || 0).plus(item.bonuses || 0);
      const workerContrib = faovDeduction
        ? new Decimal(faovDeduction.amount || 0)
        : new Decimal(0);
      const employerContrib = faovEmployer
        ? new Decimal(faovEmployer.amount || 0)
        : new Decimal(0);

      const line = [
        'J-000000000', // RIF Empresa (Placeholder, debería venir de config o branch)
        item.employee.identityCard,
        `${item.employee.firstName} ${item.employee.lastName}`,
        salary.toFixed(2),
        workerContrib.toFixed(2),
        employerContrib.toFixed(2),
      ].join(',');

      content += line + '\n';
    }

    return content;
  }

  /**
   * Genera un reporte de estimación de AR-I (Retención ISLR) para un empleado.
   * Basado en la Unidad Tributaria y remuneración estimada anual.
   */
  async generateAriEstimation(
    employeeId: string,
    estimatedAnnualIncome: number,
    utValue: number = 9,
  ) {
    // Tabla de retención (simplificada para el ejemplo, debería ser configurable)
    // Por ahora retornamos una estructura con los cálculos.
    const income = new Decimal(estimatedAnnualIncome);
    const ut = new Decimal(utValue);
    const totalUt = income.dividedBy(ut);

    let percentage = 0;
    const sustraendo = 0;

    if (totalUt.lte(1000)) {
      percentage = 0;
    } else if (totalUt.lte(1500)) {
      percentage = 0.06;
    } else if (totalUt.lte(2000)) {
      percentage = 0.09;
    } else {
      percentage = 0.34; // Simplificado
    }

    const retentionAmount = income.times(percentage);

    return {
      employeeId,
      estimatedAnnualIncome,
      utValue,
      totalUt: totalUt.toNumber(),
      retentionPercentage: percentage * 100,
      estimatedRetentionAmount: retentionAmount.toNumber(),
    };
  }
}
