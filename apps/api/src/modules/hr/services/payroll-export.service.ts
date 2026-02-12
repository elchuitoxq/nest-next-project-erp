import { Injectable, NotFoundException } from '@nestjs/common';
import { db, payrollRuns } from '@repo/db';
import { eq } from 'drizzle-orm';

@Injectable()
export class PayrollExportService {
  /**
   * Generate bank TXT file content for mass transfer.
   * Venezuelan standard format: CI;MONTO;CUENTA;BANCO;NOMBRE
   */
  async generateBankTxt(runId: string): Promise<string> {
    const run = await db.query.payrollRuns.findFirst({
      where: eq(payrollRuns.id, runId),
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
      },
    });

    if (!run) throw new NotFoundException('Nómina no encontrada');

    if (run.status !== 'PAID' && run.status !== 'DRAFT') {
      throw new NotFoundException(
        'La nómina debe estar en estado BORRADOR o PAGADA',
      );
    }

    const lines: string[] = [];

    // Header
    lines.push('CEDULA;MONTO;CUENTA;BANCO;NOMBRE');

    for (const item of run.items) {
      const emp = item.employee;
      const ci = emp.identityCard || '';
      const amount = item.netTotal;
      const account = emp.accountNumber || '';
      const bankCode = emp.bank?.code || '';
      const name = `${emp.firstName} ${emp.lastName}`;

      lines.push(`${ci};${amount};${account};${bankCode};${name}`);
    }

    return lines.join('\n');
  }

  /**
   * Generate detailed payroll data for Excel export.
   * Returns structured data that the frontend can convert to Excel.
   */
  async getExcelData(runId: string) {
    const run = await db.query.payrollRuns.findFirst({
      where: eq(payrollRuns.id, runId),
      with: {
        items: {
          with: {
            employee: {
              with: {
                position: true,
                department: true,
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

    // Collect unique concept codes for columns
    const conceptSet = new Set<string>();
    for (const item of run.items) {
      for (const line of item.lines) {
        conceptSet.add(line.conceptCode);
      }
    }
    const conceptCodes = Array.from(conceptSet).sort();

    // Build rows
    const rows = run.items.map((item) => {
      const emp = item.employee;
      const linesByCode = new Map<string, string>();
      for (const line of item.lines) {
        linesByCode.set(line.conceptCode, line.amount);
      }

      return {
        cedula: emp.identityCard,
        nombre: `${emp.firstName} ${emp.lastName}`,
        cargo: emp.position?.name || '',
        departamento: emp.department?.name || '',
        salarioBase: item.baseAmount,
        ...Object.fromEntries(
          conceptCodes.map((code) => [code, linesByCode.get(code) || '0']),
        ),
        totalAsignaciones: item.bonuses,
        totalDeducciones: item.deductions,
        netoACobrar: item.netTotal,
        banco: emp.bank?.name || emp.bankName || '',
        cuenta: emp.accountNumber || '',
      };
    });

    return {
      payrollCode: run.code,
      frequency: run.frequency,
      period: {
        start: run.startDate,
        end: run.endDate,
      },
      currency: run.currency,
      conceptColumns: conceptCodes,
      rows,
      totalAmount: run.totalAmount,
    };
  }

  /**
   * Generate a native Excel file (xlsx) with detailed payroll data.
   */
  async generateExcelFile(runId: string): Promise<Buffer> {
    // Re-use logic to get data, or fetch fresh deep data
    const data = await this.getExcelData(runId);

    // Lazy load exceljs to avoid build issues if not installed yet (though we installed it)
    // const ExcelJS = require('exceljs');
    // Better use import if we are sure it's available, but let's use dynamic import or require for safety in this snippet context
    // or just assume standard import at top.
    // For this edit, I will add the import at top in a separate step or assume I can't easily add top-level import with replace_content
    // without reading the whole file.
    // Actually, I should use `import * as ExcelJS from 'exceljs'` at top, but I'll use require here to be self-contained in method
    // or I'll assume I can add the import.
    // Let's use standard require for simplicity in this method to avoid messing top imports blindly.

    const ExcelJS = require('exceljs');

    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet('Nómina Detallada');

    // -- HEADERS --
    const columns = [
      { header: 'Cédula', key: 'cedula', width: 15 },
      { header: 'Nombre', key: 'nombre', width: 30 },
      { header: 'Cargo', key: 'cargo', width: 20 },
      { header: 'Departamento', key: 'departamento', width: 20 },
      { header: 'Banco', key: 'banco', width: 20 },
      { header: 'Cuenta', key: 'cuenta', width: 25 },
      {
        header: 'Salario Base',
        key: 'salarioBase',
        width: 15,
        style: { numFmt: '#,##0.00' },
      },
    ];

    // Dynamic concept columns
    data.conceptColumns.forEach((code) => {
      columns.push({
        header: code,
        key: code,
        width: 15,
        style: { numFmt: '#,##0.00' },
      });
    });

    columns.push({
      header: 'Total Asignaciones',
      key: 'totalAsignaciones',
      width: 18,
      style: { numFmt: '#,##0.00' },
    });
    columns.push({
      header: 'Total Deducciones',
      key: 'totalDeducciones',
      width: 18,
      style: { numFmt: '#,##0.00' },
    });
    columns.push({
      header: 'Neto a Cobrar',
      key: 'netoACobrar',
      width: 18,
      style: { numFmt: '#,##0.00' },
    });

    sheet.columns = columns;

    // -- DATA --
    sheet.addRows(data.rows);

    // -- STYLING --
    sheet.getRow(1).font = { bold: true };
    sheet.getRow(1).fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFE0E0E0' },
    };

    // -- SUMMARY SHEET BY BANK (User Request: "gestionar por banco") --
    const bankSheet = workbook.addWorksheet('Resumen por Banco');
    bankSheet.columns = [
      { header: 'Banco', key: 'banco', width: 30 },
      { header: 'Cantidad Empleados', key: 'count', width: 20 },
      {
        header: 'Monto Total',
        key: 'total',
        width: 20,
        style: { numFmt: '#,##0.00' },
      },
    ];

    // Group by bank
    const bankSummary = new Map<string, { count: number; total: number }>();
    data.rows.forEach((row) => {
      const bankName = row.banco || 'SIN BANCO';
      const current = bankSummary.get(bankName) || { count: 0, total: 0 };
      current.count++;
      current.total += parseFloat(row.netoACobrar);
      bankSummary.set(bankName, current);
    });

    bankSummary.forEach((value, key) => {
      bankSheet.addRow({
        banco: key,
        count: value.count,
        total: value.total,
      });
    });

    bankSheet.getRow(1).font = { bold: true };

    const buffer = await workbook.xlsx.writeBuffer();
    return buffer as Buffer;
  }
}
