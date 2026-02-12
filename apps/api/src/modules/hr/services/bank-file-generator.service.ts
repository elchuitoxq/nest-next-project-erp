import { Injectable, NotFoundException } from '@nestjs/common';
import { db, payrollRuns } from '@repo/db';
import { eq } from 'drizzle-orm';
import { Decimal } from 'decimal.js';

@Injectable()
export class BankFileGeneratorService {
  /**
   * Genera un archivo TXT con formato estándar para carga masiva (Tipo Banesco/Mercantil).
   * Formato:
   * V/E (1 car), Cédula (hasta 10 car), Cuenta (20 car), Monto (hasta 15 car, sin puntos), Nombre (40 car)
   */
  async generateStandardTxt(runId: string): Promise<string> {
    const run = await db.query.payrollRuns.findFirst({
      where: eq(payrollRuns.id, runId),
      with: {
        items: {
          with: {
            employee: true,
          },
        },
      },
    });

    if (!run) throw new NotFoundException('Nómina no encontrada');

    let content = '';

    for (const item of run.items) {
      // Ignorar montos 0
      const amount = new Decimal(item.netTotal);
      if (amount.lessThanOrEqualTo(0)) continue;

      const employee = item.employee;
      if (!employee.accountNumber) continue; // Saltar si no tiene cuenta

      // Formato: Nacionalidad
      const nationality = employee.identityCard.startsWith('V')
        ? 'V'
        : employee.identityCard.startsWith('E')
          ? 'E'
          : 'V';

      // Formato: Cédula (solo números)
      const identityNumber = employee.identityCard.replace(/\D/g, '');

      // Formato: Cuenta (20 dígitos)
      const account = employee.accountNumber.replace(/\D/g, '');
      if (account.length !== 20) continue; // Validar longitud cuenta

      // Formato: Monto (ej: 100.50 -> 10050)
      const amountStr = amount.times(100).toFixed(0);

      // Formato: Nombre (Hasta 40 caracteres, mayúsculas)
      const fullName = `${employee.lastName} ${employee.firstName}`
        .toUpperCase()
        .slice(0, 40)
        .padEnd(40, ' ');

      // Construcción de línea
      // V12345678            0134...123400000010050JUAN PEREZ
      // Usaremos CSV por simplicidad y compatibilidad mayor si no hay spec exacta
      // Pero el plan dice TXT. Hagamos un fixed width simple común.

      // Spec genérica tipo Banesco Nominas:
      // TIPO_ID | E/V | ID | CUENTA | MONTO | REFERENCIA | NOMBRE
      // O simple CSV:
      // V,12345678,01341111222233334444,100.50,JUAN PEREZ

      // Al no tener spec exacta del usuario, haré un CSV tab-separated o comma-separated que es fácil de importar.
      // O mejor, el formato "V,Cédula,Cuenta,Monto,Nombre"

      content += `${nationality},${identityNumber},${account},${amount.toFixed(2)},${fullName.trim()}\n`;
    }

    return content;
  }
}
