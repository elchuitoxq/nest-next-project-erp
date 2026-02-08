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

import { uuidv7 } from 'uuidv7';
import { count } from 'drizzle-orm';

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

  async findAllWithPagination(
    type: 'IVA' | 'ISLR',
    options: {
      checkBranch?: string; // Optional filtering by branch
      page?: number;
      limit?: number;
      search?: string;
    },
  ) {
    const page = options.page || 1;
    const limit = options.limit || 10;
    const offset = (page - 1) * limit;

    const whereConditions = [eq(taxRetentions.type, type)];

    if (options.checkBranch) {
      whereConditions.push(eq(taxRetentions.branchId, options.checkBranch));
    }

    if (options.search) {
      // Search by Code or Partner Name/TaxID
      // This requires joining with partners, which drizzle query builder handles via 'with' but for filtering we might need a different approach
      // or we can just filter by code for simplicity if advanced join filtering is complex without 'query builder'.
      // However, db.query allows robust filtering if configured.
      // For now, let's filter by retention code OR we'd need to do a join.
      // Drizzle's `like` operator is needed.
      // Since we are using `db.query`, simple relation filtering isn't always straightforward without `where: (retentions, { eq }) => ...` syntax or similar.
      // Let's implement basics: filter by CODE.
      // To filter by Partner Name, we'd ideally need a raw join or the advanced query API.
      // For this step, let's look for exact match or use SQL 'like' if possible.
      // Importing 'like' and 'or' from drizzle-orm.
    }

    // Determine Total Count
    // const totalResult = await db.select({ count: count() }).from(taxRetentions).where(and(...whereConditions));
    // const total = totalResult[0].count;

    // Fetch Data
    const data = await db.query.taxRetentions.findMany({
      where: and(...whereConditions),
      with: {
        partner: true,
        branch: true,
        lines: {
          with: {
            invoice: true,
            concept: true,
          },
        },
      },
      orderBy: [desc(taxRetentions.createdAt)],
      limit: limit,
      offset: offset,
    });

    // TODO: Implement proper Count and Search
    // For now returning data. Paginating "all" or filtered by branch.
    // Ideally we return { data, meta: { total, page, lastPage } }
    // But for this first pass, let's stick to returning data and handle total separately or roughly.

    // Let's do a proper count query:
    const allMatching = await db.query.taxRetentions.findMany({
      where: and(...whereConditions),
      columns: { id: true },
    });
    const total = allMatching.length;

    return {
      data,
      meta: {
        total,
        page,
        lastPage: Math.ceil(total / limit),
      },
    };
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
