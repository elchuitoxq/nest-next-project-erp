import "./load-env";
import { db, paymentMethods, currencies, branches } from "../src";
import { eq, and } from "drizzle-orm";

async function migrate() {
  console.log("🚀 Migrating Balance Payment Methods...");

  const allBranches = await db.select().from(branches);
  const allCurrencies = await db.select().from(currencies);

  const usd = allCurrencies.find((c) => c.code === "USD");
  const ves = allCurrencies.find((c) => c.code === "VES");

  if (!usd || !ves) {
    console.error("❌ Currencies not found");
    process.exit(1);
  }

  for (const branch of allBranches) {
    console.log(`Processing branch: ${branch.name}`);

    const existing = await db
      .select()
      .from(paymentMethods)
      .where(
        and(
          eq(paymentMethods.branchId, branch.id),
          eq(paymentMethods.code, "BALANCE_USD"),
        ),
      );

    if (existing.length === 0) {
      await db.insert(paymentMethods).values({
        name: "Uso de Saldo a Favor ($)",
        code: "BALANCE_USD",
        currencyId: usd.id,
        branchId: branch.id,
        isDigital: true,
      });
      console.log(`  ✅ Added BALANCE_USD`);
    }

    const existingVes = await db
      .select()
      .from(paymentMethods)
      .where(
        and(
          eq(paymentMethods.branchId, branch.id),
          eq(paymentMethods.code, "BALANCE_VES"),
        ),
      );

    if (existingVes.length === 0) {
      await db.insert(paymentMethods).values({
        name: "Uso de Saldo a Favor (Bs)",
        code: "BALANCE_VES",
        currencyId: ves.id,
        branchId: branch.id,
        isDigital: true,
      });
      console.log(`  ✅ Added BALANCE_VES`);
    }
  }

  console.log("✅ Migration complete.");
  process.exit(0);
}

migrate().catch((e) => {
  console.error(e);
  process.exit(1);
});
