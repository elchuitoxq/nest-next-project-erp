import { Injectable } from '@nestjs/common';
import { db, auditLogs } from '@repo/db';
import { InferInsertModel } from 'drizzle-orm';

export type AuditLogDto = InferInsertModel<typeof auditLogs>;

@Injectable()
export class AuditService {
  async logChange(data: Omit<AuditLogDto, 'id' | 'createdAt'>) {
    try {
      await db.insert(auditLogs).values(data);
    } catch (error) {
      console.error('Failed to create audit log:', error);
      // Fail silently to not block the main transaction?
      // Or throw? Usually audit needs to be reliable but non-blocking for user flow if DB is up.
    }
  }

  async getLogsByEntity(entityTable: string, entityId: string) {
    return await db.query.auditLogs.findMany({
      where: (logs, { eq, and }) =>
        and(eq(logs.entityTable, entityTable), eq(logs.entityId, entityId)),
      orderBy: (logs, { desc }) => [desc(logs.createdAt)],
      with: {
        user: true, // Assuming relation exists or will be added
      },
    });
  }

  async getProcessHistory(entityTable: string, entityId: string) {
    let allLogs = await this.getLogsByEntity(entityTable, entityId);

    // If it's an invoice, also get logs for the related order and payments
    if (entityTable === 'invoices') {
      const invoice = (await db.query.invoices.findFirst({
        where: (invoices, { eq }) => eq(invoices.id, entityId),
        with: {
          order: true,
          payments: true,
        },
      })) as any;

      if (invoice) {
        if (invoice.orderId) {
          const orderLogs = await this.getLogsByEntity(
            'orders',
            invoice.orderId,
          );
          allLogs = [...allLogs, ...orderLogs];
        }

        // 1. Get payments linked via direct foreign key (Legacy)
        if (invoice.payments && invoice.payments.length > 0) {
          for (const payment of invoice.payments) {
            const paymentLogs = await this.getLogsByEntity(
              'payments',
              payment.id,
            );
            allLogs = [...allLogs, ...paymentLogs];
          }
        }

        // 2. Get payments linked via allocations (New)
        const allocations = await db.query.paymentAllocations.findMany({
          where: (allocs, { eq }) => eq(allocs.invoiceId, entityId),
          with: {
            payment: true,
          },
        });

        for (const alloc of allocations) {
          if (alloc.paymentId) {
            const paymentLogs = await this.getLogsByEntity(
              'payments',
              alloc.paymentId,
            );
            // Avoid duplicates if payment matched both ways
            const existingIds = new Set(allLogs.map((l) => l.id));
            const newLogs = paymentLogs.filter((l) => !existingIds.has(l.id));
            allLogs = [...allLogs, ...newLogs];
          }
        }
      }
    }

    // If it's an order, also get logs for the related invoice and its payments
    if (entityTable === 'orders') {
      const invoice = (await db.query.invoices.findFirst({
        where: (invoices, { eq }) => eq(invoices.orderId, entityId),
        with: {
          payments: true,
        },
      })) as any;

      if (invoice) {
        const invoiceLogs = await this.getLogsByEntity('invoices', invoice.id);
        allLogs = [...allLogs, ...invoiceLogs];

        if (invoice.payments && invoice.payments.length > 0) {
          for (const payment of invoice.payments) {
            const paymentLogs = await this.getLogsByEntity(
              'payments',
              payment.id,
            );
            allLogs = [...allLogs, ...paymentLogs];
          }
        }
      }
    }

    // Sort all consolidated logs by creation date descending
    return allLogs.sort(
      (a, b) => b.createdAt!.getTime() - a.createdAt!.getTime(),
    );
  }
}
