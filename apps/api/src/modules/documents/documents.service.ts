import { Injectable } from '@nestjs/common';
import { db, documentLinks } from '@repo/db';
import { eq, or, desc, sql } from 'drizzle-orm';

@Injectable()
export class DocumentsService {
  async createLink(data: {
    sourceId: string;
    sourceTable: string;
    targetId: string;
    targetTable: string;
    type: string;
    userId?: string;
  }) {
    return await db.insert(documentLinks).values(data).returning();
  }

  async getFlow(documentId: string) {
    // 1. Find all links where this doc is source OR target
    // We want a broader graph? Maybe 2 levels?
    // for now, let's just get direct neighbors + neighbors of neighbors (2 hops) to show a decent flow.
    // Actually, recursive graph traversal in SQL is best, but for now let's do 1 hop (direct) + 2nd hop.

    // Simplification: Just get ALL links related to this ID directly,
    // AND links where the connected docs are involved.
    // "Find all connected components".
    // Let's stick to 1-level deep for simplicity and stability first, or just iterative BFS if needed.
    // But user wants "Tree".

    // Let's just fetch all links involving the documentId.
    const directLinks = await db
      .select()
      .from(documentLinks)
      .where(
        or(
          eq(documentLinks.sourceId, documentId),
          eq(documentLinks.targetId, documentId),
        ),
      );

    // Collect all unique IDs involved (including the generic documentId)
    const involvedIds = new Set<string>([documentId]);
    directLinks.forEach((link) => {
      involvedIds.add(link.sourceId);
      involvedIds.add(link.targetId);
    });

    // Fetch details for these IDs from respective tables.
    // We need to know "Type" to know which table to query.
    // `documentLinks` has `sourceTable` / `targetTable`.

    // We can infer table from the link info?
    // We have a set of IDs, but we need to know their tables.
    // We can build a map: ID -> TableName from the links.
    const idToTableMap = new Map<string, string>();

    // Initial doc... we don't know the table unless passed.
    // But we can guess or try all? Or assume the caller knows.
    // Actually, the links contain the table info.

    directLinks.forEach((link) => {
      idToTableMap.set(link.sourceId, link.sourceTable);
      idToTableMap.set(link.targetId, link.targetTable);
    });

    // If documentId is not in map (e.g. no links yet), we can't easily find it without type.
    // But if there are no links, visualizer shows just the node itself?
    // We'll need the type of the requested documentId likely.

    const nodes = [];

    // Group IDs by Table
    const tableIds = new Map<string, string[]>();
    involvedIds.forEach((id) => {
      const table = idToTableMap.get(id);
      if (table) {
        if (!tableIds.has(table)) tableIds.set(table, []);
        tableIds.get(table)?.push(id);
      }
    });

    // Execute queries
    // Supported tables: orders, invoices, payments
    const results = await Promise.all([
      tableIds.has('orders')
        ? db.query.orders.findMany({
            where: sql`id IN ${tableIds.get('orders')!}`,
            columns: {
              id: true,
              code: true,
              status: true,
              date: true,
              total: true,
            },
          })
        : [],
      tableIds.has('invoices')
        ? db.query.invoices.findMany({
            where: sql`id IN ${tableIds.get('invoices')!}`,
            columns: {
              id: true,
              code: true,
              status: true,
              date: true,
              total: true,
              type: true,
            },
          })
        : [],
      tableIds.has('payments')
        ? db.query.payments.findMany({
            where: sql`id IN ${tableIds.get('payments')!}`,
            columns: {
              id: true,
              reference: true,
              amount: true,
              date: true,
              type: true,
            },
          })
        : [],
    ]);

    const [orders, invoices, payments] = results;

    // Normalize Nodes
    const formatNode = (data: any, type: string) => ({
      id: data.id,
      label: data.code || data.reference || 'N/A',
      type: type, // 'orders', 'invoices' ...
      subLabel: data.status || data.type || '',
      date: data.date,
      amount: data.total || data.amount,
    });

    return {
      nodes: [
        ...orders.map((o) => formatNode(o, 'orders')),
        ...invoices.map((i) => formatNode(i, 'invoices')),
        ...payments.map((p) => formatNode(p, 'payments')),
      ],
      links: directLinks.map((l) => ({
        source: l.sourceId,
        target: l.targetId,
        type: l.type,
      })),
    };
  }
}
