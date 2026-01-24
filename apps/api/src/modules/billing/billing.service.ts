import {
  Injectable,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import {
  db,
  invoices,
  invoiceItems,
  products,
  currencies,
  partners,
  branches,
  payments,
  paymentMethods,
  creditNotes,
  users,
} from '@repo/db';
import { eq, sql, desc, inArray, and, gte, lt, like, ne } from 'drizzle-orm';
import Decimal from 'decimal.js';
import { InventoryService } from '../inventory/inventory.service';
import { CurrenciesService } from '../finance/currencies/currencies.service';
import { CreateInvoiceDto, InvoiceType } from './dto/create-invoice.dto';

@Injectable()
export class BillingService {
  constructor(
    private readonly inventoryService: InventoryService,
    private readonly currenciesService: CurrenciesService,
  ) {}

  async voidInvoice(
    id: string,
    userId: string,
    options: { returnStock: boolean; warehouseId?: string },
  ) {
    return await db.transaction(async (tx) => {
      const invoice = await db.query.invoices.findFirst({
        where: eq(invoices.id, id),
      });

      if (!invoice) throw new BadRequestException('Factura no encontrada');
      if (invoice.status === 'VOID')
        throw new BadRequestException('La factura ya está anulada');

      // 1. Return/Reverse Stock if requested
      if (options.returnStock) {
        // If Purchase, we need to REVERSE the entry (OUT)
        // If Sale, we need to RETURN the items (IN)

        const targetWarehouseId = options.warehouseId || invoice.warehouseId; // Fallback to invoice warehouse if available

        if (!targetWarehouseId) {
          throw new BadRequestException(
            'Se requiere almacén para revertir el inventario',
          );
        }

        // Fetch items manually to avoid Drizzle 'referencedTable' error on relations
        const items = await db.query.invoiceItems.findMany({
          where: eq(invoiceItems.invoiceId, invoice.id),
        });

        const moveLines = items.map((item) => ({
          productId: item.productId,
          quantity: parseFloat(item.quantity),
          cost: parseFloat(item.price), // Using price as cost for return value approximation
        }));

        if (invoice.type === InvoiceType.PURCHASE) {
          // Reverse Purchase -> OUT
          await this.inventoryService.createMove({
            type: 'OUT',
            lines: moveLines,
            fromWarehouseId: targetWarehouseId,
            branchId: invoice.branchId,
            note: `Anulación Compra #${invoice.invoiceNumber || invoice.code}`,
            userId,
          });
        } else {
          // Reverse Sale -> IN (Return)
          await this.inventoryService.createMove({
            type: 'IN',
            lines: moveLines,
            toWarehouseId: targetWarehouseId,
            branchId: invoice.branchId,
            note: `Anulación Factura #${invoice.code}`,
            userId,
          });
        }
      }

      // 2. Void Invoice
      const [updatedInvoice] = await tx
        .update(invoices)
        .set({ status: 'VOID' })
        .where(eq(invoices.id, id))
        .returning();

      return updatedInvoice;
    });
  }

  async createInvoice(
    data: CreateInvoiceDto & { branchId: string; userId: string },
  ) {
    if (!data.branchId) {
      throw new BadRequestException('Se requiere el contexto de la sucursal');
    }
    return await db.transaction(async (tx) => {
      const [currency] = await tx
        .select()
        .from(currencies)
        .where(eq(currencies.id, data.currencyId));
      if (!currency) throw new BadRequestException('Moneda inválida');

      // Fetch latest exchange rate (or use provided)
      const exchangeRate =
        data.exchangeRate?.toString() ||
        (await this.currenciesService.getLatestRate(data.currencyId)) ||
        '1.0000000000';

      let totalBase = new Decimal(0);
      let totalTax = new Decimal(0);
      let totalIgtf = new Decimal(0);

      const type = data.type || InvoiceType.SALE;

      // Validation for Purchase
      // Only require invoiceNumber (Control Logic) if NOT Draft.
      // When generating from Order, it is Draft initially, so we don't have it yet.
      const status = data.status || 'DRAFT';
      if (
        type === InvoiceType.PURCHASE &&
        status !== 'DRAFT' &&
        !data.invoiceNumber
      ) {
        throw new BadRequestException(
          'El número de factura (Control) es requerido para compras',
        );
      }

      const linesToInsert = [];

      for (const item of data.items) {
        const [product] = await tx
          .select()
          .from(products)
          .where(eq(products.id, item.productId));
        if (!product)
          throw new BadRequestException(
            `Producto ${item.productId} no encontrado`,
          );

        const qty = new Decimal(item.quantity);
        const price = item.price
          ? new Decimal(item.price)
          : new Decimal(product.price || 0);
        const subtotal = qty.times(price);

        const taxRate = product.isExempt
          ? new Decimal(0)
          : new Decimal(product.taxRate || 16).div(100);
        const taxAmount = subtotal.times(taxRate);

        totalBase = totalBase.plus(subtotal);
        totalTax = totalTax.plus(taxAmount);

        linesToInsert.push({
          productId: item.productId,
          quantity: qty.toFixed(4),
          price: price.toFixed(2),
          cost: product.cost || '0', // For sales, this is historial cost. For purchases, this is technically redundant or same as price.
          taxRate: taxRate.times(100).toFixed(2),
          total: subtotal.plus(taxAmount).toFixed(2),
        });
      }

      // if (!currency.isBase) {
      //   totalIgtf = totalBase.times(0.03);
      // }

      const total = totalBase.plus(totalTax).plus(totalIgtf);

      // Generate Code Strategy
      // 1. If Purchase, user might provide external invoiceNumber (Control Number)
      // 2. If Sale, we generate internal sequential code.
      // 3. POLICY: If Draft, generate temporary code. If Posted, generate sequence.

      let nextCode = `DRAFT-${Date.now()}`; // Default temporary

      if (status === 'POSTED') {
        // Generate Sequential ONLY if creating directly as POSTED (which shouldn't happen often)
        const lastInvoice = await tx.query.invoices.findFirst({
          where: and(eq(invoices.type, type), ne(invoices.status, 'DRAFT')),
          orderBy: desc(invoices.code),
        });

        let prefix = type === InvoiceType.SALE ? 'A' : 'C'; // A = Sale, C = Compra (Internal)
        let nextNum = 1;

        if (lastInvoice && lastInvoice.code) {
          // Try to parse A-00001
          const match = lastInvoice.code.match(/([A-Z]+)-(\d+)/);
          if (match) {
            // If prefix matches, increment.
            // But careful, if we had DRAFTS before, lastInvoice query filters them out.
            nextNum = parseInt(match[2]) + 1;
          }
        }
        nextCode = `${prefix}-${nextNum.toString().padStart(5, '0')}`;
      }

      // For Purchases, we store the Vendor's Invoice Number in `invoiceNumber`
      // But our internal `code` is still needed for uniqueness.
      // User wanted "No correlativo fiscal" until posted.
      // If Purchase, we use Internal Draft until posted.

      const [invoice] = await tx
        .insert(invoices)
        .values({
          code: nextCode,
          partnerId: data.partnerId,
          branchId: data.branchId,
          currencyId: data.currencyId,
          exchangeRate,
          totalBase: totalBase.toFixed(2),
          totalTax: totalTax.toFixed(2),
          totalIgtf: totalIgtf.toFixed(2),
          total: total.toFixed(2),
          status: 'DRAFT',
          // New Fields
          type: type,
          invoiceNumber: data.invoiceNumber, // External for Purchase, Optional for Sale
          userId: data.userId,
          orderId: data.orderId,
          warehouseId: data.warehouseId, // Persist warehouse for future posting logic
        })
        .returning();

      for (const line of linesToInsert) {
        await tx.insert(invoiceItems).values({
          invoiceId: invoice.id,
          ...line,
        });
      }

      // Inventory is NOT handled here anymore for Purchases.
      // It is handled in postInvoice (when confirmed).

      return invoice;
    });
  }

  async postInvoice(id: string, userId: string) {
    return await db.transaction(async (tx) => {
      const invoice = await tx.query.invoices.findFirst({
        where: eq(invoices.id, id),
        with: {
          items: true,
        },
      });

      if (!invoice) throw new NotFoundException('Factura no encontrada');
      if (invoice.status !== 'DRAFT')
        throw new BadRequestException(
          'Solo se pueden emitir facturas en borrador',
        );

      // 1. Generate Sequential Code (Now that we are Posting)

      // Validation for Purchase Posting
      if (invoice.type === InvoiceType.PURCHASE && !invoice.invoiceNumber) {
        throw new BadRequestException(
          'Debe asignar el número de control (Factura Proveedor) antes de emitir la compra.',
        );
      }

      const lastInvoice = await tx.query.invoices.findFirst({
        where: and(
          eq(invoices.type, invoice.type || InvoiceType.SALE),
          ne(invoices.status, 'DRAFT'),
        ),
        orderBy: desc(invoices.code),
      });

      let nextCode = invoice.type === InvoiceType.SALE ? 'A-00001' : 'C-00001';
      const prefix = invoice.type === InvoiceType.SALE ? 'A' : 'C';

      if (lastInvoice && lastInvoice.code) {
        const match = lastInvoice.code.match(/([A-Z]+)-(\d+)/);
        if (match) {
          const num = parseInt(match[2]) + 1;
          nextCode = `${prefix}-${num.toString().padStart(5, '0')}`;
        }
      }

      // 2. Inventory Logic (Conditional)
      // Check if this invoice comes from an Order.
      // If YES -> Stock was already moved (IN/OUT) during Order Confirmation. Do NOT move again.
      // If NO -> This is a Direct Invoice. Move Stock now.
      if (!invoice.orderId) {
        if (!invoice.warehouseId) {
          throw new BadRequestException(
            'Se requiere almacén para facturas directas',
          );
        }

        const moveLines = invoice.items.map((item) => ({
          productId: item.productId,
          quantity: parseFloat(item.quantity),
          cost: parseFloat(item.price),
        }));

        if (invoice.type === InvoiceType.PURCHASE) {
          // Direct Purchase -> IN
          await this.inventoryService.createMove({
            type: 'IN',
            lines: moveLines,
            toWarehouseId: invoice.warehouseId,
            branchId: invoice.branchId,
            note: `Compra Directa #${nextCode}`,
            userId,
          });
        } else {
          // Direct Sale -> OUT
          await this.inventoryService.createMove({
            type: 'OUT',
            lines: moveLines,
            fromWarehouseId: invoice.warehouseId,
            branchId: invoice.branchId,
            note: `Venta Directa #${nextCode}`,
            userId,
          });
        }
      }

      // 3. Update Invoice
      const [updatedInvoice] = await tx
        .update(invoices)
        .set({
          status: 'POSTED',
          code: nextCode,
        })
        .where(eq(invoices.id, id))
        .returning();

      return updatedInvoice;
    });
  }

  async updateInvoice(id: string, updates: any, userId: string) {
    const invoice = await db.query.invoices.findFirst({
      where: eq(invoices.id, id),
    });

    if (!invoice) throw new NotFoundException('Factura no encontrada');
    if (invoice.status !== 'DRAFT') {
      throw new BadRequestException(
        'Solo se pueden editar facturas en estado Borrador (DRAFT)',
      );
    }

    const [updated] = await db
      .update(invoices)
      .set({
        invoiceNumber: updates.invoiceNumber ?? invoice.invoiceNumber,
        date: updates.date ?? invoice.date,
      })
      .where(eq(invoices.id, id))
      .returning();

    return updated;
  }

  async findAll(branchId?: string, type?: string) {
    // 1. Fetch raw invoices (no relations)
    const conditions = [];
    if (branchId) conditions.push(eq(invoices.branchId, branchId));
    if (type) conditions.push(eq(invoices.type, type));

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

    const invoicesList = await db.query.invoices.findMany({
      where: whereClause,
      orderBy: desc(invoices.date),
    });

    if (invoicesList.length === 0) return [];

    // Collect IDs
    const invoiceIds = invoicesList.map((inv) => inv.id);
    const partnerIds = [...new Set(invoicesList.map((inv) => inv.partnerId))];
    const branchIds = [...new Set(invoicesList.map((inv) => inv.branchId))];
    const currencyIds = [...new Set(invoicesList.map((inv) => inv.currencyId))];

    // 2. Fetch level 1 relations, items, and payments
    const [
      fetchedPartners,
      fetchedBranches,
      fetchedCurrencies,
      fetchedItems,
      fetchedPayments,
      fetchedCreditNotes,
      fetchedUsers,
    ] = await Promise.all([
      partnerIds.length > 0
        ? db.query.partners.findMany({
            where: inArray(partners.id, partnerIds),
          })
        : [],
      branchIds.length > 0
        ? db.query.branches.findMany({
            where: inArray(branches.id, branchIds),
          })
        : [],
      currencyIds.length > 0
        ? db.query.currencies.findMany({
            where: inArray(currencies.id, currencyIds),
          })
        : [],
      invoiceIds.length > 0
        ? db.query.invoiceItems.findMany({
            where: inArray(invoiceItems.invoiceId, invoiceIds),
          })
        : [],
      invoiceIds.length > 0
        ? db.query.payments.findMany({
            where: inArray(payments.invoiceId, invoiceIds),
            orderBy: desc(payments.date),
          })
        : [],
      invoiceIds.length > 0
        ? db.query.creditNotes.findMany({
            where: inArray(creditNotes.invoiceId, invoiceIds),
          })
        : [],
      // Fetch Users
      [...new Set(invoicesList.map((inv) => inv.userId).filter(Boolean))]
        .length > 0
        ? db.query.users.findMany({
            where: inArray(users.id, [
              ...new Set(invoicesList.map((inv) => inv.userId).filter(Boolean)),
            ] as string[]),
          })
        : [],
    ]);

    // 3. Fetch products for items
    const productIds = [...new Set(fetchedItems.map((i) => i.productId))];
    const fetchedProducts =
      productIds.length > 0
        ? await db.query.products.findMany({
            where: inArray(products.id, productIds),
          })
        : [];

    // 4. Build Maps
    const partnerMap = new Map(fetchedPartners.map((p) => [p.id, p]));
    const branchMap = new Map(fetchedBranches.map((b) => [b.id, b]));
    const currencyMap = new Map(fetchedCurrencies.map((c) => [c.id, c]));
    const productMap = new Map(fetchedProducts.map((p) => [p.id, p]));

    const itemsByInvoice = new Map();
    for (const item of fetchedItems) {
      if (!itemsByInvoice.has(item.invoiceId)) {
        itemsByInvoice.set(item.invoiceId, []);
      }
      itemsByInvoice.get(item.invoiceId).push({
        ...item,
        product: productMap.get(item.productId) || null,
      });
    }

    // 4.1 Fetch Payment Methods
    const methodIds = [
      ...new Set(fetchedPayments.map((p) => p.methodId).filter(Boolean)),
    ];
    const fetchedMethods =
      methodIds.length > 0
        ? await db.query.paymentMethods.findMany({
            where: inArray(paymentMethods.id, methodIds),
          })
        : [];
    const methodMap = new Map(fetchedMethods.map((m) => [m.id, m]));

    const paymentsByInvoice = new Map();
    for (const payment of fetchedPayments) {
      if (payment.invoiceId) {
        if (!paymentsByInvoice.has(payment.invoiceId)) {
          paymentsByInvoice.set(payment.invoiceId, []);
        }
        paymentsByInvoice.get(payment.invoiceId).push({
          ...payment,
          method: methodMap.get(payment.methodId),
        });
      }
    }

    const creditNotesByInvoice = new Map();
    for (const cn of fetchedCreditNotes) {
      if (cn.invoiceId) {
        if (!creditNotesByInvoice.has(cn.invoiceId)) {
          creditNotesByInvoice.set(cn.invoiceId, []);
        }
        creditNotesByInvoice.get(cn.invoiceId).push(cn);
      }
    }

    const userMap = new Map(fetchedUsers.map((u) => [u.id, u]));

    // 5. Enrich and return
    return invoicesList.map((inv) => ({
      ...inv,
      partner: partnerMap.get(inv.partnerId) || null,
      branch: branchMap.get(inv.branchId) || null,
      currency: currencyMap.get(inv.currencyId) || null,
      user: (inv.userId ? userMap.get(inv.userId) : null) || null,
      items: itemsByInvoice.get(inv.id) || [],
      payments: paymentsByInvoice.get(inv.id) || [],
      creditNotes: creditNotesByInvoice.get(inv.id) || [],
    }));
  }

  async getFiscalBook(
    month: number,
    year: number,
    branchId?: string,
    type: string = 'SALE',
  ) {
    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 1); // First day of next month

    // 1. Fetch Invoices (POSTED, PAID)
    const invoiceWhere = and(
      inArray(invoices.status, ['POSTED', 'PAID']),
      gte(invoices.date, startDate),
      lt(invoices.date, endDate),
      lt(invoices.date, endDate),
      branchId ? eq(invoices.branchId, branchId) : undefined,
      eq(invoices.type, type),
    );

    const periodInvoices = await db.query.invoices.findMany({
      where: invoiceWhere,
      with: {
        partner: true,
        payments: {
          with: {
            method: true,
          },
        },
      },
      orderBy: desc(invoices.code),
    });

    // 2. Fetch Credit Notes (POSTED)
    const cnWhere = and(
      eq(creditNotes.status, 'POSTED'),
      gte(creditNotes.date, startDate),
      lt(creditNotes.date, endDate),
      branchId ? eq(creditNotes.branchId, branchId) : undefined,
    );

    const periodCreditNotes = await db.query.creditNotes.findMany({
      where: cnWhere,
      with: {
        partner: true,
      },
      orderBy: desc(creditNotes.code),
    });

    const rows = [];

    // Process Invoices
    for (const inv of periodInvoices) {
      // Calculate Retention
      // Filter payments that are "Retention" type (code starts with RET_)
      const retentionPayments = inv.payments.filter((p) =>
        p.method.code.startsWith('RET_'),
      );
      const retentionAmount = retentionPayments.reduce(
        (sum, p) => sum + Number(p.amount),
        0,
      );

      rows.push({
        date: inv.date,
        type: 'FAC', // TODO: Map Credit Note if needed
        number: type === 'PURCHASE' ? inv.invoiceNumber : inv.code,
        controlNumber: inv.code, // Internal Control
        customer: inv.partner?.name || 'N/A', // Or Supplier
        partnerName: inv.partner.name,
        partnerTaxId: inv.partner.taxId,
        totalExempt: 0, // Simplified: Assume all taxable for now unless flagged?
        // Actually we do have totalBase and totalTax.
        // Let's rely on totalBase as taxable base.
        totalTaxable: Number(inv.totalBase),
        taxRate: 16, // Fixed for standard
        taxAmount: Number(inv.totalTax),
        retentionAmount: retentionAmount,
        total: Number(inv.total),
      });
    }

    // Process Credit Notes
    for (const cn of periodCreditNotes) {
      // Credit Notes reduce sales
      rows.push({
        date: cn.date,
        type: 'NC',
        number: cn.code,
        controlNumber: cn.code,
        partnerName: cn.partner.name,
        partnerTaxId: cn.partner.taxId,
        totalExempt: 0,
        totalTaxable: -Number(cn.totalBase),
        taxRate: 16,
        taxAmount: -Number(cn.totalTax),
        retentionAmount: 0, // Usually CN doesn't have retention unless reversed?
        total: -Number(cn.total),
      });
    }

    // Sort by Date then Number
    return rows.sort((a, b) => {
      const dateA = a.date ? new Date(a.date).getTime() : 0;
      const dateB = b.date ? new Date(b.date).getTime() : 0;
      return dateA - dateB;
    });
  }
}
