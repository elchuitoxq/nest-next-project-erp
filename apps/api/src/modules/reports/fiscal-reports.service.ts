import { Injectable, Logger } from '@nestjs/common';
import {
  db,
  invoices,
  partners,
  taxRetentions,
  taxRetentionLines,
} from '@repo/db';
import { and, asc, eq, sql, gte, lt } from 'drizzle-orm';
import Decimal from 'decimal.js';

@Injectable()
export class FiscalReportsService {
  private readonly logger = new Logger(FiscalReportsService.name);

  async getLibroVentas(month: string, year: string, branchId?: string) {
    const startDate = new Date(Number(year), Number(month) - 1, 1);
    const endDate = new Date(Number(year), Number(month), 1);

    const whereClause = and(
      gte(invoices.date, startDate),
      lt(invoices.date, endDate),
      eq(invoices.type, 'SALE'),
      // Relaxed status: posted, paid, partially paid are all valid for fiscal books
      sql`${invoices.status} IN ('POSTED', 'PAID', 'PARTIALLY_PAID')`,
      branchId ? eq(invoices.branchId, branchId) : undefined,
    );

    const rows = await db.query.invoices.findMany({
      where: whereClause,
      with: {
        partner: true,
      },
      orderBy: [asc(invoices.code)], // Must be sequential
    });

    // Fetch Retentions for these invoices (when we are the ones being retained)
    const invoiceIds = rows.map((inv) => inv.id);
    const retentions =
      invoiceIds.length > 0
        ? await db.query.taxRetentionLines.findMany({
            where: sql`${taxRetentionLines.invoiceId} IN ${invoiceIds}`,
          })
        : [];

    const retentionMap = new Map();
    retentions.forEach((r) => {
      const current = retentionMap.get(r.invoiceId) || 0;
      retentionMap.set(r.invoiceId, Number(current) + Number(r.retainedAmount));
    });

    // Transform to Libro Format
    return rows.map((inv, index) => {
      return {
        nro_operacion: index + 1,
        fecha: inv.date,
        rif: inv.partner.taxId,
        nombre: inv.partner.name,
        numero_control: inv.code, // Should be Control Number, using Code for now
        numero_factura: inv.code,
        total_ventas_incluyendo_iva: inv.total,
        ventas_exentas: 0, // TODO: calculate from items
        base_imponible: inv.totalBase,
        aliquota: '16%',
        impuesto: inv.totalTax,
        iva_retenido: retentionMap.get(inv.id) || 0,
        igtf_percibido: inv.totalIgtf,
      };
    });
  }

  async getLibroCompras(month: string, year: string, branchId?: string) {
    const startDate = new Date(Number(year), Number(month) - 1, 1);
    const endDate = new Date(Number(year), Number(month), 1);

    const whereClause = and(
      gte(invoices.date, startDate),
      lt(invoices.date, endDate),
      eq(invoices.type, 'PURCHASE'),
      sql`${invoices.status} IN ('POSTED', 'PAID', 'PARTIALLY_PAID')`,
      branchId ? eq(invoices.branchId, branchId) : undefined,
    );

    const rows = await db.query.invoices.findMany({
      where: whereClause,
      with: {
        partner: true,
      },
      orderBy: [asc(invoices.date)],
    });

    // Fetch Retentions for these invoices
    const invoiceIds = rows.map((inv) => inv.id);
    const retentions =
      invoiceIds.length > 0
        ? await db.query.taxRetentionLines.findMany({
            where: sql`${taxRetentionLines.invoiceId} IN ${invoiceIds}`,
          })
        : [];

    const retentionMap = new Map();
    retentions.forEach((r) => {
      const current = retentionMap.get(r.invoiceId) || 0;
      retentionMap.set(r.invoiceId, Number(current) + Number(r.retainedAmount));
    });

    return rows.map((inv, index) => {
      return {
        nro_operacion: index + 1,
        fecha: inv.date,
        rif: inv.partner.taxId,
        nombre: inv.partner.name,
        numero_control: inv.code, // Control Number (External)
        numero_factura: inv.invoiceNumber, // Provider's Invoice Number
        total_compras_incluyendo_iva: inv.total,
        compras_exentas: 0,
        base_imponible: inv.totalBase,
        aliquota: '16%',
        impuesto: inv.totalTax,
        iva_retenido: retentionMap.get(inv.id) || 0,
      };
    });
  }
}
