import { Injectable, NotFoundException } from '@nestjs/common';
import { db, payrollRuns, payrollItems, employees } from '@repo/db';
import { eq } from 'drizzle-orm';

@Injectable()
export class PayrollPdfService {
  /**
   * Generate a single employee payslip as structured data.
   * Frontend can render this via @react-pdf/renderer or server-side.
   */
  async getPayslipData(runId: string, itemId: string) {
    const run = await db.query.payrollRuns.findFirst({
      where: eq(payrollRuns.id, runId),
      with: {
        currency: true,
      },
    });
    if (!run) throw new NotFoundException('Nómina no encontrada');

    const item = await db.query.payrollItems.findFirst({
      where: eq(payrollItems.id, itemId),
      with: {
        employee: {
          with: {
            position: true,
            department: true,
            branch: true,
            bank: true,
          },
        },
        lines: true,
      },
    });
    if (!item) throw new NotFoundException('Registro de nómina no encontrado');

    const incomeLines = item.lines.filter((l) => l.category === 'INCOME');
    const deductionLines = item.lines.filter((l) => l.category === 'DEDUCTION');
    const employerLines = item.lines.filter((l) => l.category === 'EMPLOYER');

    return {
      payrollRun: {
        code: run.code,
        frequency: run.frequency,
        startDate: run.startDate,
        endDate: run.endDate,
        currency: run.currency,
      },
      employee: {
        fullName: `${item.employee.firstName} ${item.employee.lastName}`,
        identityCard: item.employee.identityCard,
        position: item.employee.position?.name || '',
        department: item.employee.department?.name || '',
        branch: item.employee.branch?.name || '',
        bankName: item.employee.bank?.name || item.employee.bankName || '',
        accountNumber: item.employee.accountNumber || '',
      },
      incomeLines: incomeLines.map((l) => ({
        concept: l.conceptName,
        code: l.conceptCode,
        base: l.base,
        rate: l.rate,
        amount: l.amount,
      })),
      deductionLines: deductionLines.map((l) => ({
        concept: l.conceptName,
        code: l.conceptCode,
        base: l.base,
        rate: l.rate,
        amount: l.amount,
      })),
      employerLines: employerLines.map((l) => ({
        concept: l.conceptName,
        code: l.conceptCode,
        base: l.base,
        rate: l.rate,
        amount: l.amount,
      })),
      totals: {
        baseAmount: item.baseAmount,
        bonuses: item.bonuses,
        deductions: item.deductions,
        netTotal: item.netTotal,
      },
    };
  }

  /**
   * Generate data for all employee payslips in a payroll run.
   */
  async getBatchPayslipData(runId: string) {
    const run = await db.query.payrollRuns.findFirst({
      where: eq(payrollRuns.id, runId),
      with: {
        items: {
          with: {
            employee: {
              with: {
                position: true,
                department: true,
                branch: true,
                bank: true,
              },
            },
            lines: true,
          },
        },
        currency: true,
      },
    });

    if (!run) throw new NotFoundException('Nómina no encontrada');

    return {
      payrollRun: {
        code: run.code,
        frequency: run.frequency,
        startDate: run.startDate,
        endDate: run.endDate,
        currency: run.currency,
        totalAmount: run.totalAmount,
        status: run.status,
      },
      payslips: run.items.map((item) => {
        const incomeLines = item.lines.filter((l) => l.category === 'INCOME');
        const deductionLines = item.lines.filter(
          (l) => l.category === 'DEDUCTION',
        );
        const employerLines = item.lines.filter(
          (l) => l.category === 'EMPLOYER',
        );

        return {
          employee: {
            fullName: `${item.employee.firstName} ${item.employee.lastName}`,
            identityCard: item.employee.identityCard,
            position: item.employee.position?.name || '',
            department: item.employee.department?.name || '',
            bankName: item.employee.bank?.name || item.employee.bankName || '',
            accountNumber: item.employee.accountNumber || '',
          },
          incomeLines: incomeLines.map((l) => ({
            concept: l.conceptName,
            code: l.conceptCode,
            amount: l.amount,
          })),
          deductionLines: deductionLines.map((l) => ({
            concept: l.conceptName,
            code: l.conceptCode,
            amount: l.amount,
          })),
          employerLines: employerLines.map((l) => ({
            concept: l.conceptName,
            code: l.conceptCode,
            amount: l.amount,
          })),
          totals: {
            baseAmount: item.baseAmount,
            bonuses: item.bonuses,
            deductions: item.deductions,
            netTotal: item.netTotal,
          },
        };
      }),
    };
  }
}
