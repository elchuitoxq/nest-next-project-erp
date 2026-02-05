import { Injectable, Logger } from '@nestjs/common';
import {
  db,
  taxRetentions,
  taxRetentionLines,
  partners,
  branches,
  invoices,
} from '@repo/db';
import { eq, sql, and, desc, gte, lt, inArray } from 'drizzle-orm';
import Decimal from 'decimal.js';
import PDFDocument from 'pdfkit';
import { uuidv7 } from 'uuidv7';

@Injectable()
export class RetentionsService {
  private readonly logger = new Logger(RetentionsService.name);

  async calculateIVARetention(
    taxAmount: number | string,
    retentionRate: number | string,
  ) {
    const tax = new Decimal(taxAmount);
    const rate = new Decimal(retentionRate).div(100);
    return tax.times(rate).toFixed(2);
  }

  // XML Generation for SENIAT (Standard Format)
  generateXML(retention: any, lines: any[]) {
    // Simplified XML structure based on common SENIAT requirements
    // Real strict implementation needs official XSD
    let xml = `<?xml version="1.0" encoding="UTF-8"?>`;
    xml += `<Retencion>`;
    xml += `<Encabezado>`;
    xml += `<RifAgente>${retention.branch?.taxId || 'N/A'}</RifAgente>`;
    xml += `<Periodo>${retention.period}</Periodo>`;
    xml += `<RifRetenido>${retention.partner?.taxId}</RifRetenido>`;
    xml += `</Encabezado>`;
    xml += `<Detalles>`;

    lines.forEach((line) => {
      xml += `<Detalle>`;
      xml += `<Factura>${line.invoice?.invoiceNumber || line.invoice?.code}</Factura>`;
      xml += `<MontoBase>${line.baseAmount}</MontoBase>`;
      xml += `<MontoImpuesto>${line.taxAmount}</MontoImpuesto>`;
      xml += `<MontoRetenido>${line.retainedAmount}</MontoRetenido>`;
      xml += `</Detalle>`;
    });

    xml += `</Detalles>`;
    xml += `</Retencion>`;
    return xml;
  }

  /**
   * Generates TXT for SENIAT VAT Retentions (Consolidated)
   * Format: RIF;Periodo;Fecha;Operacion;TipoDoc;RIFRetenido;Factura;Control;Total;Base;Retenido;DocAfectado;Comprobante;Exento;Alicuota
   */
  generateConsolidatedTxt(retentions: any[]) {
    let txt = '';
    for (const r of retentions) {
      const branchTaxId = (r.branch?.taxId || '').replace(/-/g, '');
      const period = r.period; // YYYYMM

      for (const line of r.lines) {
        // Legal Date Format: DD/MM/YYYY
        let dateStr = '';
        if (r.date) {
          const d = new Date(r.date);
          const day = String(d.getDate()).padStart(2, '0');
          const month = String(d.getMonth() + 1).padStart(2, '0');
          const year = d.getFullYear();
          dateStr = `${day}/${month}/${year}`;
        }

        const partnerTaxId = (r.partner?.taxId || '').replace(/-/g, '');

        // In this ERP, invoice.code is the Control Number, invoice.invoiceNumber is the Document Number
        const invoiceNumber =
          line.invoice?.invoiceNumber || line.invoice?.code || '0';
        const controlNumber = line.invoice?.code || '0';

        const total = new Decimal(line.baseAmount)
          .plus(line.taxAmount)
          .toFixed(2);
        const base = line.baseAmount;
        const retained = line.retainedAmount;

        // TODO: Detect Credit Notes to set TipoDoc=03 and affected doc
        const typeDoc = '01';
        const affected = '0';

        const voucher = r.code;
        const exempt = '0.00'; // Defaulting to 0 as we don't have explicit line-level exempt yet
        const alicuota = '16.00';

        // SENIAT Format: RIF;Periodo;Fecha;Operacion;TipoDoc;RIFRetenido;Factura;Control;Total;Base;Retenido;DocAfectado;Comprobante;Exento;Alicuota
        txt += `${branchTaxId};${period};${dateStr};01;${typeDoc};${partnerTaxId};${invoiceNumber};${controlNumber};${total};${base};${retained};${affected};${voucher};${exempt};${alicuota}\r\n`;
      }
    }
    return txt;
  }

  async createRetention(
    data: {
      partnerId: string;
      branchId: string;
      type: 'IVA' | 'ISLR';
      period: string; // YYYYMM
      userId: string;
      items: {
        invoiceId: string;
        baseAmount: string;
        taxAmount: string;
        retainedAmount: string;
        paymentId?: string;
      }[];
    },
    tx?: any, // Optional transaction object
  ) {
    const operation = async (transaction: any) => {
      // 1. Calculate Totals
      const totalBase = data.items.reduce(
        (sum, item) => sum.plus(new Decimal(item.baseAmount)),
        new Decimal(0),
      );
      const totalTax = data.items.reduce(
        (sum, item) => sum.plus(new Decimal(item.taxAmount)),
        new Decimal(0),
      );
      const totalRetained = data.items.reduce(
        (sum, item) => sum.plus(new Decimal(item.retainedAmount)),
        new Decimal(0),
      );

      // 2. Generate Code (Sequential per Period/Branch?)
      // For now, simple logic
      const yyyy = data.period.substring(0, 4);
      const mm = data.period.substring(4, 6);
      const code = `${yyyy}${mm}-${Date.now().toString().slice(-4)}`;

      // Use explicit any cast if linter complains about schema not updated
      const [retention] = await transaction
        .insert(taxRetentions as any)
        .values({
          code: code,
          partnerId: data.partnerId,
          branchId: data.branchId,
          period: data.period,
          type: data.type,
          totalBase: totalBase.toFixed(2),
          totalTax: totalTax.toFixed(2),
          totalRetained: totalRetained.toFixed(2),
          userId: data.userId,
        })
        .returning();

      // 3. Insert Lines
      for (const item of data.items) {
        await transaction.insert(taxRetentionLines as any).values({
          retentionId: retention.id,
          invoiceId: item.invoiceId,
          baseAmount: item.baseAmount,
          taxAmount: item.taxAmount,
          retainedAmount: item.retainedAmount,
          paymentId: item.paymentId,
        });
      }

      return retention;
    };

    // Use provided transaction OR start a new one
    if (tx) {
      return await operation(tx);
    } else {
      return await db.transaction(async (newTx) => {
        return await operation(newTx);
      });
    }
  }

  async generatePDF(retentionId: string): Promise<PDFKit.PDFDocument> {
    const retention = await (db.query as any).taxRetentions.findFirst({
      where: eq(taxRetentions.id, retentionId),
      with: {
        partner: true,
        branch: true,
        lines: {
          with: {
            invoice: true,
          },
        },
      },
    });

    if (!retention) throw new Error('Retención no encontrada');

    const doc = new PDFDocument();

    doc.text(`COMPROBANTE DE RETENCIÓN ${retention.type}`, { align: 'center' });
    doc.text(`NRO: ${retention.code}`);
    doc.text(`FECHA: ${new Date().toLocaleDateString()}`);
    doc.text(`AGENTE: ${retention.branch?.name || 'N/A'}`);
    doc.text(
      `SUJETO: ${retention.partner?.name || 'N/A'} - ${retention.partner?.taxId || 'N/A'}`,
    );

    doc.moveDown();
    doc.text('DETALLES:');
    retention.lines.forEach((line: any) => {
      doc.text(
        `FAC: ${line.invoice?.code} | BASE: ${line.baseAmount} | IMP: ${line.taxAmount} | RET: ${line.retainedAmount}`,
      );
    });

    doc.end();
    return doc;
  }

  async findAll(type: 'IVA' | 'ISLR', branchId?: string) {
    const whereConditions = [eq(taxRetentions.type, type)];
    if (branchId) {
      whereConditions.push(eq(taxRetentions.branchId, branchId));
    }

    return await db.query.taxRetentions.findMany({
      where: and(...whereConditions),
      with: {
        partner: true,
        branch: true,
      },
      orderBy: [desc(taxRetentions.createdAt)],
    });
  }

  async findByDateRange(
    startDate: Date,
    endDate: Date,
    type: 'IVA' | 'ISLR',
    branchId?: string,
    direction?: 'SALE' | 'PURCHASE',
  ) {
    const whereConditions = [
      eq(taxRetentions.type, type),
      gte(taxRetentions.date, startDate),
      lt(taxRetentions.date, endDate),
    ];

    if (branchId) {
      whereConditions.push(eq(taxRetentions.branchId, branchId));
    }

    if (direction) {
      // Find retention IDs that belong to invoices of the specified direction
      const subquery = db
        .select({ id: taxRetentionLines.retentionId })
        .from(taxRetentionLines)
        .innerJoin(invoices, eq(taxRetentionLines.invoiceId, invoices.id))
        .where(eq(invoices.type, direction));

      whereConditions.push(inArray(taxRetentions.id, subquery));
    }

    return await db.query.taxRetentions.findMany({
      where: and(...whereConditions),
      with: {
        partner: true,
        branch: true,
        lines: {
          with: { invoice: true },
        },
      },
      orderBy: [desc(taxRetentions.createdAt)],
    });
  }

  async findOne(id: string) {
    return await db.query.taxRetentions.findFirst({
      where: eq(taxRetentions.id, id),
      with: {
        partner: true,
        branch: true,
        lines: {
          with: {
            invoice: true,
          },
        },
      },
    });
  }
}
