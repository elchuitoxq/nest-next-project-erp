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

  private getDates(
    month: string,
    year: string,
    fortnight?: 'first' | 'second',
  ) {
    const m = Number(month).toString().padStart(2, '0');
    const y = year;
    const nextM =
      Number(month) === 12
        ? '01'
        : (Number(month) + 1).toString().padStart(2, '0');
    const nextY = Number(month) === 12 ? (Number(year) + 1).toString() : year;

    let startIso = `${y}-${m}-01`;
    let endIso = `${nextY}-${nextM}-01`;

    if (fortnight === 'first') {
      endIso = `${y}-${m}-16`;
    } else if (fortnight === 'second') {
      startIso = `${y}-${m}-16`;
    }

    return { startIso, endIso };
  }

  async getFiscalSummary(
    month: string,
    year: string,
    branchId?: string,
    fortnight?: 'first' | 'second',
  ) {
    // Reuse logic via getLibro calls (inefficient but guarantees consistency 100%)
    // Since these are filtered reports, volume shouldn't be massive for a single month/branch
    const sales = await this.getLibroVentas(month, year, branchId, fortnight);
    const purchases = await this.getLibroCompras(
      month,
      year,
      branchId,
      fortnight,
    );

    const debitos = new Decimal(sales.summary.total_debito_fiscal);
    const creditos = new Decimal(purchases.summary.total_credito_fiscal);
    const retencionesSoportadas = new Decimal(
      sales.summary.total_iva_retenido,
    );
    const retencionesEnterar = new Decimal(
      purchases.summary.total_iva_retenido_terceros,
    );
    const igtf = new Decimal(sales.summary.total_igtf);

    // Calculation: (Debit - Credit) - RetentionsHeldByClients
    let cuotaIVA = debitos.minus(creditos).minus(retencionesSoportadas);
    
    // Logic: If Credit > Debit, result is negative (Excedent), Payable is 0
    let aPagarIVA = cuotaIVA.isPos() ? cuotaIVA : new Decimal(0);
    let excedente = cuotaIVA.isNeg() ? cuotaIVA.abs() : new Decimal(0);

    return {
      debitos_fiscales: debitos.toNumber(),
      creditos_fiscales: creditos.toNumber(),
      retenciones_soportadas: retencionesSoportadas.toNumber(), // Credits
      
      // Results
      cuota_tributaria_iva: cuotaIVA.toNumber(), // Raw result
      iva_a_pagar: aPagarIVA.toNumber(),
      excedente_credito: excedente.toNumber(),

      // Other payables
      retenciones_iva_a_enterar: retencionesEnterar.toNumber(),
      igtf_a_pagar: igtf.toNumber(),
    };
  }

  async getLibroVentas(
    month: string,
    year: string,
    branchId?: string,
    fortnight?: 'first' | 'second',
  ) {
    const { startIso, endIso } = this.getDates(month, year, fortnight);

    // Use SQL raw comparison to ignore timezone shifts and compare literal calendar date
    const whereClause = and(
      sql`${invoices.date} >= ${startIso}::date`,
      sql`${invoices.date} < ${endIso}::date`,
      eq(invoices.type, 'SALE'),
      // Relaxed status: posted, paid, partially paid are all valid for fiscal books
      sql`${invoices.status} IN ('POSTED', 'PAID', 'PARTIALLY_PAID')`,
      branchId ? eq(invoices.branchId, branchId) : undefined,
    );

    const rows = await db.query.invoices.findMany({
      where: whereClause,
      with: {
        partner: true,
        currency: true,
      },
      orderBy: [asc(invoices.code)], // Must be sequential
    });

    // Fetch Retentions for these invoices (when we are the ones being retained)
    const invoiceIds = rows.map((inv) => inv.id);
    const retentions =
      invoiceIds.length > 0
        ? await db.query.taxRetentionLines.findMany({
            where: sql`${taxRetentionLines.invoiceId} IN ${invoiceIds}`,
            with: {
              retention: true,
            },
          })
        : [];

    const retentionMap = new Map();
    const retentionCodeMap = new Map();

    retentions.forEach((r) => {
      const current = retentionMap.get(r.invoiceId) || 0;
      retentionMap.set(r.invoiceId, Number(current) + Number(r.retainedAmount));
      
      if (r.retention?.code) {
        retentionCodeMap.set(r.invoiceId, r.retention.code);
      }
    });

    // Initialize Summary
    const summary = {
      total_ventas_gravadas: 0,
      total_ventas_exentas: 0,
      total_base_imponible: 0,
      total_debito_fiscal: 0, // IVA
      total_iva_retenido: 0,
      total_igtf: 0,
    };

    // Transform to Libro Format
    const items = rows.map((inv, index) => {
      const isForeignCurrency = inv.currency?.code !== 'VES';
      const rate = isForeignCurrency ? new Decimal(inv.exchangeRate) : new Decimal(1);

      const convert = (amount: string | number | null) => {
        return new Decimal(amount || 0).times(rate).toNumber();
      };

      const total = convert(inv.total);
      const base = convert(inv.totalBase);
      const tax = convert(inv.totalTax);
      const igtf = convert(inv.totalIgtf);
      // Retention is usually tracked in VES if generated properly, but apply conversion if needed logic implies it was stored in USD. 
      // Assuming retention lines stored in payment currency. If payment was USD, retention is USD.
      const retainedRaw = retentionMap.get(inv.id) || 0;
      const retained = convert(retainedRaw);

      // Accumulate Summary
      summary.total_ventas_gravadas += total; // This might need review if total includes exempt
      summary.total_base_imponible += base;
      summary.total_debito_fiscal += tax;
      summary.total_iva_retenido += retained;
      summary.total_igtf += igtf;

      return {
        nro_operacion: index + 1,
        fecha: inv.date,
        rif: inv.partner.taxId,
        nombre: inv.partner.name,
        numero_control: inv.code, // Should be Control Number, using Code for now
        numero_factura: inv.code,
        numero_comprobante: retentionCodeMap.get(inv.id) || '',
        total_ventas_incluyendo_iva: total,
        ventas_exentas: 0, // TODO: calculate from items
        base_imponible: base,
        aliquota: '16%',
        impuesto: tax,
        iva_retenido: retained,
        igtf_percibido: igtf,
      };
    });

    return { items, summary };
  }

  async getLibroCompras(
    month: string,
    year: string,
    branchId?: string,
    fortnight?: 'first' | 'second',
  ) {
    const { startIso, endIso } = this.getDates(month, year, fortnight);

    const whereClause = and(
      sql`${invoices.date} >= ${startIso}::date`,
      sql`${invoices.date} < ${endIso}::date`,
      eq(invoices.type, 'PURCHASE'),
      sql`${invoices.status} IN ('POSTED', 'PAID', 'PARTIALLY_PAID')`,
      branchId ? eq(invoices.branchId, branchId) : undefined,
    );

    const rows = await db.query.invoices.findMany({
      where: whereClause,
      with: {
        partner: true,
        currency: true,
      },
      orderBy: [asc(invoices.date)],
    });

    // Fetch Retentions for these invoices
    const invoiceIds = rows.map((inv) => inv.id);
    const retentions =
      invoiceIds.length > 0
        ? await db.query.taxRetentionLines.findMany({
            where: sql`${taxRetentionLines.invoiceId} IN ${invoiceIds}`,
            with: {
              retention: true,
            },
          })
        : [];

    const retentionMap = new Map();
    const retentionCodeMap = new Map();
    
    retentions.forEach((r) => {
      const current = retentionMap.get(r.invoiceId) || 0;
      retentionMap.set(r.invoiceId, Number(current) + Number(r.retainedAmount));

      if (r.retention?.code) {
         retentionCodeMap.set(r.invoiceId, r.retention.code);
      }
    });

    const summary = {
      total_compras_gravadas: 0,
      total_compras_exentas: 0,
      total_base_imponible: 0,
      total_credito_fiscal: 0, // IVA
      total_iva_retenido_terceros: 0,
    };

    const items = rows.map((inv, index) => {
      const isForeignCurrency = inv.currency?.code !== 'VES';
      const rate = isForeignCurrency ? new Decimal(inv.exchangeRate) : new Decimal(1);

      const convert = (amount: string | number | null) => {
        return new Decimal(amount || 0).times(rate).toNumber();
      };

      const total = convert(inv.total);
      const base = convert(inv.totalBase);
      const tax = convert(inv.totalTax);
      const retainedRaw = retentionMap.get(inv.id) || 0;
      const retained = convert(retainedRaw);

      summary.total_compras_gravadas += total;
      summary.total_base_imponible += base;
      summary.total_credito_fiscal += tax;
      summary.total_iva_retenido_terceros += retained;

      return {
        nro_operacion: index + 1,
        fecha: inv.date,
        rif: inv.partner.taxId,
        nombre: inv.partner.name,
        numero_control: inv.code, // Control Number (External)
        numero_factura: inv.invoiceNumber, // Provider's Invoice Number
        numero_comprobante: retentionCodeMap.get(inv.id) || '',
        total_compras_incluyendo_iva: total,
        compras_exentas: 0,
        base_imponible: base,
        aliquota: '16%',
        impuesto: tax,
        iva_retenido: retained,
      };
    });

    return { items, summary };
  }
}
