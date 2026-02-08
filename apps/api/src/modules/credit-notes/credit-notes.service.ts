import { Injectable, BadRequestException } from '@nestjs/common';
import {
  db,
  creditNotes,
  creditNoteItems,
  invoices,
  inventoryMoves,
  inventoryMoveLines,
  products,
  stock,
  partners,
} from '@repo/db';
import { eq, sql, and } from 'drizzle-orm';
import { uuidv7 } from 'uuidv7';

@Injectable()
export class CreditNotesService {
  async create(data: {
    invoiceId: string;
    warehouseId?: string; // Optional: where to return stock
    items: { productId: string; quantity: number }[];
    userId: string;
  }) {
    return await db.transaction(async (tx) => {
      // 1. Validar Factura
      const invoice = await tx.query.invoices.findFirst({
        where: eq(invoices.id, data.invoiceId),
        with: {
          items: true,
          partner: true,
        },
      });

      if (!invoice) throw new BadRequestException('Factura no encontrada');
      if (invoice.status !== 'POSTED' && invoice.status !== 'PAID') {
        throw new BadRequestException(
          'Solo se pueden hacer notas de crédito de facturas emitidas o pagadas',
        );
      }

      // 2. Calcular Totales y Validar Cantidades
      let totalBase = 0;
      let totalTax = 0;
      let totalIgtf = 0;

      const ncItems = [];

      for (const item of data.items) {
        // Encontrar info original del item en factura
        const originalItem = invoice.items.find(
          (i) => i.productId === item.productId,
        );
        if (!originalItem)
          throw new BadRequestException(
            `Producto ${item.productId} no pertenece a esta factura`,
          );

        if (Number(item.quantity) > Number(originalItem.quantity)) {
          throw new BadRequestException(
            `No puedes devolver más cantidad de la facturada para el producto ${item.productId}`,
          );
        }

        const price = Number(originalItem.price);
        const ratio = Number(item.quantity) / Number(originalItem.quantity); // Proporción devuelta

        const itemTotal = price * item.quantity;
        const itemTax =
          (Number(originalItem.total) -
            Number(originalItem.price) * Number(originalItem.quantity)) *
          ratio; // Aprox tax logic, better to re-calc if tax rate known

        // Re-calcuating reliably using product tax rate or invoice implication is safer
        // For now assuming linear proportion of line totals
        // totalBase += itemTotal;

        // Let's use exact calculation if we assume tax rate from product?
        // Or simpler: just sum up totals.
        // Doing proportional calc for Base/Tax/IGTF based on Invoice totals is complex if mixed rates.
        // Best approach: Re-calculate from scratch using stored price.

        ncItems.push({
          id: uuidv7(),
          productId: item.productId,
          quantity: item.quantity.toString(),
          price: price.toString(),
          total: itemTotal.toString(),
        });

        totalBase += itemTotal;
      }

      // Prorate Tax and IGTF based on returned base amount vs total base
      const refundRatio = totalBase / Number(invoice.totalBase);
      totalTax = Number(invoice.totalTax) * refundRatio;
      totalIgtf = Number(invoice.totalIgtf) * refundRatio;
      const total = totalBase + totalTax + totalIgtf;

      // 3. Crear Nota de Crédito
      const [nc] = await tx
        .insert(creditNotes)
        .values({
          code: `NC-${uuidv7().slice(0, 8).toUpperCase()}`, // TODO: Correlative sequence
          invoiceId: invoice.id,
          partnerId: invoice.partnerId,
          branchId: invoice.branchId,
          currencyId: invoice.currencyId,
          exchangeRate: invoice.exchangeRate,
          warehouseId: data.warehouseId,
          status: 'POSTED',
          totalBase: totalBase.toString(),
          totalTax: totalTax.toString(),
          totalIgtf: totalIgtf.toString(),
          total: total.toString(),
          userId: data.userId,
        })
        .returning();

      // 4. Insertar Items
      if (ncItems.length > 0) {
        await tx
          .insert(creditNoteItems)
          .values(ncItems.map((i) => ({ ...i, creditNoteId: nc.id })));
      }

      // 5. Devolución de Inventario (Delegado a InventoryService) (Si warehouseId presente)
      // Nota: Esto debería idealmente hacerse a través de InventoryService para re-usar la lógica
      // Pero como estamos dentro de una transacción, necesitamos pasar el `tx` o replicar la lógica segura sin `onConflict`
      // Para arreglar el error 42P10 rápido, usaremos la lógica check-then-update manual similar a InventoryService.updateStock

      if (data.warehouseId) {
        const moveId = uuidv7();
        await tx.insert(inventoryMoves).values({
          id: moveId,
          code: `IN-NC-${nc.code}`,
          type: 'IN',
          toWarehouseId: data.warehouseId,
          userId: data.userId,
          note: `Devolución por Nota de Crédito ${nc.code}`,
        });

        for (const item of ncItems) {
          await tx.insert(inventoryMoveLines).values({
            moveId,
            productId: item.productId,
            quantity: item.quantity,
            cost: item.price,
          });

          // Update Stock Manually (No Insert on Conflict to avoid missing constraint error)
          const [existing] = await tx
            .select()
            .from(stock)
            .where(
              and(
                eq(stock.warehouseId, data.warehouseId),
                eq(stock.productId, item.productId),
              ),
            );

          if (existing) {
            const newQty = Number(existing.quantity) + Number(item.quantity);
            await tx
              .update(stock)
              .set({ quantity: newQty.toString(), updatedAt: new Date() })
              .where(eq(stock.id, existing.id));
          } else {
            await tx.insert(stock).values({
              warehouseId: data.warehouseId,
              productId: item.productId,
              quantity: item.quantity,
            });
          }
        }
      }

      // 6. Actualizar Balance Cliente (Opcional, si existiera cuenta corriente)
      // TODO: Implementar cuando gestión de saldos esté lista

      return nc;
    });
  }

  async findAll() {
    return await db.query.creditNotes.findMany({
      with: {
        partner: true,
        invoice: true,
      },
      orderBy: (cn, { desc }) => [desc(cn.date)],
    });
  }

  async findOne(id: string) {
    const cn = await db.query.creditNotes.findFirst({
      where: eq(creditNotes.id, id),
      with: {
        partner: true,
        branch: true,
        invoice: true,
        items: {
          with: {
            product: true,
          },
        },
      },
    });

    if (!cn) throw new BadRequestException('Nota de Crédito no encontrada');

    return cn;
  }
}
