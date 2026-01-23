import { db } from "./src";
import { bankAccounts, currencies } from "./src/schema";
import { eq } from "drizzle-orm";
import * as dotenv from "dotenv";

dotenv.config({ path: "./src/.env" });

async function main() {
  console.log("Creating Cash accounts...");

  // Fetch currencies
  const allCurrencies = await db.select().from(currencies);
  const usd = allCurrencies.find((c) => c.code === "USD");
  const ves = allCurrencies.find((c) => c.code === "VES");

  if (!usd || !ves) {
    console.error("Currencies not found");
    process.exit(1);
  }

  const accounts = [
    {
      name: "Caja Principal USD",
      type: "CASH",
      currencyId: usd.id,
      accountNumber: "N/A", // Placeholder or null
      currentBalance: "0",
      isActive: true,
    },
    {
      name: "Caja Principal Bs",
      type: "CASH",
      currencyId: ves.id,
      accountNumber: "N/A",
      currentBalance: "0",
      isActive: true,
    },
  ];

  await db.insert(bankAccounts).values(accounts).onConflictDoNothing();

  console.log("Cash accounts created.");
  process.exit(0);
}

main();
