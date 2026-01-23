import { Injectable } from '@nestjs/common';
import { db, products, productCategories } from '@repo/db';
import { eq, desc, ilike, or } from 'drizzle-orm';

@Injectable()
export class ProductsService {
  async findAll(search?: string) {
    if (search) {
      return await db
        .select()
        .from(products)
        .where(
          or(
            ilike(products.name, `%${search}%`),
            ilike(products.sku, `%${search}%`),
          ),
        )
        .orderBy(desc(products.createdAt));
    }
    return await db.select().from(products).orderBy(desc(products.createdAt));
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
    if (cost !== undefined) values.cost = cost.toString();
    if (price !== undefined) values.price = price.toString();
    if (taxRate !== undefined) values.taxRate = taxRate.toString();
    if (minStock !== undefined) values.minStock = minStock.toString();

    values.updatedAt = new Date();

    return await db
      .update(products)
      .set(values)
      .where(eq(products.id, id))
      .returning();
  }
}
