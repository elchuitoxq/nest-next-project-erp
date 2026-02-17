import { Injectable, BadRequestException } from '@nestjs/common';
import {
  db,
  warehouses,
  stock,
  inventoryMoves,
  inventoryMoveLines,
  products,
} from '@repo/db';
import { eq, desc, and, sql, inArray, or, ilike, SQL } from 'drizzle-orm';
import Decimal from 'decimal.js';
import { FindMovesDto } from './dto/find-moves.dto';
import { AccountingService } from '../accounting/accounting.service'; // Import

@Injectable()
@Injectable()
export class InventoryService {
  constructor(private readonly accountingService: AccountingService) {}

  // --- WAREHOUSES ---
  async findAllWarehouses(branchId?: string) {
    const whereClause = branchId
      ? eq(warehouses.branchId, branchId)
      : undefined;
    return await db.query.warehouses.findMany({
      where: whereClause,
      orderBy: desc(warehouses.isActive),
      with: {
        branch: true,
      },
    });
  }

  async createWarehouse(data: typeof warehouses.$inferInsert) {
    return await db.insert(warehouses).values(data).returning();
  }

  async updateWarehouse(
    id: string,
    data: Partial<typeof warehouses.$inferInsert>,
  ) {
    return await db
      .update(warehouses)
      .set(data)
      .where(eq(warehouses.id, id))
      .returning();
  }

  // --- STOCK & MOVES ---
  async getStock(warehouseId: string, search?: string) {
    let whereClause: any = eq(stock.warehouseId, warehouseId);

    if (search) {
      whereClause = and(
        whereClause,
        or(
          ilike(products.name, `%${search}%`),
          ilike(products.sku, `%${search}%`),
        ),
      );
    }

    const rows = await db
      .select()
      .from(stock)
      .innerJoin(products, eq(stock.productId, products.id))
      .where(whereClause);

    // Map to expected structure (Relational API style)
    return rows.map(({ stock, products }) => ({
      ...stock,
      product: products,
    }));
  }

  async getProductStock(productId: string) {
    return await db.select().from(stock).where(eq(stock.productId, productId));
  }

  // ATOMIC MOVE TRANSACTION
  async createMove(data: {
    type: 'IN' | 'OUT' | 'TRANSFER' | 'ADJUST';
    fromWarehouseId?: string;
    toWarehouseId?: string;
    note?: string;
    userId: string;
    branchId?: string;
    date?: Date | string;
    lines: {
      productId: string;
      quantity: number;
      cost?: number;
      batchId?: string;
    }[];
    skipAccounting?: boolean;
  }) {
    console.log('Creating Move. Lines received:', data.lines?.length);

    // ... validation ...

    // Strict Validation of required fields per type
    if (data.type === 'IN' && !data.toWarehouseId) {
      throw new BadRequestException(
        'El almacén de destino es requerido para Entradas',
      );
    }
    if (data.type === 'OUT' && !data.fromWarehouseId) {
      throw new BadRequestException(
        'El almacén de origen es requerido para Salidas',
      );
    }
    if (
      data.type === 'TRANSFER' &&
      (!data.fromWarehouseId || !data.toWarehouseId)
    ) {
      throw new BadRequestException(
        'Ambos almacenes son requeridos para Transferencias',
      );
    }
    if (data.type === 'ADJUST' && !data.fromWarehouseId) {
      throw new BadRequestException('El almacén donde ajustar es requerido');
    }

    // If branchId is provided, validate warehouses
    if (data.branchId) {
      if (data.fromWarehouseId) {
        const fw = await db.query.warehouses.findFirst({
          where: eq(warehouses.id, data.fromWarehouseId),
        });
        if (fw && fw.branchId !== data.branchId) {
          throw new BadRequestException(
            'El almacén de origen no pertenece a la sucursal activa',
          );
        }
      }
      if (data.toWarehouseId) {
        const tw = await db.query.warehouses.findFirst({
          where: eq(warehouses.id, data.toWarehouseId),
        });
        if (tw && tw.branchId !== data.branchId) {
          throw new BadRequestException(
            'El almacén destino no pertenece a la sucursal activa',
          );
        }
      }
    }
    const result = await db.transaction(async (tx) => {
      // 1. Create Header
      const [move] = await tx
        .insert(inventoryMoves)
        .values({
          code: `MOV-${Date.now()}`, // Temporary Code Gen
          type: data.type,
          fromWarehouseId: data.fromWarehouseId,
          toWarehouseId: data.toWarehouseId,
          note: data.note,
          userId: data.userId,
          date: data.date ? new Date(data.date) : undefined,
        })
        .returning();

      // 2. Process Lines & Update Stock
      for (const line of data.lines) {
        // Create Line
        await tx.insert(inventoryMoveLines).values({
          moveId: move.id,
          productId: line.productId,
          quantity: line.quantity.toString(),
          cost: line.cost ? line.cost.toString() : null,
          // @ts-ignore
          batchId: line.batchId,
        });

        // Logic per type
        if (data.type === 'IN' && data.toWarehouseId) {
          await this.updateStock(
            tx,
            data.toWarehouseId,
            line.productId,
            line.quantity,
            line.cost, // Pass cost
            line.batchId,
          );
        } else if (data.type === 'OUT' && data.fromWarehouseId) {
          await this.updateStock(
            tx,
            data.fromWarehouseId,
            line.productId,
            -line.quantity,
            undefined,
            line.batchId,
          );
        } else if (
          data.type === 'TRANSFER' &&
          data.fromWarehouseId &&
          data.toWarehouseId
        ) {
          await this.updateStock(
            tx,
            data.fromWarehouseId,
            line.productId,
            -line.quantity,
            undefined,
            line.batchId,
          );
          await this.updateStock(
            tx,
            data.toWarehouseId,
            line.productId,
            line.quantity,
            undefined, // Cost logic for transfer? Keeps original?
            line.batchId,
          );
        } else if (data.type === 'ADJUST' && data.fromWarehouseId) {
          await this.updateStock(
            tx,
            data.fromWarehouseId,
            line.productId,
            line.quantity,
            line.cost, // Adjust can change cost if it's an IN adjust
            line.batchId,
          );
        }
      }
      return move;
    });

    if (!data.skipAccounting) {
      try {
        await this.accountingService.createEntryForInventoryMove(result.id);
      } catch (error) {
        console.error(
          'Error creating accounting entry for inventory move:',
          error,
        );
      }
    }

    return result;
  }

  // --- MOVES ---
  async findAllMoves(branchId: string, query: FindMovesDto) {
    const { page = 1, limit = 10, search, type, warehouseId } = query;
    const offset = (page - 1) * limit;

    const conditions = [];

    // Branch Security: Ensure we only show moves related to warehouses in this branch
    if (branchId) {
      const branchWarehouses = await db
        .select({ id: warehouses.id })
        .from(warehouses)
        .where(eq(warehouses.branchId, branchId));

      const warehouseIds = branchWarehouses.map((w) => w.id);

      if (warehouseIds.length > 0) {
        // Move involves at least one warehouse from this branch
        conditions.push(
          or(
            inArray(inventoryMoves.fromWarehouseId, warehouseIds),
            inArray(inventoryMoves.toWarehouseId, warehouseIds),
          ),
        );
      } else {
        return { data: [], meta: { total: 0, page, lastPage: 0 } };
      }
    }

    if (type && type.length > 0) {
      if (Array.isArray(type)) {
        conditions.push(inArray(inventoryMoves.type, type));
      } else {
        conditions.push(eq(inventoryMoves.type, type));
      }
    }

    if (warehouseId) {
      conditions.push(
        or(
          eq(inventoryMoves.fromWarehouseId, warehouseId),
          eq(inventoryMoves.toWarehouseId, warehouseId),
        ),
      );
    }

    if (search) {
      const searchTerms = search
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean);
      const termConditions = [];

      for (const term of searchTerms) {
        termConditions.push(ilike(inventoryMoves.code, `%${term}%`));
        termConditions.push(ilike(inventoryMoves.note, `%${term}%`));
      }

      if (termConditions.length > 0) {
        conditions.push(or(...termConditions)!);
      }
    }

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

    // 1. Get Total Count
    const [countResult] = await db
      .select({ count: sql<number>`count(*)` })
      .from(inventoryMoves)
      .where(whereClause);

    const total = Number(countResult?.count || 0);

    // 2. Get Paginated Data
    const data = await db.query.inventoryMoves.findMany({
      where: whereClause,
      limit,
      offset,
      orderBy: desc(inventoryMoves.date),
      with: {
        fromWarehouse: true,
        toWarehouse: true,
        user: true,
        lines: {
          with: {
            product: true,
          },
        },
      },
    });

    return {
      data,
      meta: {
        total,
        page,
        lastPage: Math.ceil(total / limit),
      },
    };
  }

  private async updateStock(
    tx: any,
    warehouseId: string,
    productId: string,
    delta: number,
    unitCost?: number, // Incoming Unit Cost
    batchId?: string,
  ) {
    // 0. Validate Batch Requirement
    const product = await tx.query.products.findFirst({
      where: eq(products.id, productId),
    });

    if (!product) throw new BadRequestException('Producto no encontrado');

    if (product.hasBatches && !batchId) {
      throw new BadRequestException(
        `El producto ${product.sku} requiere lote (Batch Management)`,
      );
    }

    // 1. Update Global Cost (Weighted Average) ONLY if adding stock
    // TODO: Verify if cost update should be skipped for Batch products or kept as reference
    if (delta > 0 && unitCost) {
      // Calculate Total Current Stock across all warehouses
      const allStock = await tx
        .select({ quantity: stock.quantity })
        .from(stock)
        .where(eq(stock.productId, productId));

      const currentTotalQty = allStock.reduce(
        (sum: number, s: { quantity: string }) => sum + parseFloat(s.quantity),
        0,
      );

      const currentCost = parseFloat(product.cost || '0');
      const incomingQty = delta;

      // WAC Formula
      const currentVal = new Decimal(currentTotalQty).times(currentCost);
      const incomingVal = new Decimal(incomingQty).times(unitCost);
      const newTotalQty = new Decimal(currentTotalQty).plus(incomingQty);

      if (newTotalQty.gt(0)) {
        const newCost = currentVal.plus(incomingVal).div(newTotalQty);
        await tx
          .update(products)
          .set({ cost: newCost.toFixed(2), updatedAt: new Date() })
          .where(eq(products.id, productId));
      }
    }

    // 2. Check if stock record exists in Warehouse (AND Batch if applicable)
    const stockConditions = [
      eq(stock.warehouseId, warehouseId),
      eq(stock.productId, productId),
    ];
    if (batchId) {
      // @ts-ignore
      stockConditions.push(eq(stock.batchId, batchId));
    } else {
      // Ensure we treat null batchId correctly if needed,
      // but schema says batchId is nullable reference.
      // Drizzle 'eq(stock.batchId, null)' might be risky, usually simply 'isNull(stock.batchId)'
      // But typically for non-batch products it is just null.
      // If we mix batch and non-batch for same product (should not happen due to hasBatches flag),
      // we need to be careful.
      // @ts-ignore
      stockConditions.push(sql`${stock.batchId} IS NULL`);
    }

    const [existing] = await tx
      .select()
      .from(stock)
      .where(and(...stockConditions));

    if (existing) {
      const newQty = parseFloat(existing.quantity) + delta;
      if (newQty < 0)
        throw new BadRequestException(
          `Stock negativo bloqueado para Producto ${product.sku} en Almacén ${warehouseId}`,
        );

      await tx
        .update(stock)
        .set({ quantity: newQty.toString(), updatedAt: new Date() })
        .where(eq(stock.id, existing.id));
    } else {
      if (delta < 0)
        throw new BadRequestException(
          `Stock negativo bloqueado para Producto ${product.sku}`,
        );
      await tx.insert(stock).values({
        warehouseId,
        productId,
        quantity: delta.toString(),
        // @ts-ignore
        batchId: batchId || null,
      });
    }
  }
}
