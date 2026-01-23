import { db, currencies, exchangeRates, products } from "@repo/db";
import { eq, desc } from "drizzle-orm";

async function main() {
  console.log("--- CURRENCIES ---");
  const allCurrencies = await db.select().from(currencies);
  console.log(JSON.stringify(allCurrencies, null, 2));

  console.log("--- USD RATE CHECK ---");
  const usd = allCurrencies.find((c) => c.code === "USD");
  if (usd) {
    console.log(`USD Found: ID=${usd.id}`);
    const rates = await db
      .select()
      .from(exchangeRates)
      .where(eq(exchangeRates.currencyId, usd.id))
      .orderBy(desc(exchangeRates.date))
      .limit(5);
    console.log("Latest 5 Rates for USD:");
    console.log(JSON.stringify(rates, null, 2));
  } else {
    console.error("USD Currency NOT FOUND!");
  }

  console.log("--- PRODUCTS CURRENCY CHECK ---");
  const productsSample = await db
    .select({
      name: products.name,
      currencyId: products.currencyId,
      cost: products.cost,
    })
    .from(products)
    .limit(5);
  console.log(JSON.stringify(productsSample, null, 2));
}

main()
  .catch(console.error)
  .then(() => process.exit(0));
