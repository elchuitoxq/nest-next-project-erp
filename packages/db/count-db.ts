import {
  db,
  branches,
  currencies,
  paymentMethods,
  bankAccounts,
  exchangeRates,
} from "./src";
import { sql } from "drizzle-orm";
import * as dotenv from "dotenv";

dotenv.config({ path: "./src/.env" });

async function verify() {
  const branchCount = await db.select({ count: sql`count(*)` }).from(branches);
  const currencyCount = await db
    .select({ count: sql`count(*)` })
    .from(currencies);
  const methodCount = await db
    .select({ count: sql`count(*)` })
    .from(paymentMethods);
  const accountCount = await db
    .select({ count: sql`count(*)` })
    .from(bankAccounts);
  const rateCount = await db
    .select({ count: sql`count(*)` })
    .from(exchangeRates);

  console.log("--- SEED VERIFICATION ---");
  console.log(`Branches: ${branchCount[0].count}`);
  console.log(
    `Currencies: ${currencyCount[0].count} (Expected 4: 2 USD, 2 VES)`,
  );
  console.log(
    `Payment Methods: ${methodCount[0].count} (Expected 10: 5 per branch)`,
  );
  console.log(
    `Bank Accounts: ${accountCount[0].count} (Expected 6: 3 per branch)`,
  );
  console.log(
    `Exchange Rates: ${rateCount[0].count} (Expected 2: 1 USD per branch)`,
  );
  console.log("--------------------------");
  process.exit(0);
}

verify();
