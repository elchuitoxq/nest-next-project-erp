import "./load-env";
import {
  db,
  users,
  roles,
  usersRoles,
  branches,
  usersBranches,
  currencies,
  exchangeRates,
  paymentMethods,
  bankAccounts,
  partners,
  productCategories,
  products,
  warehouses,
  stock,
  inventoryMoves,
  inventoryMoveLines,
  orders,
  orderItems,
  invoices,
  invoiceItems,
  payments,
  paymentAllocations,
  paymentMethodAccounts,
  jobPositions,
  employees,
  departments,
  // New tables for complete seed
  taxConcepts,
  creditNotes,
  creditNoteItems,
  taxRetentions,
  taxRetentionLines,
  loans,
  loanItems,
  organizationModules,
  banks,
  payrollRuns,
  payrollItems,
  payrollItemLines,
  payrollConceptTypes,
  payrollIncidents,
  payrollSettings,
  accountingAccounts,
  accountingEntries,
  accountingEntryLines,
  auditLogs,
  documentLinks,
  accountingMaps,
  productBatches,
} from "../src";
import { sql, eq } from "drizzle-orm";
import * as bcrypt from "bcrypt";
import * as dotenv from "dotenv";
import { faker } from "@faker-js/faker";
import { seed } from "./seed";

dotenv.config({ path: "../src/.env" });

// Helper for random numeric strings (money)
const randomMoney = (min: number, max: number) =>
  faker.number.float({ min, max, fractionDigits: 2 }).toString();

// Elegant Logger Utility
const Logger = {
  section: (title: string) => {
    console.log("\n" + "=".repeat(80));
    console.log(` 🚀 ${title.toUpperCase()}`);
    console.log("=".repeat(80) + "\n");
  },
  success: (msg: string) => console.log(`   ✅ ${msg}`),
  info: (msg: string) => console.log(`   🔹 ${msg}`),
  step: (level: string, title: string) =>
    console.log(`\n📦 [${level}] ${title}...`),
  error: (msg: string) => console.log(`   ❌ ERROR: ${msg}`),
};

async function main() {
  Logger.section("Starting E2E Multi-Currency Seed (Transversal)");

  try {
    // 1. RUN BASIC SEED (Infrastructure)
    const baseData = await seed(true); // Clean = true

    const allBanks = await db.select().from(banks);

    const {
      adminUser,
      branches: seededBranches,
      currencies: { usd, ves },
    } = baseData;

    // Alias for code clarity
    const currUSD = usd;
    const currVES = ves;
    const branchCCS = seededBranches.find((b) => b.name.includes("Caracas"))!;
    const branchVAL = seededBranches.find((b) => b.name.includes("Valencia"))!;

    // Fetch master roles
    const allRoles = await db.select().from(roles);
    const roleSeller = allRoles.find((r) => r.name === "seller")!;
    const roleWarehouse = allRoles.find((r) => r.name === "warehouse")!;
    const roleTreasury = allRoles.find((r) => r.name === "accountant")!;

    // =================================================================================
    // LEVEL 1: SETUP (Users, Accounts, Rates)
    // =================================================================================
    console.log("👥 [L1] Setting up Users & Accounts...");

    // Create extra users
    const password = await bcrypt.hash("admin123", 10);
    const usersData = [
      {
        email: "ventas.ccs@erp.com",
        name: "Vendedor Caracas",
        role: roleSeller,
        branch: branchCCS,
      },
      {
        email: "almacen.val@erp.com",
        name: "Jefe Almacén Val",
        role: roleWarehouse,
        branch: branchVAL,
      },
      {
        email: "tesoreria@erp.com",
        name: "Tesorero General",
        role: roleTreasury,
        branch: branchCCS,
      },
    ];

    for (const u of usersData) {
      const [newUser] = await db
        .insert(users)
        .values({
          email: u.email,
          name: u.name,
          password: password,
        })
        .returning();
      await db
        .insert(usersRoles)
        .values({ userId: newUser.id, roleId: u.role.id });
      await db
        .insert(usersBranches)
        .values({ userId: newUser.id, branchId: u.branch.id, isDefault: true });
      // Add secondary branch for treasurer
      if (u.role.name === "accountant") {
        await db.insert(usersBranches).values({
          userId: newUser.id,
          branchId: branchVAL.id,
          isDefault: false,
        });
      }
    }

    // Wallets & Accounts (Zelle, Cash)
    const allMethods = await db.select().from(paymentMethods);
    const seededAccounts = await db.select().from(bankAccounts);

    for (const b of [branchCCS, branchVAL]) {
      // Ensure Wallet Account
      const [wallet] = await db
        .insert(bankAccounts)
        .values({
          name: `Zelle Corp - ${b.name.split(" ")[1]}`,
          type: "WALLET",
          currencyId: currUSD.id,
          branchId: b.id,
          currentBalance: "5000.00",
        })
        .returning();
      seededAccounts.push(wallet);

      const methodTransfUSD = allMethods.find(
        (m) => m.code === "TRANSFERENCIA_USD" && m.branchId === b.id,
      );
      if (methodTransfUSD) {
        await db.insert(paymentMethodAccounts).values({
          methodId: methodTransfUSD.id,
          bankAccountId: wallet.id,
        });
      }

      // Add accounting account for this bank
      await db.insert(accountingAccounts).values({
        code: `1.1.02.${wallet.id.substring(0, 4)}`,
        name: wallet.name,
        type: "ASSET",
        branchId: b.id,
      });
    }

    // Historical Rates (60 days)
    console.log("💰 [L2] Generating 60-Day Rate History...");
    const rateByDate = new Map<string, string>();
    const ratesData: any[] = [];
    const today = new Date();
    let currentRateNum = 352.7; // Starting point today

    for (let i = 0; i <= 60; i++) {
      const d = new Date();
      d.setDate(today.getDate() - i);
      const dateKey = d.toISOString().slice(0, 10);

      // Slight fluctuation
      if (i > 0) currentRateNum -= faker.number.float({ min: 0.1, max: 0.8 });

      const rateStr = currentRateNum.toFixed(4);
      rateByDate.set(dateKey, rateStr);

      if (i > 0) {
        // Today is already created by seed()
        ratesData.push({
          currencyId: currVES.id,
          rate: rateStr,
          date: d,
          source: "BCV",
        });
      }
    }
    await db.insert(exchangeRates).values(ratesData);

    // Master Data
    console.log("📦 [L3] Creating Products & Partners...");

    // Partners
    const suppliers: any[] = [];
    const customers: any[] = [];
    for (let i = 0; i < 5; i++) {
      const [p] = await db
        .insert(partners)
        .values({
          name: faker.company.name(),
          taxId: `J-${faker.string.numeric(8)}-${faker.string.numeric(1)}`,
          email: faker.internet.email(),
          type: "SUPPLIER",
          taxpayerType: "ORDINARY",
          address: faker.location.streetAddress(),
        })
        .returning();
      suppliers.push(p);
    }
    for (let i = 0; i < 10; i++) {
      const [p] = await db
        .insert(partners)
        .values({
          name: faker.person.fullName(),
          taxId: `V-${faker.string.numeric(8)}`,
          type: "CUSTOMER",
          taxpayerType: Math.random() > 0.8 ? "SPECIAL" : "ORDINARY",
          address: faker.location.city(),
        })
        .returning();
      customers.push(p);
    }

    // Products (Priced in USD)
    const [catTech] = await db
      .insert(productCategories)
      .values([{ name: "Tecnología", description: "General" }])
      .returning();
    const productsData: any[] = [];
    for (let i = 0; i < 20; i++) {
      const cost = parseFloat(randomMoney(50, 800));
      const price = cost * 1.4; // 40% margin
      const [prod] = await db
        .insert(products)
        .values({
          sku: `PROD-${faker.string.alphanumeric(4).toUpperCase()}`,
          name: faker.commerce.productName(),
          categoryId: catTech.id,
          type: "PHYSICAL",
          currencyId: currUSD.id,
          cost: cost.toFixed(2),
          price: price.toFixed(2),
          taxRate: "16.00",
        })
        .returning();
      productsData.push(prod);
    }

    // =================================================================================
    // NEW: TAX CONCEPTS (Catálogo Fiscal Venezolano)
    // =================================================================================
    console.log("📋 [L3.1] Creating Tax Concepts...");

    const taxConceptsData = await db
      .insert(taxConcepts)
      .values([
        {
          code: "001",
          name: "Honorarios Profesionales (Personas Naturales)",
          retentionPercentage: "3.00",
          baseMin: "0",
          sustraendo: "0",
        },
        {
          code: "002",
          name: "Honorarios Profesionales (Personas Jurídicas)",
          retentionPercentage: "5.00",
          baseMin: "0",
          sustraendo: "0",
        },
        {
          code: "003",
          name: "Comisiones Mercantiles",
          retentionPercentage: "5.00",
          baseMin: "0",
          sustraendo: "0",
        },
        {
          code: "004",
          name: "Servicios de Transporte",
          retentionPercentage: "1.00",
          baseMin: "0",
          sustraendo: "0",
        },
        {
          code: "005",
          name: "Servicios Generales",
          retentionPercentage: "2.00",
          baseMin: "0",
          sustraendo: "0",
        },
        {
          code: "006",
          name: "Arrendamiento de Bienes Inmuebles",
          retentionPercentage: "5.00",
          baseMin: "0",
          sustraendo: "0",
        },
        {
          code: "007",
          name: "Publicidad y Propaganda",
          retentionPercentage: "5.00",
          baseMin: "0",
          sustraendo: "0",
        },
        {
          code: "008",
          name: "Pagos a Contratistas",
          retentionPercentage: "2.00",
          baseMin: "0",
          sustraendo: "0",
        },
      ])
      .returning();

    console.log(`   ✅ Created ${taxConceptsData.length} tax concepts`);

    // =================================================================================
    // NEW: JOB POSITIONS (Cargos con Tabulador Salarial)
    // =================================================================================
    console.log("💼 [L3.2] Creating Job Positions...");

    const jobPositionsData = await db
      .insert(jobPositions)
      .values([
        {
          name: "Gerente General",
          description: "Dirección general de la empresa",
          currencyId: currUSD.id,
          baseSalaryMin: "2000.00",
          baseSalaryMax: "5000.00",
        },
        {
          name: "Gerente de Ventas",
          description: "Dirección del equipo comercial",
          currencyId: currUSD.id,
          baseSalaryMin: "1200.00",
          baseSalaryMax: "2500.00",
        },
        {
          name: "Contador",
          description: "Gestión contable y fiscal",
          currencyId: currUSD.id,
          baseSalaryMin: "800.00",
          baseSalaryMax: "1500.00",
        },
        {
          name: "Vendedor",
          description: "Atención al cliente y ventas",
          currencyId: currUSD.id,
          baseSalaryMin: "400.00",
          baseSalaryMax: "800.00",
        },
        {
          name: "Almacenista",
          description: "Gestión de inventario y almacén",
          currencyId: currUSD.id,
          baseSalaryMin: "350.00",
          baseSalaryMax: "600.00",
        },
        {
          name: "Analista Administrativo",
          description: "Soporte administrativo general",
          currencyId: currUSD.id,
          baseSalaryMin: "500.00",
          baseSalaryMax: "900.00",
        },
        {
          name: "Cajero",
          description: "Manejo de caja y cobros",
          currencyId: currUSD.id,
          baseSalaryMin: "350.00",
          baseSalaryMax: "550.00",
        },
      ])
      .returning();

    console.log(`   ✅ Created ${jobPositionsData.length} job positions`);

    // =================================================================================
    // NEW: DEPARTMENTS (Departamentos)
    // =================================================================================
    console.log("🏛️ [L3.2.5] Creating Departments...");

    const departmentsData = await db
      .insert(departments)
      .values([
        { name: "Administración", branchId: branchCCS.id },
        { name: "Ventas", branchId: branchCCS.id },
        { name: "Almacén", branchId: branchCCS.id },
        { name: "Contabilidad", branchId: branchCCS.id },
        { name: "Recursos Humanos", branchId: branchCCS.id },
        { name: "Administración", branchId: branchVAL.id },
        { name: "Ventas", branchId: branchVAL.id },
        { name: "Almacén", branchId: branchVAL.id },
      ])
      .returning();

    console.log(`   ✅ Created ${departmentsData.length} departments`);

    // =================================================================================
    // NEW: ACCOUNTING COA (Plan de Cuentas)
    // =================================================================================
    console.log("📊 [L3.2.6] Creating Accounting COA...");

    const coaData = [
      {
        code: "5.1.01.01",
        name: "Sueldos y Salarios",
        type: "EXPENSE",
        branchId: branchCCS.id,
      },
      {
        code: "5.1.01.01",
        name: "Sueldos y Salarios",
        type: "EXPENSE",
        branchId: branchVAL.id,
      },
      {
        code: "2.1.04.01",
        name: "Retenciones y Aportes por Pagar",
        type: "LIABILITY",
        branchId: branchCCS.id,
      },
      {
        code: "2.1.04.01",
        name: "Retenciones y Aportes por Pagar",
        type: "LIABILITY",
        branchId: branchVAL.id,
      },
    ];

    await db.insert(accountingAccounts).values(coaData);
    console.log(`   ✅ Created ${coaData.length} base accounting accounts`);

    // =================================================================================
    // NEW: EMPLOYEES (Empleados)
    // =================================================================================
    console.log("👷 [L3.3] Creating Employees...");

    const employeesData: any[] = [];
    const ccsDepartments = departmentsData.filter(
      (d) => d.branchId === branchCCS.id,
    );
    const valDepartments = departmentsData.filter(
      (d) => d.branchId === branchVAL.id,
    );

    for (let i = 0; i < 12; i++) {
      const position = faker.helpers.arrayElement(jobPositionsData);
      const minSalary = parseFloat(position.baseSalaryMin || "400");
      const maxSalary = parseFloat(position.baseSalaryMax || "800");
      const salary = faker.number.float({
        min: minSalary,
        max: maxSalary,
        fractionDigits: 2,
      });

      const paymentMethod = faker.helpers.arrayElement([
        "BANK_TRANSFER",
        "CASH",
      ]);
      const bank =
        paymentMethod === "BANK_TRANSFER"
          ? faker.helpers.arrayElement(allBanks)
          : null;

      // Assign branch: first 8 to CCS, last 4 to VAL
      const branch = i < 8 ? branchCCS : branchVAL;
      const dept = faker.helpers.arrayElement(
        branch.id === branchCCS.id ? ccsDepartments : valDepartments,
      );

      const [emp] = await db
        .insert(employees)
        .values({
          firstName: faker.person.firstName(),
          lastName: faker.person.lastName(),
          identityCard: `V-${faker.string.numeric(8)}`,
          email: faker.internet.email(),
          phone: `+58 4${faker.string.numeric(2)}-${faker.string.numeric(7)}`,
          positionId: position.id,
          departmentId: dept.id,
          branchId: branch.id,
          hireDate: faker.date.past({ years: 3 }),
          salaryCurrencyId: currUSD.id,
          baseSalary: salary.toFixed(2),
          payFrequency: faker.helpers.arrayElement(["BIWEEKLY", "MONTHLY"]),
          paymentMethod: paymentMethod,
          bankId: bank?.id,
          // Legacy Fields (for compatibility view)
          bankName: bank?.name || "",
          accountNumber:
            paymentMethod === "BANK_TRANSFER"
              ? `0${faker.string.numeric(19)}`
              : "",
          accountType: faker.helpers.arrayElement(["CHECKING", "SAVINGS"]),
          status: "ACTIVE",
        })
        .returning();

      employeesData.push(emp);
    }

    console.log(`   ✅ Created ${employeesData.length} employees`);

    // =================================================================================
    // NEW: ORGANIZATION MODULES (Módulos habilitados por sucursal)
    // =================================================================================
    console.log("🔧 [L3.4] Creating Organization Modules...");

    const moduleKeys = [
      "sales",
      "purchases",
      "inventory",
      "treasury",
      "hr",
      "reports",
      "bi",
    ];
    for (const branch of [branchCCS, branchVAL]) {
      for (const moduleKey of moduleKeys) {
        await db.insert(organizationModules).values({
          moduleKey,
          isEnabled: true,
          branchId: branch.id,
        });
      }
    }
    console.log(`   ✅ Enabled ${moduleKeys.length} modules per branch`);

    // Warehouses
    const whCCS = await db
      .insert(warehouses)
      .values({
        name: "Almacén CCS Principal",
        branchId: branchCCS.id,
        address: "Caracas",
      })
      .returning();
    const whVAL = await db
      .insert(warehouses)
      .values({
        name: "Almacén VAL Principal",
        branchId: branchVAL.id,
        address: "Valencia",
      })
      .returning();
    const warehousesList = [whCCS[0], whVAL[0]];

    // =================================================================================
    // LEVEL 4: PROCUREMENT CYCLE (Purchases)
    // =================================================================================
    Logger.step("L4", "Executing Purchase Cycle (Restocking)");

    for (let i = 0; i < 30; i++) {
      const branch = i % 2 === 0 ? branchCCS : branchVAL;
      const wh = i % 2 === 0 ? whCCS[0] : whVAL[0];
      const supplier = faker.helpers.arrayElement(suppliers);

      // Purchase Date (Past 30-60 days)
      const date = faker.date.recent({
        days: 30,
        refDate: new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000),
      });
      const dateKey = date.toISOString().slice(0, 10);
      const rate = rateByDate.get(dateKey) || "350.00";

      // 1. Create Purchase Order
      // Scenario: Purchase in USD (Import) or VES (National)
      const isImport = Math.random() > 0.5;
      const currency = isImport ? currUSD : currVES;
      const orderConfigCode = `OC-${(i + 1).toString().padStart(5, "0")}`; // Sequential OC
      const [order] = await db
        .insert(orders)
        .values({
          code: orderConfigCode,
          partnerId: supplier.id,
          branchId: branch.id,
          warehouseId: wh.id,
          userId: adminUser.id,
          status: "CONFIRMED", // Directly Confirmed to move stock
          type: "PURCHASE",
          currencyId: currency.id || "",
          exchangeRate: rate,
          date: date,
          total: "0", // Will update
        } as any)
        .returning();

      // Order Items
      let totalOrder = 0;
      const itemsCount = faker.number.int({ min: 3, max: 8 });
      const orderLines: any[] = [];

      for (let j = 0; j < itemsCount; j++) {
        const prod = faker.helpers.arrayElement(productsData);
        const qty = faker.number.int({ min: 100, max: 300 });

        // Cost calculation
        let unitCost = parseFloat(prod.cost!);
        if (currency.id === currVES.id) {
          unitCost = unitCost * parseFloat(rate); // Convert to VES
        }

        const lineTotal = unitCost * qty;
        totalOrder += lineTotal;

        const isBatchTracked = prod.hasBatches === true;
        let batchId: string | null = null;

        if (isBatchTracked) {
          const [batch] = await db
            .insert(productBatches)
            .values({
              productId: prod.id,
              batchNumber: `BAT-${faker.string.numeric(5)}`,
              expirationDate: faker.date.future(),
              cost: unitCost.toFixed(2),
            })
            .returning();
          batchId = batch.id;
        }

        orderLines.push({
          orderId: order.id,
          productId: prod.id,
          quantity: qty.toString(),
          price: unitCost.toFixed(2), // In Purchase, price is cost
        });

        // Stock Movement (IN)
        const existingStock = await db.query.stock.findFirst({
          where: (stock, { and, eq }) =>
            and(
              eq(stock.warehouseId, wh.id),
              eq(stock.productId, prod.id),
              batchId
                ? eq(stock.batchId, batchId)
                : sql`${stock.batchId} IS NULL`,
            ),
        });
        if (existingStock) {
          await db
            .update(stock)
            .set({
              quantity: (
                parseFloat(existingStock.quantity || "0") + qty
              ).toString(),
            })
            .where(eq(stock.id, existingStock.id));
        } else {
          await db.insert(stock).values({
            warehouseId: wh.id,
            productId: prod.id,
            batchId: batchId as any,
            quantity: qty.toString(),
          });
        }
      }

      await db.insert(orderItems).values(orderLines);
      await db
        .update(orders)
        .set({ total: totalOrder.toFixed(2) })
        .where(eq(orders.id, order.id));

      // Inventory Move Record
      const [move] = await db
        .insert(inventoryMoves)
        .values({
          code: `MOV-IN-${order.code}-${faker.string.alphanumeric(4)}`,
          type: "IN",
          toWarehouseId: wh.id,
          branchId: branch.id,
          date: date,
          note: `Recepción Orden #${orderConfigCode}`,
          userId: adminUser.id,
        } as any)
        .returning(); // Explicit cast to avoid type issues with relations

      const moveLines = orderLines.map((l) => ({
        moveId: move.id,
        productId: l.productId,
        quantity: l.quantity,
        cost: l.price,
      }));
      await db.insert(inventoryMoveLines).values(moveLines);

      // 2. Generate Invoice (Bill)
      const totalBase = totalOrder;
      const totalTax = totalBase * 0.16;
      const totalInv = totalBase + totalTax;

      await db.insert(invoices).values({
        code: `C-${(i + 1).toString().padStart(5, "0")}`, // Sequential Purchase Invoice
        invoiceNumber: `CTRL-${faker.string.alphanumeric(10).toUpperCase()}`,
        partnerId: supplier.id,
        branchId: branch.id,
        currencyId: currency.id,
        exchangeRate: rate,
        type: "PURCHASE",
        status: "POSTED", // Debt created
        date: date,
        userId: adminUser.id,
        orderId: order.id,
        warehouseId: wh.id,
        totalBase: totalBase.toFixed(2),
        totalTax: totalTax.toFixed(2),
        total: totalInv.toFixed(2),
        totalIgtf: "0",
      });
    }

    // =================================================================================
    // LEVEL 5: SALES CYCLE (Sales)
    // =================================================================================
    console.log("🛒 [L5] Executing Sales Cycle (Revenue) - High Volume...");

    // Create 120 invoices to test pagination and date filtering
    for (let i = 0; i < 120; i++) {
      const branch = i % 2 === 0 ? branchCCS : branchVAL;
      const wh = i % 2 === 0 ? whCCS[0] : whVAL[0];
      const customer = faker.helpers.arrayElement(customers);

      // Date Distribution Logic:
      // Ensure we hit both fortnights: Days 1-15 and 16-30
      const dayOfMonth = (i % 30) + 1; // 1 to 30
      const date = new Date(today.getFullYear(), today.getMonth(), dayOfMonth);

      // ... (Time randomization)
      date.setHours(faker.number.int({ min: 8, max: 18 }));

      const dateKey = date.toISOString().slice(0, 10);
      const rate = rateByDate.get(dateKey) || "350.00"; // Fallback

      // Scenario: 60% USD (IGTF), 40% VES
      const isUSD = Math.random() > 0.4;
      const currency = isUSD ? currUSD : currVES;

      // FIX: Always use the Market Rate for the order header exchangeRate.
      // Even if the transaction is in VES (Fiscal Rate 1), we want to know
      // the market rate used for the price calculation (e.g. 350.00).
      // The Invoice entity splits Fiscal Rate vs Market Rate, but Order typically stores the calculation basis.
      // For simple seeding, we will store the Market Rate (350.00) so the Recalculate function has a reference.
      const invoiceRate = rate;

      // 1. Create Sale Order
      const saleOrderCode = `PED-${(i + 1).toString().padStart(5, "0")}`;
      const [order] = await db
        .insert(orders)
        .values({
          code: saleOrderCode,
          partnerId: customer.id,
          branchId: branch.id,
          warehouseId: wh.id,
          userId: adminUser.id,
          status: "CONFIRMED",
          type: "SALE",
          currencyId: currency.id || "",
          exchangeRate: invoiceRate,
          date: date,
          total: "0",
        } as any)
        .returning();

      let totalBase = 0;
      const itemsCount = faker.number.int({ min: 1, max: 5 });
      const orderLines: any[] = [];

      for (let j = 0; j < itemsCount; j++) {
        const prod = faker.helpers.arrayElement(productsData);
        const qty = faker.number.int({ min: 1, max: 5 });

        // Check Stock
        const existingStock = await db.query.stock.findFirst({
          where: (stock, { and, eq }) =>
            and(eq(stock.warehouseId, wh.id), eq(stock.productId, prod.id)),
        });

        let batchId: string | null = null;
        if (existingStock) {
          batchId = existingStock.batchId;
          const newQty = parseFloat(existingStock.quantity || "0") - qty;
          await db
            .update(stock)
            .set({ quantity: newQty.toString() })
            .where(eq(stock.id, existingStock.id));
        }

        // Price Logic
        let unitPrice = parseFloat(prod.price!);
        if (currency.id === currVES.id) {
          unitPrice = unitPrice * parseFloat(rate); // Convert USD Price to VES
        }

        const lineTotal = unitPrice * qty;
        totalBase += lineTotal;

        orderLines.push({
          orderId: order.id,
          productId: prod.id,
          batchId, // Store for move lines
          quantity: qty.toString(),
          price: unitPrice.toFixed(2),
        });
      }

      await db
        .insert(orderItems)
        .values(orderLines.map(({ batchId, ...rest }) => rest));
      await db
        .update(orders)
        .set({ total: totalBase.toFixed(2) })
        .where(eq(orders.id, order.id));

      // Inventory Out
      const [move] = await db
        .insert(inventoryMoves)
        .values({
          code: `MOV-OUT-${order.code}-${faker.string.alphanumeric(4)}`,
          type: "OUT",
          fromWarehouseId: wh.id,
          branchId: branch.id,
          date: date,
          note: `Despacho Pedido #${saleOrderCode}`,
          userId: adminUser.id,
        } as any)
        .returning();

      const moveLines = orderLines.map((l) => ({
        moveId: move.id,
        productId: l.productId,
        batchId: l.batchId,
        quantity: l.quantity,
        cost: "0", // Simplified
      }));
      await db.insert(inventoryMoveLines).values(moveLines);

      // 2. Invoice Generation
      const totalTax = totalBase * 0.16;
      let igtf = 0;

      // IGTF Logic: Only if USD
      if (isUSD) {
        igtf = (totalBase + totalTax) * 0.03;
      }

      const totalFinal = totalBase + totalTax + igtf;

      const [inv] = await db
        .insert(invoices)
        .values({
          code: `A-${(i + 1).toString().padStart(5, "0")}`, // Sequential Sale Invoice
          partnerId: customer.id,
          branchId: branch.id,
          currencyId: currency.id,
          exchangeRate: invoiceRate,
          type: "SALE",
          status: "POSTED",
          date: date,
          userId: adminUser.id,
          orderId: order.id,
          warehouseId: wh.id,
          totalBase: totalBase.toFixed(2),
          totalTax: totalTax.toFixed(2),
          totalIgtf: igtf.toFixed(2),
          total: totalFinal.toFixed(2),
        })
        .returning();

      // Invoice Items
      const invItems = orderLines.map((l) => ({
        invoiceId: inv.id,
        productId: l.productId,
        quantity: l.quantity,
        price: l.price,
        total: (parseFloat(l.price) * parseFloat(l.quantity)).toFixed(2),
        taxRate: "16.00",
      }));
      await db.insert(invoiceItems).values(invItems);

      // 3. Payment (80% Paid, 20% Debt)
      if (Math.random() > 0.2) {
        const methods = allMethods.filter((m) => m.branchId === branch.id);
        // If USD -> Zelle/Cash USD
        // If VES -> Transfer/PagoMovil
        let methodCode = isUSD ? "TRANSFERENCIA_USD" : "PAGO_MOVIL"; // Simplified selection
        let method = methods.find((m) => m.code === methodCode);
        if (!method) method = methods[0]; // Fallback

        // Account
        const accounts = seededAccounts.filter(
          (a) =>
            a.branchId === branch.id && a.currencyId === method?.currencyId,
        );
        const account = accounts[0];

        if (method && account) {
          const [pay] = await db
            .insert(payments)
            .values({
              invoiceId: inv.id,
              partnerId: customer.id,
              branchId: branch.id,
              methodId: method.id,
              bankAccountId: account.id,
              type: "INCOME",
              amount: totalFinal.toFixed(2), // Full payment
              currencyId: method.currencyId,
              exchangeRate: invoiceRate,
              reference: faker.finance.routingNumber(),
              date: date,
              userId: adminUser.id,
            } as any)
            .returning();

          await db.insert(paymentAllocations).values({
            paymentId: pay.id,
            invoiceId: inv.id,
            amount: totalFinal.toFixed(2),
          } as any);

          await db
            .update(invoices)
            .set({ status: "PAID" })
            .where(eq(invoices.id, inv.id));
        }
      }
    }

    // =================================================================================
    // LEVEL 6: CREDIT NOTES (Notas de Crédito)
    // =================================================================================
    console.log("📝 [L6] Creating Credit Notes...");

    // Fetch posted/paid sale invoices for credit notes
    const saleInvoices = await db.query.invoices.findMany({
      where: (inv, { and, eq, or }) =>
        and(
          eq(inv.type, "SALE"),
          or(eq(inv.status, "POSTED"), eq(inv.status, "PAID")),
        ),
      with: { items: true },
      limit: 15,
    });

    let creditNotesCreated = 0;
    for (let i = 0; i < Math.min(10, saleInvoices.length); i++) {
      const invoice = saleInvoices[i];
      if (!invoice.items || invoice.items.length === 0) continue;

      // Select 1-2 items for partial return
      const itemsToReturn = invoice.items.slice(
        0,
        Math.min(2, invoice.items.length),
      );

      // Calculate totals
      let ncTotalBase = 0;
      const ncItems: any[] = [];

      for (const item of itemsToReturn) {
        const returnQty = Math.ceil(Number(item.quantity) * 0.5); // Return 50%
        const price = Number(item.price);
        const itemTotal = price * returnQty;
        ncTotalBase += itemTotal;

        ncItems.push({
          productId: item.productId,
          quantity: returnQty.toString(),
          price: price.toFixed(2),
          total: itemTotal.toFixed(2),
        });
      }

      // Prorate tax and IGTF
      const refundRatio = ncTotalBase / Number(invoice.totalBase);
      const ncTotalTax = Number(invoice.totalTax) * refundRatio;
      const ncTotalIgtf = Number(invoice.totalIgtf) * refundRatio;
      const ncTotal = ncTotalBase + ncTotalTax + ncTotalIgtf;

      // Find warehouse for stock return
      const wh = invoice.branchId === branchCCS.id ? whCCS[0] : whVAL[0];

      const [nc] = await db
        .insert(creditNotes)
        .values({
          code: `NC-${faker.string.alphanumeric(6).toUpperCase()}`,
          invoiceId: invoice.id,
          partnerId: invoice.partnerId,
          branchId: invoice.branchId,
          currencyId: invoice.currencyId,
          exchangeRate: invoice.exchangeRate,
          warehouseId: wh.id,
          status: "POSTED",
          totalBase: ncTotalBase.toFixed(2),
          totalTax: ncTotalTax.toFixed(2),
          totalIgtf: ncTotalIgtf.toFixed(2),
          total: ncTotal.toFixed(2),
          date: faker.date.recent({ days: 15 }),
          userId: adminUser.id,
        })
        .returning();

      // Insert NC items
      for (const item of ncItems) {
        await db.insert(creditNoteItems).values({
          creditNoteId: nc.id,
          productId: item.productId,
          quantity: item.quantity,
          price: item.price,
          total: item.total,
        });

        // Return stock
        const existingStock = await db.query.stock.findFirst({
          where: (s, { and, eq }) =>
            and(eq(s.warehouseId, wh.id), eq(s.productId, item.productId)),
        });
        if (existingStock) {
          const newQty = Number(existingStock.quantity) + Number(item.quantity);
          await db
            .update(stock)
            .set({ quantity: newQty.toString() })
            .where(eq(stock.id, existingStock.id));
        } else {
          await db.insert(stock).values({
            warehouseId: wh.id,
            productId: item.productId,
            quantity: item.quantity,
          });
        }
      }

      creditNotesCreated++;
    }
    console.log(
      `   ✅ Created ${creditNotesCreated} credit notes with stock returns`,
    );

    // =================================================================================
    // LEVEL 7: TAX RETENTIONS (Retenciones Fiscales)
    // =================================================================================
    console.log("🧾 [L7] Creating Tax Retentions & Unified Payments...");

    // 1. Ensure Retention Payment Method exists
    let retMethod = allMethods.find((m) => m.code.startsWith("RET_IVA"));
    if (!retMethod) {
      // Create it if missing (Should be in base seed, but safety first)
      const [newM] = await db
        .insert(paymentMethods)
        .values({
          name: "Retención IVA 75%",
          code: "RET_IVA_75",
          branchId: branchCCS.id, // Assign to main branch
          currencyId: currVES.id,
          isDigital: false,
        })
        .returning();
      retMethod = newM;
    }

    // Fetch purchase invoices for retentions (from SPECIAL taxpayer suppliers)
    const purchaseInvoices = await db.query.invoices.findMany({
      where: (inv, { and, eq }) =>
        and(eq(inv.type, "PURCHASE"), eq(inv.status, "POSTED")),
      with: { partner: true },
      limit: 50, // Process more invoices
    });

    // Filter for special taxpayers (or just use all for demo)
    const specialPurchases = purchaseInvoices
      .filter(
        (inv) => inv.partner?.taxpayerType === "SPECIAL" || Math.random() > 0.3,
      )
      .slice(0, 30);

    let retentionsCreated = 0;
    const currentPeriod = new Date().toISOString().slice(0, 7).replace("-", ""); // YYYYMM

    for (const invoice of specialPurchases) {
      const retentionRate = 75; // 75% IVA retention for special taxpayers
      const taxAmount = Number(invoice.totalTax);
      const retainedAmount = (taxAmount * retentionRate) / 100;

      if (retainedAmount <= 0) continue;

      // 1. Create the Payment (Unified Path)
      // This reduces the debt of the invoice
      const [payment] = await db
        .insert(payments)
        .values({
          invoiceId: invoice.id,
          partnerId: invoice.partnerId,
          branchId: invoice.branchId,
          methodId: retMethod.id, // RET_IVA_75
          type: "EXPENSE", // Buying -> Paying with retention paper
          amount: retainedAmount.toFixed(2),
          currencyId: invoice.currencyId, // Usually VES for tax
          exchangeRate: invoice.exchangeRate,
          reference: `RET-${currentPeriod}-${faker.string.numeric(4)}`,
          date: invoice.date, // Same day or close
          userId: adminUser.id,
          metadata: { isRetention: true, type: "IVA" },
        } as any)
        .returning();

      // 2. Create the Fiscal Voucher
      const [retention] = await db
        .insert(taxRetentions)
        .values({
          code: `${currentPeriod}-${faker.string.numeric(4)}`,
          partnerId: invoice.partnerId,
          branchId: invoice.branchId,
          period: currentPeriod,
          type: "IVA",
          totalBase: invoice.totalBase,
          totalTax: taxAmount.toFixed(2),
          totalRetained: retainedAmount.toFixed(2),
          date: invoice.date,
          userId: adminUser.id,
        } as any)
        .returning();

      // 3. Insert retention line LINKED to Payment
      await db.insert(taxRetentionLines).values({
        retentionId: retention.id,
        invoiceId: invoice.id,
        paymentId: payment.id, // Critical Link
        baseAmount: invoice.totalBase,
        taxAmount: taxAmount.toFixed(2),
        retainedAmount: retainedAmount.toFixed(2),
      } as any);

      retentionsCreated++;
    }
    console.log(
      `   ✅ Created ${retentionsCreated} Unified Retentions (Voucher + Payment)`,
    );

    // =================================================================================
    // LEVEL 7.5: RECALCULATE BANK BALANCES
    // =================================================================================
    console.log("🏦 [L7.5] Reconciling Bank Account Balances...");

    // Logic: Balance = Initial + Sum(Income) - Sum(Expense)
    for (const account of seededAccounts) {
      // Fetch all payments for this account
      const accPayments = await db
        .select()
        .from(payments)
        .where(eq(payments.bankAccountId, account.id));

      let balance = parseFloat(account.currentBalance || "0");

      for (const p of accPayments) {
        const amount = parseFloat(p.amount);
        if (p.type === "INCOME") {
          balance += amount;
        } else {
          balance -= amount;
        }
      }

      await db
        .update(bankAccounts)
        .set({ currentBalance: balance.toFixed(2) })
        .where(eq(bankAccounts.id, account.id));

      console.log(`      > Account ${account.name}: ${balance.toFixed(2)}`);
    }
    console.log("   ✅ Bank balances synchronized with transaction history");

    // =================================================================================
    // LEVEL 8: LOANS (Préstamos de Productos)
    // =================================================================================
    console.log("📦 [L8] Creating Product Loans...");

    let loansCreated = 0;
    for (let i = 0; i < 8; i++) {
      const customer = faker.helpers.arrayElement(customers);
      const isReturned = Math.random() > 0.6;

      const [loan] = await db
        .insert(loans)
        .values({
          code: `PRE-${faker.string.numeric(5)}`,
          partnerId: customer.id,
          status: isReturned ? "RETURNED" : "ACTIVE",
          startDate: faker.date.recent({ days: 30 }),
          dueDate: faker.date.soon({ days: 30 }),
          returnDate: isReturned ? faker.date.recent({ days: 5 }) : null,
          notes: faker.lorem.sentence(),
        })
        .returning();

      // Add 1-3 loan items
      const itemsCount = faker.number.int({ min: 1, max: 3 });
      for (let j = 0; j < itemsCount; j++) {
        const prod = faker.helpers.arrayElement(productsData);
        await db.insert(loanItems).values({
          loanId: loan.id,
          productId: prod.id,
          quantity: faker.number.int({ min: 1, max: 5 }).toString(),
          serialNumber:
            Math.random() > 0.5
              ? `SN-${faker.string.alphanumeric(8).toUpperCase()}`
              : null,
          condition: faker.helpers.arrayElement([
            "GOOD",
            "GOOD",
            "GOOD",
            "DAMAGED",
          ]),
        });
      }

      loansCreated++;
    }
    console.log(`   ✅ Created ${loansCreated} product loans`);

    // =================================================================================
    // LEVEL 8.5: PAYROLL CONCEPTS & INCIDENTS (Novedades)
    // =================================================================================
    console.log("⚡ [L8.5] Creating Payroll Concepts & Incidents...");

    // 1. Concepts
    const [concBono] = await db
      .insert(payrollConceptTypes)
      .values({
        code: "BONO_PROD",
        name: "Bono de Productividad",
        category: "INCOME",
        branchId: branchCCS.id,
      } as any)
      .returning();

    const [concFalta] = await db
      .insert(payrollConceptTypes)
      .values({
        code: "FALTA_INJ",
        name: "Falta Injustificada",
        category: "DEDUCTION",
        branchId: branchCCS.id,
      } as any)
      .returning();

    const [concExtra] = await db
      .insert(payrollConceptTypes)
      .values({
        code: "H_EXTRA_D",
        name: "Hora Extra Diurna",
        category: "INCOME",
        branchId: branchCCS.id,
      } as any)
      .returning();

    // 2.5 Payroll Settings (Venezuelan contribution rates)
    await db.insert(payrollSettings).values([
      {
        key: "CESTATICKET_USD",
        label: "Cestaticket Socialista",
        value: "40.0000",
        type: "FIXED_USD",
      },
      {
        key: "SSO_EMP",
        label: "SSO (Empleado)",
        value: "4.0000",
        type: "PERCENTAGE",
      },
      {
        key: "SSO_PAT",
        label: "SSO (Patronal)",
        value: "9.0000",
        type: "PERCENTAGE",
      },
      {
        key: "FAOV_EMP",
        label: "FAOV (Empleado)",
        value: "1.0000",
        type: "PERCENTAGE",
      },
      {
        key: "FAOV_PAT",
        label: "FAOV (Patronal)",
        value: "2.0000",
        type: "PERCENTAGE",
      },
      {
        key: "INCE",
        label: "INCE (Patronal)",
        value: "2.0000",
        type: "PERCENTAGE",
      },
      {
        key: "LPH",
        label: "LPH - Régimen Penitenciario",
        value: "0.5000",
        type: "PERCENTAGE",
      },
    ] as any);
    console.log("   ✅ Payroll settings seeded");

    // 2. Incidents (For Current Month Draft)
    const currStartDate = new Date(today.getFullYear(), today.getMonth(), 1);
    const currEndDate = new Date(today.getFullYear(), today.getMonth(), 15);
    const incidentsData: any[] = [];

    // Assign random incidents
    for (const emp of employeesData) {
      // 30% chance of bonus
      if (Math.random() > 0.7) {
        const amount = faker.number.float({
          min: 20,
          max: 100,
          fractionDigits: 2,
        });
        const [inc] = await db
          .insert(payrollIncidents)
          .values({
            employeeId: emp.id,
            conceptId: concBono.id,
            date: faker.date.between({ from: currStartDate, to: currEndDate }),
            amount: amount.toFixed(2),
            status: "PENDING", // Will be processed in L9
            notes: "Cumplimiento de meta mensual",
          })
          .returning();
        incidentsData.push(inc);
      }

      // 10% chance of deduction
      if (Math.random() > 0.9) {
        const amount = faker.number.float({
          min: 10,
          max: 50,
          fractionDigits: 2,
        });
        const [inc] = await db
          .insert(payrollIncidents)
          .values({
            employeeId: emp.id,
            conceptId: concFalta.id,
            date: faker.date.between({ from: currStartDate, to: currEndDate }),
            amount: amount.toFixed(2),
            status: "PENDING",
            notes: "Ausencia día lunes",
          })
          .returning();
        incidentsData.push(inc);
      }
    }
    console.log(`   ✅ Created ${incidentsData.length} payroll incidents`);

    // =================================================================================
    // LEVEL 9: PAYROLL & HR (Nómina)
    // =================================================================================
    console.log("👥 [L9] Creating Payroll Runs...");

    // 1. Paid Payroll (Previous Month)
    const prevMonthDate = new Date(today);
    prevMonthDate.setMonth(today.getMonth() - 1);
    const prevStartDate = new Date(
      prevMonthDate.getFullYear(),
      prevMonthDate.getMonth(),
      1,
    );
    const prevEndDate = new Date(
      prevMonthDate.getFullYear(),
      prevMonthDate.getMonth(),
      15,
    );

    const [paidRun] = await db
      .insert(payrollRuns)
      .values({
        code: `NOM-${prevStartDate.toISOString().slice(0, 7)}-Q1`,
        branchId: branchCCS.id,
        frequency: "BIWEEKLY",
        currencyId: currVES.id,
        startDate: prevStartDate,
        endDate: prevEndDate,
        status: "PAID",
        totalAmount: "0", // Will update
      } as any)
      .returning();

    // 2. Draft Payroll (Current Month)
    const [draftRun] = await db
      .insert(payrollRuns)
      .values({
        code: `NOM-${currStartDate.toISOString().slice(0, 7)}-Q1`,
        branchId: branchCCS.id,
        frequency: "BIWEEKLY",
        currencyId: currVES.id,
        startDate: currStartDate,
        endDate: currEndDate,
        status: "DRAFT",
        totalAmount: "0",
      } as any)
      .returning();

    // Generate Items for Draft Run
    let totalDraft = 0;
    const rateVes = 36.5; // Fixed for seed simplicity or fetch from history

    for (const emp of employeesData) {
      if (emp.payFrequency !== "BIWEEKLY") continue;

      const monthlySalary = parseFloat(emp.baseSalary); // In USD usually
      const salaryVes = monthlySalary * rateVes;
      const biweeklyVes = salaryVes / 2;
      const cestaticketVes = (40 * rateVes) / 2; // Half cestaticket

      // Process Incidents for this employee
      let incidentIncome = 0;
      let incidentDeduction = 0;
      const empIncidents = incidentsData.filter(
        (inc) => inc.employeeId === emp.id,
      );

      for (const inc of empIncidents) {
        // Convert incident amount (assumed USD for seed simplicity) to VES
        // In real app, incidents should store currency or be in base currency.
        // Let's assume incidents are in USD for this seed logic
        const amountVes = parseFloat(inc.amount) * rateVes;

        // Check concept type (We know IDs from creation)
        if (inc.conceptId === concBono.id || inc.conceptId === concExtra.id) {
          incidentIncome += amountVes;
        } else {
          incidentDeduction += amountVes;
        }

        // Update Incident status
        await db
          .update(payrollIncidents)
          .set({
            status: "PROCESSED",
            processedInRunId: draftRun.id,
          })
          .where(eq(payrollIncidents.id, inc.id));
      }

      // Legal Deductions (Social Security, etc.)
      const sso = biweeklyVes * 0.04;
      const faov = biweeklyVes * 0.01;
      const rpe = biweeklyVes * 0.005;
      const legalDeductions = sso + faov + rpe;

      const totalBonuses = cestaticketVes + incidentIncome;
      const totalDeductions = incidentDeduction + legalDeductions;
      const netTotal = biweeklyVes + totalBonuses - totalDeductions;

      totalDraft += netTotal;

      const [pItem] = await db
        .insert(payrollItems)
        .values({
          runId: draftRun.id,
          employeeId: emp.id,
          baseAmount: biweeklyVes.toFixed(2),
          bonuses: totalBonuses.toFixed(2),
          deductions: totalDeductions.toFixed(2),
          netTotal: netTotal.toFixed(2),
        })
        .returning();

      // Insert Detailed Lines for Payslip
      const lines: any[] = [];

      // 1. Base Salary
      lines.push({
        itemId: pItem.id,
        conceptName: "Sueldo Base",
        conceptCode: "SUELDO_BASE",
        category: "INCOME",
        amount: biweeklyVes.toFixed(2),
        isFixed: true,
      });

      // 2. Cestaticket
      lines.push({
        itemId: pItem.id,
        conceptName: "Cestaticket Socialista",
        conceptCode: "CESTATICKET",
        category: "INCOME",
        amount: cestaticketVes.toFixed(2),
        isFixed: true,
      });

      // 3. Legal Deductions
      lines.push({
        itemId: pItem.id,
        conceptName: "SSO (4%)",
        conceptCode: "RET_SSO",
        category: "DEDUCTION",
        amount: sso.toFixed(2),
        rate: "0.04",
      });
      lines.push({
        itemId: pItem.id,
        conceptName: "FAOV (1%)",
        conceptCode: "RET_FAOV",
        category: "DEDUCTION",
        amount: faov.toFixed(2),
        rate: "0.01",
      });
      lines.push({
        itemId: pItem.id,
        conceptName: "RPE (0.5%)",
        conceptCode: "RET_RPE",
        category: "DEDUCTION",
        amount: rpe.toFixed(2),
        rate: "0.005",
      });

      // 4. Incidents
      for (const inc of empIncidents) {
        const amountVes = parseFloat(inc.amount) * rateVes;

        let conceptCode = "INCIDENTE";
        let isIncome = false;

        if (inc.conceptId === concBono.id) {
          conceptCode = concBono.code;
          isIncome = true;
        } else if (inc.conceptId === concExtra.id) {
          conceptCode = concExtra.code;
          isIncome = true;
        } else if (inc.conceptId === concFalta.id) {
          conceptCode = concFalta.code;
          isIncome = false;
        }

        lines.push({
          itemId: pItem.id,
          conceptName: inc.notes || "Novedad de Nómina",
          conceptCode: conceptCode,
          category: isIncome ? "INCOME" : "DEDUCTION",
          amount: amountVes.toFixed(2),
        });
      }

      await db.insert(payrollItemLines).values(lines);
    }

    await db
      .update(payrollRuns)
      .set({ totalAmount: totalDraft.toFixed(2) })
      .where(eq(payrollRuns.id, draftRun.id));
    console.log(
      "   ✅ Created sample Payroll Runs (Paid & Draft with Incidents)",
    );

    // =================================================================================
    // LEVEL 10: CREDIT NOTES & BALANCE (Positive Balance)
    // =================================================================================
    console.log("💳 [L10] Creating Credit Notes (Positive Balance)...");

    const targetCustomer = customers[0]; // Pick first customer

    // 1. Credit Note in USD ($250.00)
    const [cnUSD] = await db
      .insert(creditNotes)
      .values({
        code: `NC-${faker.string.alphanumeric(8).toUpperCase()}`,
        partnerId: targetCustomer.id,
        branchId: branchCCS.id,
        currencyId: currUSD.id,
        exchangeRate: "1.000000",
        status: "POSTED",
        date: new Date(),
        reason: "Devolución de mercancía (Ejemplo)",
        subtotal: "250.00",
        totalTax: "0.00",
        total: "250.00",
        userId: adminUser.id,
      } as any)
      .returning();

    await db.insert(creditNoteItems).values({
      creditNoteId: cnUSD.id,
      productId: productsData[0].id, // Use first product as placeholder
      description: "Saldo a favor inicial",
      quantity: "1",
      price: "250.00",
      total: "250.00",
      taxRate: "0.00",
    });

    console.log(
      `   ✅ Created USD Credit Note for ${targetCustomer.name}: $250.00`,
    );

    // 2. Credit Note in VES (Bs. 5000.00)
    const [cnVES] = await db
      .insert(creditNotes)
      .values({
        code: `NC-${faker.string.alphanumeric(8).toUpperCase()}-BS`,
        partnerId: targetCustomer.id,
        branchId: branchCCS.id,
        currencyId: currVES.id,
        exchangeRate: rateVes.toFixed(6), // Nominal rate for same-currency transaction or use market rate? Fiscal requires rate.
        status: "POSTED",
        date: new Date(),
        reason: "Ajuste de facturación",
        subtotal: "5000.00",
        totalTax: "0.00",
        total: "5000.00",
        userId: adminUser.id,
      } as any)
      .returning();

    await db.insert(creditNoteItems).values({
      creditNoteId: cnVES.id,
      productId: productsData[0].id, // Use first product as placeholder
      description: "Ajuste manual",
      quantity: "1",
      price: "5000.00",
      total: "5000.00",
      taxRate: "0.00",
    });
    // Enable batches for first 5 products
    for (const prod of productsData.slice(0, 5)) {
      await db
        .update(products)
        .set({ hasBatches: true })
        .where(eq(products.id, prod.id));
      prod.hasBatches = true;
    }

    // =================================================================================
    // LEVEL 13: ACCOUNTING MAPS (Mapeos Contables)
    // =================================================================================
    Logger.step("L13", "Setting up Automated Accounting Maps");

    const allAccAccounts = await db.select().from(accountingAccounts);

    // Account finding helpers
    const findAcc = (name: string, codePrefix: string) =>
      allAccAccounts.find(
        (a) => a.name.includes(name) || a.code.startsWith(codePrefix),
      ) || allAccAccounts[0];

    const accVentas = findAcc("Ventas", "4");
    const accCaja = findAcc("Caja", "1.1");
    const accAR = findAcc("Clientes", "1.1.02"); // Cuentas por Cobrar
    const accIVA = findAcc("IVA", "2.1.03"); // Débito Fiscal
    const accInventario = findAcc("Inventario", "1.1.03"); // Activo Inventario
    const accCostoVentas = findAcc("Costo de Ventas", "5.1.01"); // COGS

    await db.insert(accountingMaps).values([
      // Sales Revenue (Global)
      {
        branchId: branchCCS.id,
        module: "SALES",
        transactionType: "SALES_REVENUE",
        creditAccountId: accVentas.id,
      },
      // Accounts Receivable (Global)
      {
        branchId: branchCCS.id,
        module: "SALES",
        transactionType: "INVOICE_AR",
        debitAccountId: accAR.id,
      },
      // Tax Mapping
      {
        branchId: branchCCS.id,
        module: "TAXES",
        transactionType: "IVA_OUTPUT",
        creditAccountId: accIVA.id,
      },
      // Inventory Mappings (Caracas)
      {
        branchId: branchCCS.id,
        module: "INVENTORY",
        transactionType: "ASSET",
        debitAccountId: accInventario.id, // Service uses debitAccountId for Asset account
      },
      {
        branchId: branchCCS.id,
        module: "INVENTORY",
        transactionType: "COGS",
        debitAccountId: accCostoVentas.id, // Service uses debitAccountId for COGS account
      },
      // Payment Mapping
      {
        branchId: branchCCS.id,
        module: "SALES",
        transactionType: "INVOICE",
        categoryId: catTech.id,
        creditAccountId: accVentas.id,
        debitAccountId: accCaja.id,
      },
      // Repeat for Valencia
      {
        branchId: branchVAL.id,
        module: "SALES",
        transactionType: "SALES_REVENUE",
        creditAccountId: accVentas.id,
      },
      {
        branchId: branchVAL.id,
        module: "SALES",
        transactionType: "INVOICE_AR",
        debitAccountId: accAR.id,
      },
      {
        branchId: branchVAL.id,
        module: "TAXES",
        transactionType: "IVA_OUTPUT",
        creditAccountId: accIVA.id,
      },
      {
        branchId: branchVAL.id,
        module: "INVENTORY",
        transactionType: "ASSET",
        debitAccountId: accInventario.id,
      },
      {
        branchId: branchVAL.id,
        module: "INVENTORY",
        transactionType: "COGS",
        debitAccountId: accCostoVentas.id,
      },
    ] as any);

    Logger.success(
      "Created essential accounting maps (AR, TAX, Revenue, Inventory)",
    );

    // =================================================================================
    // LEVEL 11: AUDIT TRAILS (Trazabilidad y Auditoría)
    // =================================================================================
    Logger.step("L11", "Generating Audit Trails for Documents");

    const recentOrders = await db.select().from(orders).limit(50);
    const recentInvoices = await db.select().from(invoices).limit(50);
    const recentPayments = await db.select().from(payments).limit(50);

    const auditData: any[] = [];

    // Audit for Orders
    for (const order of recentOrders) {
      auditData.push({
        entityTable: "orders",
        entityId: order.id,
        action: "CREATE",
        userId: adminUser.id,
        documentCode: order.code,
        documentStatus: order.status,
        description: "Pedido creado desde el sistema de ventas",
        createdAt: order.date,
      });
      if (order.status === "CONFIRMED" || order.status === "COMPLETED") {
        auditData.push({
          entityTable: "orders",
          entityId: order.id,
          action: "UPDATE",
          userId: adminUser.id,
          documentCode: order.code,
          documentStatus: order.status,
          description: "Pedido confirmado y listo para facturar",
          createdAt: new Date(order.date!.getTime() + 1000 * 60 * 60), // +1 hour
        });
      }
    }

    // Audit for Invoices
    for (const inv of recentInvoices) {
      auditData.push({
        entityTable: "invoices",
        entityId: inv.id,
        action: "CREATE",
        userId: adminUser.id,
        documentCode: inv.code,
        documentStatus: "DRAFT",
        description: "Borrador de factura generado",
        createdAt: inv.date,
      });
      if (inv.status === "POSTED" || inv.status === "PAID") {
        auditData.push({
          entityTable: "invoices",
          entityId: inv.id,
          action: "UPDATE",
          userId: adminUser.id,
          documentCode: inv.code,
          documentStatus: inv.status,
          description: "Factura emitida y contabilizada",
          createdAt: new Date(inv.date!.getTime() + 1000 * 60 * 30), // +30 mins
        });
      }
    }

    // Audit for Payments
    for (const pay of recentPayments) {
      auditData.push({
        entityTable: "payments",
        entityId: pay.id,
        action: "CREATE",
        userId: adminUser.id,
        documentCode: pay.reference || pay.id.substring(0, 8),
        documentStatus: "REGISTRADO",
        description: "Pago registrado en tesorería",
        changes: { amount: pay.amount, currency: { code: "VES" } },
        createdAt: pay.date,
      });
    }

    // Chunk insert audit logs
    const chunkSize = 100;
    for (let i = 0; i < auditData.length; i += chunkSize) {
      await db.insert(auditLogs).values(auditData.slice(i, i + chunkSize));
    }
    Logger.success(`Generated ${auditData.length} enriched audit logs`);

    // =================================================================================
    // LEVEL 12: DOCUMENT LINKS (Traceability)
    // =================================================================================
    Logger.step("L12", "Linking Document Flows");

    const linksData: any[] = [];

    // Order -> Invoice links
    const invoicesWithOrders = recentInvoices.filter((inv) => inv.orderId);
    for (const inv of invoicesWithOrders) {
      linksData.push({
        sourceId: inv.orderId,
        sourceTable: "orders",
        targetId: inv.id,
        targetTable: "invoices",
        type: "ORDER_TO_INVOICE",
        userId: adminUser.id,
      });
    }

    // Invoice -> Payment links
    const paymentsWithInvoices = recentPayments.filter((p) => p.invoiceId);
    for (const pay of paymentsWithInvoices) {
      linksData.push({
        sourceId: pay.invoiceId,
        sourceTable: "invoices",
        targetId: pay.id,
        targetTable: "payments",
        type: "INVOICE_TO_PAYMENT",
        userId: adminUser.id,
      });
    }

    if (linksData.length > 0) {
      await db.insert(documentLinks).values(linksData);
    }
    Logger.success(`Created ${linksData.length} document trace links`);

    Logger.section("E2E SEED COMPLETED SUCCESSFULLY!");
    process.exit(0);
  } catch (error) {
    Logger.error(`Seeding failed: ${(error as Error).message}`);
    process.exit(1);
  }
}

main();
