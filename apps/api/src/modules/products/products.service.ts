import { Injectable } from '@nestjs/common';
import {
  db,
  products,
  productCategories,
  stock,
  warehouses,
  productBatches,
} from '@repo/db';
import { eq, desc, ilike, or, and, sql } from 'drizzle-orm';

@Injectable()
export class ProductsService {
  async findAll(search?: string, branchId?: string) {
    const query = db
      .select({
        id: products.id,
        sku: products.sku,
        name: products.name,
        description: products.description,
        categoryId: products.categoryId,
        cost: products.cost,
        price: products.price,
        isExempt: products.isExempt,
        taxRate: products.taxRate,
        type: products.type,
        minStock: products.minStock,
        currencyId: products.currencyId,
        createdAt: products.createdAt,
        stock: sql<number>`COALESCE(SUM(${stock.quantity}), 0)`.mapWith(Number),
      })
      .from(products)
      .leftJoin(stock, eq(products.id, stock.productId))
      .leftJoin(warehouses, eq(stock.warehouseId, warehouses.id))
      .groupBy(products.id)
      .orderBy(desc(products.createdAt));

    const conditions = [];

    if (search) {
      conditions.push(
        or(
          ilike(products.name, `%${search}%`),
          ilike(products.sku, `%${search}%`),
        ),
      );
    }

    if (branchId) {
      conditions.push(eq(warehouses.branchId, branchId));
    }

    if (conditions.length > 0) {
      // @ts-ignore - complex types sometimes fail with spread
      query.where(and(...conditions));
    }

    return await query;
  }

  async findOne(id: string) {
    const result = await db.select().from(products).where(eq(products.id, id));
    return result[0];
  }

  async create(dto: any) {
    const { cost, price, taxRate, minStock, ...rest } = dto;
    const values = {
      ...rest,
      cost: cost?.toString(),
      price: price?.toString(),
      taxRate: taxRate?.toString(),
      minStock: minStock?.toString(),
    };
    return await db.insert(products).values(values).returning();
  }

  async update(id: string, dto: any) {
    const { cost, price, taxRate, minStock, ...rest } = dto;
    const values: any = { ...rest };
    if (cost !== undefined) values.cost = cost?.toString();
    if (price !== undefined) values.price = price?.toString();
    if (taxRate !== undefined) values.taxRate = taxRate?.toString();
    if (minStock !== undefined) values.minStock = minStock?.toString();

    values.updatedAt = new Date();

    return await db
      .update(products)
      .set(values)
      .where(eq(products.id, id))
      .returning();
  }

  // --- BATCHES ---

  async findBatches(productId: string) {
    return await db
      .select()
      .from(productBatches)
      .where(
        and(
          eq(productBatches.productId, productId),
          eq(productBatches.isActive, true),
        ),
      )
      .orderBy(desc(productBatches.createdAt));
  }

  async createBatch(productId: string, dto: any) {
    const { batchNumber, expirationDate, cost } = dto;
    return await db
      .insert(productBatches)
      .values({
        productId,
        batchNumber,
        expirationDate: expirationDate ? new Date(expirationDate) : null,
        cost: cost?.toString(),
      })
      .returning();
  }

  async updateBatch(id: string, dto: any) {
    const { batchNumber, expirationDate, cost, isActive } = dto;
    const values: any = {};
    if (batchNumber !== undefined) values.batchNumber = batchNumber;
    if (expirationDate !== undefined)
      values.expirationDate = expirationDate ? new Date(expirationDate) : null;
    if (cost !== undefined) values.cost = cost?.toString();
    if (isActive !== undefined) values.isActive = isActive;

    values.updatedAt = new Date();

    return await db
      .update(productBatches)
      .set(values)
      .where(eq(productBatches.id, id))
      .returning();
  }
}
