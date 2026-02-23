import "./load-env";
import {
  db,
  users,
  currencies,
  paymentMethods,
  roles,
  usersRoles,
  bankAccounts,
  branches,
  usersBranches,
  exchangeRates,
  banks,
  permissions,
  rolesPermissions,
  ALL_PERMISSIONS,
  DEFAULT_ROLES,
  // paymentMethodAccounts, // Add if needed
} from "../src";
import { sql, inArray, eq } from "drizzle-orm";
import * as bcrypt from "bcrypt";
import * as dotenv from "dotenv";

import { seedBanks } from "./seed-banks";

export async function seed(isClean = true) {
  console.log("🚀 Seeding database with Multi-Branch Finance support...");

  try {
    if (isClean) {
      // Clean DB
      console.log("🧹 Cleaning tables...");
      await db.execute(
        sql`TRUNCATE TABLE users_roles, users, currencies, payment_methods, payment_method_accounts, employees, partners, branches, roles, organization_modules, user_app_settings, exchange_rates, warehouses, product_categories, products, stock, inventory_moves, inventory_move_lines, invoices, invoice_items, payments, loans, loan_items, payroll_runs, payroll_items, payroll_item_lines, credit_notes, credit_note_items, bank_accounts, payment_allocations, users_branches, tax_concepts, tax_retentions, tax_retention_lines, job_positions, orders, order_items, banks, departments, employee_salary_history, payroll_settings CASCADE`,
      );
    }

    // 1. Seed Permissions
    console.log("🔐 Seeding Permissions...");
    for (const perm of ALL_PERMISSIONS) {
      await db
        .insert(permissions)
        .values({
          code: perm.code,
          description: perm.description,
          module: perm.module,
        })
        .onConflictDoUpdate({
          target: permissions.code,
          set: {
            description: perm.description,
            module: perm.module,
          },
        });
    }

    // 2. Seed Roles & Assign Permissions
    console.log("👥 Seeding Roles & Permissions...");
    const createdRoles: Record<string, any> = {};

    for (const [roleKey, roleDef] of Object.entries(DEFAULT_ROLES)) {
      console.log(`   - Processing Role: ${roleDef.name}`);

      // Upsert Role
      const [role] = await db
        .insert(roles)
        .values({
          name: roleDef.name,
          description: roleDef.description,
        })
        .onConflictDoUpdate({
          target: roles.name,
          set: { description: roleDef.description },
        })
        .returning();

      createdRoles[roleDef.name] = role;

      // Assign Permissions
      if (roleDef.permissions.length > 0) {
        // Find IDs for these permission codes
        const permsToAssign = await db
          .select({ id: permissions.id })
          .from(permissions)
          .where(inArray(permissions.code, roleDef.permissions));

        if (permsToAssign.length > 0) {
          // Clear existing permissions for this role to ensure sync
          await db
            .delete(rolesPermissions)
            .where(eq(rolesPermissions.roleId, role.id));

          // Insert new links
          await db
            .insert(rolesPermissions)
            .values(
              permsToAssign.map((p) => ({
                roleId: role.id,
                permissionId: p.id,
              })),
            )
            .onConflictDoNothing();
        }
      }
    }

    const adminRole = createdRoles["admin"]; // Grab admin role for user assignment

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
          address: "Av. Francisco de Miranda, Edif. Torre Platinum, Piso 5",
          taxId: "J-12345678-0",
          phone: "+58 212 555-1234",
          email: "caracas@erp.com",
          isActive: true,
        },
        {
          name: "Sucursal Valencia",
          address: "Av. Bolívar Norte, C.C. La Viña, Local 10",
          taxId: "J-12345678-1",
          phone: "+58 241 555-4321",
          email: "valencia@erp.com",
          isActive: true,
        },
      ])
      .returning();

    // 3.5 Seed Banks
    await seedBanks();

    // Link user to all branches
    for (const branch of seededBranches) {
      await db.insert(usersBranches).values({
        userId: adminUser.id,
        branchId: branch.id,
        isDefault: branch.name === "Sucursal Caracas",
      });
    }

    // 4. Global Currencies & Rates
    console.log("💰 Seeding Global Financial Data...");
    const [usd, ves] = await db
      .insert(currencies)
      .values([
        {
          code: "USD",
          name: "Dólar Estadounidense",
          symbol: "$",
          isBase: true,
        },
        {
          code: "VES",
          name: "Bolívar Digital",
          symbol: "Bs",
          isBase: false,
        },
      ])
      .returning();

    // 4.1 Initial Exchange Rate
    await db.insert(exchangeRates).values({
      currencyId: ves.id,
      rate: "352.7063000000",
      source: "MANUAL_WIDGET",
    });

    const seededAccounts: any[] = [];
    const seededMethods: any[] = [];

    // 4.2 Per Branch Financial Data
    for (const branch of seededBranches) {
      console.log(`🏦 Seeding Branch Data for ${branch.name}...`);

      // 4.3 Payment Methods
      const methods = await db
        .insert(paymentMethods)
        .values([
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
            branchId: branch.id,
            isDigital: true,
          },
          // --- CREDIT NOTE / BALANCE ---
          {
            name: "Uso de Saldo a Favor ($)",
            code: "BALANCE_USD",
            currencyId: usd.id,
            branchId: branch.id,
            isDigital: true,
          },
          {
            name: "Uso de Saldo a Favor (Bs)",
            code: "BALANCE_VES",
            currencyId: ves.id,
            branchId: branch.id,
            isDigital: true,
          },
        ])
        .returning();
      seededMethods.push(...methods);

      // 4.4 Bank Accounts
      const accounts = await db
        .insert(bankAccounts)
        .values([
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
        ])
        .returning();
      seededAccounts.push(...accounts);
    }

    // Return Seed Data for Tests
    return {
      adminUser,
      branches: seededBranches,
      currencies: { usd, ves },
      paymentMethods: seededMethods,
      bankAccounts: seededAccounts,
      roles: createdRoles,
    };
  } catch (error) {
    console.error("❌ Seeding failed:", error);
    process.exit(1);
  }
}

// Auto-run if main module
if (require.main === module) {
  seed(true).then(() => {
    console.log("✅ Seeding completed successfully!");
    process.exit(0);
  });
}
