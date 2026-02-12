import { Injectable, OnModuleInit } from '@nestjs/common';
import { db, payrollSettings, payrollConceptTypes } from '@repo/db';
import { eq, inArray } from 'drizzle-orm';
import { UpdatePayrollSettingDto } from '../dto/payroll-settings.dto';

@Injectable()
export class PayrollSettingsService implements OnModuleInit {
  async onModuleInit() {
    await this.seedDefaults();
  }

  async findAll() {
    return this.getSettingsMap();
  }

  async getSettingsMap() {
    const settings = await db.query.payrollSettings.findMany({
      where: eq(payrollSettings.isActive, true),
    });

    // Transform array to key-value object for easier frontend consumption
    const settingsMap: Record<string, any> = {};
    settings.forEach((s) => {
      settingsMap[s.key] = {
        id: s.id,
        label: s.label,
        value: Number(s.value),
        type: s.type,
      };
    });
    return settingsMap;
  }

  async updateBatch(updates: UpdatePayrollSettingDto[]) {
    const results = [];
    for (const update of updates) {
      // Upsert logic
      const existing = await db.query.payrollSettings.findFirst({
        where: eq(payrollSettings.key, update.key),
      });

      if (existing) {
        const [updated] = await db
          .update(payrollSettings)
          .set({
            value: update.value.toString(),
            label: update.label,
            type: update.type,
            updatedAt: new Date(),
          })
          .where(eq(payrollSettings.id, existing.id))
          .returning();
        results.push(updated);
      } else {
        const [created] = await db
          .insert(payrollSettings)
          .values({
            key: update.key,
            label: update.label,
            value: update.value.toString(),
            type: update.type,
            isActive: true,
          })
          .returning();
        results.push(created);
      }
    }
    return results;
  }

  async getConceptTypes() {
    return db.query.payrollConceptTypes.findMany();
  }

  private async seedDefaults() {
    const defaults = [
      {
        key: 'UNIT_TAX_VALUE',
        label: 'Unidad Tributaria (UT)',
        value: '9',
        type: 'FIXED_VES',
      }, // Example value
      {
        key: 'CESTATICKET_VALUE',
        label: 'Cestaticket Socialista',
        value: '40',
        type: 'FIXED_USD',
      }, // Example value, usually anchored to USD index
      {
        key: 'SSO_EMPLOYEE_PCT',
        label: '% SSO (Empleado)',
        value: '0.04',
        type: 'PERCENTAGE',
      },
      {
        key: 'SSO_EMPLOYER_PCT',
        label: '% SSO (Patrono - Riesgo Min)',
        value: '0.09',
        type: 'PERCENTAGE',
      }, // Varies by risk
      {
        key: 'PIE_EMPLOYEE_PCT',
        label: '% PIE (Empleado)',
        value: '0.005',
        type: 'PERCENTAGE',
      },
      {
        key: 'PIE_EMPLOYER_PCT',
        label: '% PIE (Patrono)',
        value: '0.02',
        type: 'PERCENTAGE',
      },
      {
        key: 'FAOV_EMPLOYEE_PCT',
        label: '% FAOV (Empleado)',
        value: '0.01',
        type: 'PERCENTAGE',
      },
      {
        key: 'FAOV_EMPLOYER_PCT',
        label: '% FAOV (Patrono)',
        value: '0.02',
        type: 'PERCENTAGE',
      },
    ];

    for (const def of defaults) {
      const existing = await db.query.payrollSettings.findFirst({
        where: eq(payrollSettings.key, def.key),
      });

      if (!existing) {
        await db.insert(payrollSettings).values({
          key: def.key,
          label: def.label,
          value: def.value,
          type: def.type as any,
          isActive: true,
        });
        console.log(`Seeded payroll setting: ${def.key}`);
      }
    }

    // Seed Concept Types if empty
    const existingConcepts = await db.query.payrollConceptTypes.findFirst();
    if (!existingConcepts) {
      await db.insert(payrollConceptTypes).values([
        {
          code: 'SALARY_BASE',
          name: 'Sueldo Base',
          category: 'INCOME',
          isSystem: true,
        },
        {
          code: 'CESTATICKET',
          name: 'Cestaticket',
          category: 'INCOME',
          isSystem: true,
        },
        {
          code: 'BONUS_VACATION',
          name: 'Bono Vacacional',
          category: 'INCOME',
          isSystem: true,
        },
        {
          code: 'PROFIT_SHARING',
          name: 'Utilidades',
          category: 'INCOME',
          isSystem: true,
        },
        {
          code: 'SSO',
          name: 'Seguro Social Obligatorio',
          category: 'DEDUCTION',
          isSystem: true,
        },
        {
          code: 'PIE',
          name: 'Régimen Prestacional de Empleo',
          category: 'DEDUCTION',
          isSystem: true,
        },
        {
          code: 'FAOV',
          name: 'Fondo de Ahorro para la Vivienda',
          category: 'DEDUCTION',
          isSystem: true,
        },
        {
          code: 'ISLR',
          name: 'Impuesto Sobre la Renta (Retención)',
          category: 'DEDUCTION',
          isSystem: true,
        },
      ]);
      console.log(`Seeded default payroll concepts`);
    }
  }
}
