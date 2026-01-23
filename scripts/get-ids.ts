import { db, warehouses, products } from "@repo/db";

async function main() {
  const warehouse = await db.query.warehouses.findFirst();
  const product = await db.query.products.findFirst();

  console.log("Warehouse ID:", warehouse?.id);
  console.log("Product ID:", product?.id);
  process.exit(0);
}

main();
