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
  paymentAllocations,
} from '@repo/db';
import {
  eq,
  sql,
  desc,
  inArray,
  and,
  gte,
  lt,
  like,
  ne,
  ilike,
  or,
  SQL,
} from 'drizzle-orm';
import Decimal from 'decimal.js';
import { InventoryService } from '../inventory/inventory.service';
import { CurrenciesService } from '../settings/currencies/currencies.service';
import { CreateInvoiceDto, InvoiceType } from './dto/create-invoice.dto';
import { FindInvoicesDto } from './dto/find-invoices.dto';

@Injectable()
export class BillingService {
  constructor(
    private readonly inventoryService: InventoryService,
    private readonly currenciesService: CurrenciesService,
  ) {}

  async findOne(id: string) {
    const invoice = await db.query.invoices.findFirst({
      where: eq(invoices.id, id),
      with: {
        partner: true,
        branch: true,
        currency: true,
        items: {
          with: {
            product: true,
          },
        },
        payments: {
          with: {
            method: true,
          },
        },
      },
    });

    if (!invoice) throw new NotFoundException('Factura no encontrada');

    return invoice;
  }

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

      // New IGTF Logic: Only apply if requested (or default logic can be improved)
      // IGTF applies to the Amount Paid in Foreign Currency.
      // Usually calculated as 3% of the Total Payment.
      // If we are issuing the invoice in Foreign Currency, we often add it to the total payable.

      if (data.applyIgtf && currency.code !== 'VES') {
        // IGTF Base is the Total Amount to Pay (Base + Tax).
        // Formula: (Base + IVA) * 0.03
        const subtotalWithTax = totalBase.plus(totalTax);
        totalIgtf = subtotalWithTax.times(0.03);
      }

      const total = totalBase.plus(totalTax).plus(totalIgtf);

      // Generate Code Strategy
      // 1. If Purchase, user might provide external invoiceNumber (Control Number)
      // 2. If Sale, we generate internal sequential code.
      // 3. POLICY: If Draft, generate temporary code. If Posted, generate sequence.

      let nextCode = `DRAFT-${Date.now()}`; // Default temporary

      if (status === 'POSTED') {
        // Generate Sequential ONLY if creating directly as POSTED
        const prefix = type === InvoiceType.SALE ? 'A' : 'C'; // A = Sale, C = Compra (Internal)

        const lastInvoice = await tx.query.invoices.findFirst({
          where: and(
            eq(invoices.type, type),
            like(invoices.code, `${prefix}-%`),
          ),
          orderBy: desc(invoices.code),
        });

        let nextNum = 1;

        if (lastInvoice && lastInvoice.code) {
          const match = lastInvoice.code.match(/([A-Z]+)-(\d+)/);
          if (match) {
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
          'El número de factura es requerido para confirmar compras',
        );
      }

      // Generate Code Strategy for Posting
      const type = invoice.type || InvoiceType.SALE;
      let nextCode = invoice.code;

      // Always generate sequence on Post if it's currently a Draft code
      if (invoice.code.startsWith('DRAFT')) {
        const prefix = type === InvoiceType.SALE ? 'A' : 'C';

        const lastInvoice = await tx.query.invoices.findFirst({
          where: and(
            eq(invoices.type, type),
            like(invoices.code, `${prefix}-%`),
          ),
          orderBy: desc(invoices.code),
        });

        let nextNum = 1;

        if (lastInvoice && lastInvoice.code) {
          const match = lastInvoice.code.match(/([A-Z]+)-(\d+)/);
          if (match) {
            nextNum = parseInt(match[2]) + 1;
          }
        }
        nextCode = `${prefix}-${nextNum.toString().padStart(5, '0')}`;
      }

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

  async findAll(branchId: string, query: FindInvoicesDto) {
    const { page = 1, limit = 10, search, type, status, partnerId } = query;
    const offset = (page - 1) * limit;

    const conditions = [eq(invoices.branchId, branchId)];

    if (type && type.length > 0) {
      if (Array.isArray(type)) {
        conditions.push(inArray(invoices.type, type));
      } else {
        conditions.push(eq(invoices.type, type));
      }
    }

    if (status && status.length > 0) {
      if (Array.isArray(status)) {
        conditions.push(inArray(invoices.status, status));
      } else {
        conditions.push(eq(invoices.status, status));
      }
    }

    if (partnerId) conditions.push(eq(invoices.partnerId, partnerId));

    if (search) {
      // Búsqueda inteligente por múltiples términos separados por comas
      const searchTerms = search
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean);

      if (searchTerms.length > 0) {
        const termConditions = [];

        // Buscar partners que coincidan con ALGUNO de los términos
        const matchingPartners = await db
          .select({ id: partners.id })
          .from(partners)
          .where(
            or(...searchTerms.map((term) => ilike(partners.name, `%${term}%`))),
          );

        const partnerIds = matchingPartners.map((p) => p.id);

        // Buscar por código o cliente
        for (const term of searchTerms) {
          termConditions.push(ilike(invoices.code, `%${term}%`));
          // También permitir buscar por número de control externo
          termConditions.push(ilike(invoices.invoiceNumber, `%${term}%`));
        }

        if (partnerIds.length > 0) {
          termConditions.push(inArray(invoices.partnerId, partnerIds));
        }

        // Si tenemos condiciones de búsqueda, las agregamos con OR
        if (termConditions.length > 0) {
          conditions.push(or(...termConditions)!);
        }
      }
    }

    const whereClause = and(...conditions);

    // 1. Get Total Count
    const [countResult] = await db
      .select({ count: sql<number>`count(*)` })
      .from(invoices)
      .where(whereClause);

    const total = Number(countResult?.count || 0);

    // 2. Get Paginated Data
    const invoicesList = await db.query.invoices.findMany({
      where: whereClause,
      limit,
      offset,
      orderBy: desc(invoices.date),
    });

    if (invoicesList.length === 0) {
      return {
        data: [],
        meta: {
          total: 0,
          page,
          lastPage: 0,
        },
      };
    }

    // Collect IDs
    const invoiceIds = invoicesList.map((inv) => inv.id);
    const invoicePartnerIds = [
      ...new Set(invoicesList.map((inv) => inv.partnerId)),
    ];
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
      fetchedAllocations,
      fetchedUsers,
    ] = await Promise.all([
      invoicePartnerIds.length > 0
        ? db.query.partners.findMany({
            where: inArray(partners.id, invoicePartnerIds),
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
      invoiceIds.length > 0
        ? db.query.paymentAllocations.findMany({
            where: inArray(paymentAllocations.invoiceId, invoiceIds),
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

    const allocationsByInvoice = new Map();
    for (const alloc of fetchedAllocations) {
      if (!allocationsByInvoice.has(alloc.invoiceId)) {
        allocationsByInvoice.set(alloc.invoiceId, []);
      }
      allocationsByInvoice.get(alloc.invoiceId).push(alloc);
    }

    const userMap = new Map(fetchedUsers.map((u) => [u.id, u]));

    // 5. Enrich and return
    const data = invoicesList.map((inv) => {
      const invPayments = paymentsByInvoice.get(inv.id) || [];
      const invAllocations = allocationsByInvoice.get(inv.id) || [];

      // Calculate Paid Amount without double counting
      const allocatedPaymentIds = new Set(
        invAllocations.map((a: any) => a.paymentId),
      );
      let paidSum = invAllocations.reduce(
        (sum: Decimal, a: any) => sum.plus(new Decimal(a.amount)),
        new Decimal(0),
      );

      for (const p of invPayments) {
        if (!allocatedPaymentIds.has(p.id)) {
          paidSum = paidSum.plus(new Decimal(p.amount));
        }
      }

      return {
        ...inv,
        partner: partnerMap.get(inv.partnerId) || null,
        branch: branchMap.get(inv.branchId) || null,
        currency: currencyMap.get(inv.currencyId) || null,
        user: (inv.userId ? userMap.get(inv.userId) : null) || null,
        items: itemsByInvoice.get(inv.id) || [],
        payments: invPayments,
        allocations: invAllocations,
        creditNotes: creditNotesByInvoice.get(inv.id) || [],
        paidAmount: paidSum.toFixed(2),
      };
    });

    return {
      data: data,
      meta: {
        total,
        page,
        lastPage: Math.ceil(total / limit),
      },
    };
  }

  async getStats(branchId: string, type: string) {
    const stats = await db
      .select({
        status: invoices.status,
        count: sql<number>`count(*)`,
      })
      .from(invoices)
      .where(and(eq(invoices.branchId, branchId), eq(invoices.type, type)))
      .groupBy(invoices.status);

    return stats;
  }
}
