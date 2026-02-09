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
    const retencionesSoportadas = new Decimal(sales.summary.total_iva_retenido);
    const retencionesEnterar = new Decimal(
      purchases.summary.total_iva_retenido_terceros,
    );
    const igtf = new Decimal(sales.summary.total_igtf);

    // Calculation: (Debit - Credit) - RetentionsHeldByClients
    const cuotaIVA = debitos.minus(creditos).minus(retencionesSoportadas);

    // Logic: If Credit > Debit, result is negative (Excedent), Payable is 0
    const aPagarIVA = cuotaIVA.isPos() ? cuotaIVA : new Decimal(0);
    const excedente = cuotaIVA.isNeg() ? cuotaIVA.abs() : new Decimal(0);

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
    const startDate = new Date(startIso);
    const endDate = new Date(endIso);

    // 1. Fetch Invoices issued in the period
    const invoiceRows = await db.query.invoices.findMany({
      where: and(
        sql`${invoices.date} >= ${startIso}::date`,
        sql`${invoices.date} < ${endIso}::date`,
        eq(invoices.type, 'SALE'),
        sql`${invoices.status} IN ('POSTED', 'PAID', 'PARTIALLY_PAID')`,
        branchId ? eq(invoices.branchId, branchId) : undefined,
      ),
      with: { partner: true, currency: true },
    });

    // 2. Fetch Credit Notes issued in the period
    // Join with partners to ensure they are sales CNs (Customer)
    const creditNoteRows = await db.query.creditNotes.findMany({
      where: and(
        sql`${invoices.date} >= ${startIso}::date`,
        sql`${invoices.date} < ${endIso}::date`,
        branchId ? eq(invoices.branchId, branchId) : undefined,
      ),
      with: { partner: true, currency: true },
    });
    // Note: Since NC doesn't have a 'type', we'll rely on the partner role or linked invoice in the mapping below.

    // 3. Fetch Retentions generated in the period (CRITERIO DE CAJA)
    const retentionsInPeriod = await db.query.taxRetentions.findMany({
      where: and(
        eq(taxRetentions.type, 'IVA'),
        gte(taxRetentions.date, startDate),
        lt(taxRetentions.date, endDate),
        branchId ? eq(taxRetentions.branchId, branchId) : undefined,
      ),
      with: {
        partner: true,
        lines: {
          with: { invoice: { with: { partner: true, currency: true } } },
        },
      },
    });

    const summary = {
      total_ventas_gravadas: new Decimal(0),
      total_ventas_exentas: new Decimal(0),
      total_base_imponible: new Decimal(0),
      total_debito_fiscal: new Decimal(0),
      total_iva_retenido: new Decimal(0),
      total_igtf: new Decimal(0),
    };

    const finalItems: any[] = [];
    const processedDocIds = new Set<string>();

    // Mapping Helper
    const mapDocument = (
      doc: any,
      type: 'INV' | 'NC',
      isRetentionOnly = false,
    ) => {
      const isForeignCurrency = doc.currency?.code !== 'VES';
      const rate = isForeignCurrency
        ? new Decimal(doc.exchangeRate || 1)
        : new Decimal(1);
      const sign = type === 'NC' ? -1 : 1;

      const convert = (val: any) =>
        new Decimal(val || 0).times(rate).times(sign);

      const base = isRetentionOnly ? new Decimal(0) : convert(doc.totalBase);
      const tax = isRetentionOnly ? new Decimal(0) : convert(doc.totalTax);
      const igtf = isRetentionOnly ? new Decimal(0) : convert(doc.totalIgtf);
      const total = isRetentionOnly ? new Decimal(0) : convert(doc.total);

      // Find retentions for this doc that occurred THIS month
      let retainedThisMonth = new Decimal(0);
      let voucherCode = '';

      retentionsInPeriod.forEach((r) => {
        const line = r.lines.find((l) => l.invoiceId === doc.id);
        if (line) {
          retainedThisMonth = retainedThisMonth.plus(
            new Decimal(line.retainedAmount).times(rate),
          );
          voucherCode = r.code;
        }
      });

      // Update Summary
      summary.total_base_imponible = summary.total_base_imponible.plus(base);
      summary.total_debito_fiscal = summary.total_debito_fiscal.plus(tax);
      summary.total_igtf = summary.total_igtf.plus(igtf);
      summary.total_ventas_gravadas = summary.total_ventas_gravadas.plus(total);
      summary.total_iva_retenido =
        summary.total_iva_retenido.plus(retainedThisMonth);

      return {
        id: doc.id,
        fecha: doc.date,
        rif: doc.partner?.taxId || 'N/A',
        nombre: doc.partner?.name || 'N/A',
        numero_control: doc.code,
        numero_factura:
          type === 'INV' ? doc.invoiceNumber || doc.code : doc.code,
        tipo_documento: type,
        isRetentionOnly,
        isCriterioCaja: isRetentionOnly,
        explainer: isRetentionOnly
          ? 'Factura de mes anterior incluida porque su retención fue certificada en este periodo (Criterio de Caja).'
          : type === 'NC'
            ? 'Nota de Crédito que disminuye el débito fiscal del periodo.'
            : 'Documento emitido y reportado en el periodo actual.',
        numero_comprobante: voucherCode,
        total_ventas_incluyendo_iva: total.toNumber(),
        ventas_exentas: 0,
        base_imponible: base.toNumber(),
        aliquota: '16%',
        impuesto: tax.toNumber(),
        iva_retenido: retainedThisMonth.toNumber(),
        igtf_percibido: igtf.toNumber(),
      };
    };

    // Process Invoices of the period
    invoiceRows.forEach((inv) => {
      finalItems.push(mapDocument(inv, 'INV'));
      processedDocIds.add(inv.id);
    });

    // Process Credit Notes of the period (only if they are Sales related)
    creditNoteRows.forEach((nc) => {
      // Heuristic: If partner is CUSTOMER or BOTH, assume it's a sales NC
      if (nc.partner?.type === 'CUSTOMER' || nc.partner?.type === 'BOTH') {
        finalItems.push(mapDocument(nc, 'NC'));
        processedDocIds.add(nc.id);
      }
    });

    // Process "Orphan" Retentions (documents from other periods paid/certified now)
    retentionsInPeriod.forEach((r) => {
      r.lines.forEach((line) => {
        if (line.invoice && !processedDocIds.has(line.invoice.id)) {
          // If invoice is a SALE, include it as retention-only
          if (line.invoice.type === 'SALE') {
            finalItems.push(mapDocument(line.invoice, 'INV', true));
            processedDocIds.add(line.invoice.id);
          }
        }
      });
    });

    return {
      items: finalItems.sort(
        (a, b) => new Date(a.fecha).getTime() - new Date(b.fecha).getTime(),
      ),
      summary: {
        total_ventas_gravadas: summary.total_ventas_gravadas.toNumber(),
        total_ventas_exentas: summary.total_ventas_exentas.toNumber(),
        total_base_imponible: summary.total_base_imponible.toNumber(),
        total_debito_fiscal: summary.total_debito_fiscal.toNumber(),
        total_iva_retenido: summary.total_iva_retenido.toNumber(),
        total_igtf: summary.total_igtf.toNumber(),
      },
    };
  }

  async getLibroCompras(
    month: string,
    year: string,
    branchId?: string,
    fortnight?: 'first' | 'second',
  ) {
    const { startIso, endIso } = this.getDates(month, year, fortnight);
    const startDate = new Date(startIso);
    const endDate = new Date(endIso);

    // 1. Fetch Invoices issued in the period
    const invoiceRows = await db.query.invoices.findMany({
      where: and(
        sql`${invoices.date} >= ${startIso}::date`,
        sql`${invoices.date} < ${endIso}::date`,
        eq(invoices.type, 'PURCHASE'),
        sql`${invoices.status} IN ('POSTED', 'PAID', 'PARTIALLY_PAID')`,
        branchId ? eq(invoices.branchId, branchId) : undefined,
      ),
      with: { partner: true, currency: true },
    });

    // 2. Fetch Credit Notes issued in the period
    const creditNoteRows = await db.query.creditNotes.findMany({
      where: and(
        sql`${invoices.date} >= ${startIso}::date`,
        sql`${invoices.date} < ${endIso}::date`,
        branchId ? eq(invoices.branchId, branchId) : undefined,
      ),
      with: { partner: true, currency: true },
    });

    // 3. Fetch Retentions generated in the period (CRITERIO DE CAJA)
    const retentionsInPeriod = await db.query.taxRetentions.findMany({
      where: and(
        eq(taxRetentions.type, 'IVA'),
        gte(taxRetentions.date, startDate),
        lt(taxRetentions.date, endDate),
        branchId ? eq(taxRetentions.branchId, branchId) : undefined,
      ),
      with: {
        partner: true,
        lines: {
          with: { invoice: { with: { partner: true, currency: true } } },
        },
      },
    });

    const summary = {
      total_compras_gravadas: new Decimal(0),
      total_compras_exentas: new Decimal(0),
      total_base_imponible: new Decimal(0),
      total_credito_fiscal: new Decimal(0),
      total_iva_retenido_terceros: new Decimal(0),
    };

    const finalItems: any[] = [];
    const processedDocIds = new Set<string>();

    // Mapping Helper
    const mapDocument = (
      doc: any,
      type: 'INV' | 'NC',
      isRetentionOnly = false,
    ) => {
      const isForeignCurrency = doc.currency?.code !== 'VES';
      const rate = isForeignCurrency
        ? new Decimal(doc.exchangeRate || 1)
        : new Decimal(1);
      const sign = type === 'NC' ? -1 : 1;

      const convert = (val: any) =>
        new Decimal(val || 0).times(rate).times(sign);

      const base = isRetentionOnly ? new Decimal(0) : convert(doc.totalBase);
      const tax = isRetentionOnly ? new Decimal(0) : convert(doc.totalTax);
      const total = isRetentionOnly ? new Decimal(0) : convert(doc.total);

      // Find retentions for this doc that occurred THIS month
      let retainedThisMonth = new Decimal(0);
      let voucherCode = '';

      retentionsInPeriod.forEach((r) => {
        const line = r.lines.find((l) => l.invoiceId === doc.id);
        if (line) {
          retainedThisMonth = retainedThisMonth.plus(
            new Decimal(line.retainedAmount).times(rate),
          );
          voucherCode = r.code;
        }
      });

      // Update Summary
      summary.total_base_imponible = summary.total_base_imponible.plus(base);
      summary.total_credito_fiscal = summary.total_credito_fiscal.plus(tax);
      summary.total_compras_gravadas =
        summary.total_compras_gravadas.plus(total);
      summary.total_iva_retenido_terceros =
        summary.total_iva_retenido_terceros.plus(retainedThisMonth);

      return {
        fecha: doc.date,
        rif: doc.partner?.taxId || 'N/A',
        nombre: doc.partner?.name || 'N/A',
        numero_control: doc.code,
        numero_factura:
          type === 'INV' ? doc.invoiceNumber || doc.code : doc.code,
        tipo_documento: type,
        isRetentionOnly,
        isCriterioCaja: isRetentionOnly,
        explainer: isRetentionOnly
          ? 'Factura de mes anterior incluida porque la retención al proveedor se realizó en este periodo.'
          : type === 'NC'
            ? 'Nota de Crédito de proveedor que disminuye el crédito fiscal.'
            : 'Compra realizada y reportada en el periodo actual.',
        numero_comprobante: voucherCode,
        total_compras_incluyendo_iva: total.toNumber(),
        compras_exentas: 0,
        base_imponible: base.toNumber(),
        aliquota: '16%',
        impuesto: tax.toNumber(),
        iva_retenido: retainedThisMonth.toNumber(),
      };
    };

    // Process Invoices
    invoiceRows.forEach((inv) => {
      finalItems.push(mapDocument(inv, 'INV'));
      processedDocIds.add(inv.id);
    });

    // Process Credit Notes (Supplier related)
    creditNoteRows.forEach((nc) => {
      if (nc.partner?.type === 'SUPPLIER' || nc.partner?.type === 'BOTH') {
        finalItems.push(mapDocument(nc, 'NC'));
        processedDocIds.add(nc.id);
      }
    });

    // Process Orphan Retentions
    retentionsInPeriod.forEach((r) => {
      r.lines.forEach((line) => {
        if (line.invoice && !processedDocIds.has(line.invoice.id)) {
          if (line.invoice.type === 'PURCHASE') {
            finalItems.push(mapDocument(line.invoice, 'INV', true));
            processedDocIds.add(line.invoice.id);
          }
        }
      });
    });

    return {
      items: finalItems.sort(
        (a, b) => new Date(a.fecha).getTime() - new Date(b.fecha).getTime(),
      ),
      summary: {
        total_compras_gravadas: summary.total_compras_gravadas.toNumber(),
        total_compras_exentas: summary.total_compras_exentas.toNumber(),
        total_base_imponible: summary.total_base_imponible.toNumber(),
        total_credito_fiscal: summary.total_credito_fiscal.toNumber(),
        total_iva_retenido_terceros:
          summary.total_iva_retenido_terceros.toNumber(),
      },
    };
  }
}
