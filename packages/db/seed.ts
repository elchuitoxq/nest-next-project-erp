import {
  db,
  users,
  currencies,
  paymentMethods,
  employees,
  roles,
  usersRoles,
  bankAccounts,
  branches,
  usersBranches,
  exchangeRates,
} from "./src";
import { sql } from "drizzle-orm";
import * as bcrypt from "bcrypt";
import * as dotenv from "dotenv";

dotenv.config({ path: "./src/.env" });

async function main() {
  console.log("🚀 Seeding database with Multi-Branch Finance support...");

  try {
    // Clean DB
    console.log("🧹 Cleaning tables...");
    await db.execute(
      sql`TRUNCATE TABLE users_roles, users, currencies, payment_methods, employees, partners, branches, roles, organization_modules, user_app_settings, exchange_rates, warehouses, product_categories, products, stock, inventory_moves, inventory_move_lines, invoices, invoice_items, payments, loans, loan_items, payroll_runs, payroll_items, credit_notes, credit_note_items, bank_accounts, payment_allocations, users_branches CASCADE`,
    );

    // 1. Seed Roles
    console.log("👥 Seeding Roles...");
    const [adminRole] = await db
      .insert(roles)
      .values([
        { name: "admin", description: "Administrator with full access" },
        { name: "manager", description: "Manager with access to operations" },
        { name: "seller", description: "Seller with access to sales" },
      ])
      .returning();

    // 2. Seed Admin User
    console.log("👤 Seeding Admin User...");
    const hashedPassword = await bcrypt.hash("admin123", 10);
    const [adminUser] = await db
      .insert(users)
      .values({
        email: "admin@erp.com",
        name: "Admin General",
        password: hashedPassword,
      })
      .returning();

    await db.insert(usersRoles).values({
      userId: adminUser.id,
      roleId: adminRole.id,
    });

    // 3. Seed Branches
    console.log("🏢 Seeding Branches...");
    const seededBranches = await db
      .insert(branches)
      .values([
        {
          name: "Sucursal Caracas",
          address: "Av. Francisco de Miranda",
          isActive: true,
        },
        {
          name: "Sucursal Valencia",
          address: "Av. Bolívar Norte",
          isActive: true,
        },
      ])
      .returning();

    // Link user to all branches
    for (const branch of seededBranches) {
      await db.insert(usersBranches).values({
        userId: adminUser.id,
        branchId: branch.id,
        isDefault: branch.name === "Sucursal Caracas",
      });
    }

    // 4. Per Branch Financial Data
    for (const branch of seededBranches) {
      console.log(`💰 Seeding Financial Data for ${branch.name}...`);

      // 4.1 Currencies
      const [usd, ves] = await db
        .insert(currencies)
        .values([
          {
            code: "USD",
            name: "Dólar Estadounidense",
            symbol: "$",
            isBase: false,
            branchId: branch.id,
          },
          {
            code: "VES",
            name: "Bolívar Digital",
            symbol: "Bs.",
            isBase: true,
            branchId: branch.id,
          },
        ])
        .returning();

      // 4.2 Initial Exchange Rate
      await db.insert(exchangeRates).values({
        currencyId: usd.id,
        branchId: branch.id,
        rate: "45.5000000000",
        source: "BCV",
      });

      // 4.3 Payment Methods
      await db.insert(paymentMethods).values([
        {
          name: "Efectivo USD",
          code: "CASH_USD",
          currencyId: usd.id,
          branchId: branch.id,
          isDigital: false,
        },
        {
          name: "Efectivo Bs",
          code: "CASH_VES",
          currencyId: ves.id,
          branchId: branch.id,
          isDigital: false,
        },
        {
          name: "Punto de Venta",
          code: "POS",
          currencyId: ves.id,
          branchId: branch.id,
          isDigital: true,
        },
        {
          name: "Pago Móvil",
          code: "PAGO_MOVIL",
          currencyId: ves.id,
          branchId: branch.id,
          isDigital: true,
        },
        {
          name: "Transferencia en Bs",
          code: "TRANSFERENCIA_VES",
          currencyId: ves.id,
          branchId: branch.id,
          isDigital: true,
        },
        {
          name: "Transferencia en $",
          code: "TRANSFERENCIA_USD",
          currencyId: usd.id,
          branchId: branch.id,
          isDigital: true,
        },
        // --- RETENCIONES ---
        {
          name: "Retención IVA 75%",
          code: "RET_IVA_75",
          currencyId: ves.id,
          branchId: branch.id,
          isDigital: true,
        },
        {
          name: "Retención IVA 100%",
          code: "RET_IVA_100",
          currencyId: ves.id,
          branchId: branch.id,
          isDigital: true,
        },
        {
          name: "Retención ISLR",
          code: "RET_ISLR",
          currencyId: ves.id, // Usually handled in Base Currency
          branchId: branch.id,
          isDigital: true,
        },
      ]);

      // 4.4 Bank Accounts
      await db.insert(bankAccounts).values([
        {
          name: `Caja Principal USD - ${branch.name.split(" ")[1]}`,
          type: "CASH",
          currencyId: usd.id,
          branchId: branch.id,
          currentBalance: "1000.00",
        },
        {
          name: `Caja Principal Bs - ${branch.name.split(" ")[1]}`,
          type: "CASH",
          currencyId: ves.id,
          branchId: branch.id,
          currentBalance: "5000.00",
        },
        {
          name: `Banesco Empresa - ${branch.name.split(" ")[1]}`,
          type: "CHECKING",
          currencyId: ves.id,
          branchId: branch.id,
          currentBalance: "25000.00",
        },
      ]);
    }

    console.log("✅ Seeding completed successfully!");
    process.exit(0);
  } catch (error) {
    console.error("❌ Seeding failed:", error);
    process.exit(1);
  }
}

main();
