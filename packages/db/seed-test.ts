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
} from "./src";
import { sql } from "drizzle-orm";
import * as bcrypt from "bcrypt";
import * as dotenv from "dotenv";
import { faker } from "@faker-js/faker";
import { seed } from "./seed";

dotenv.config({ path: "./src/.env" });

// Helper for random numeric strings (money)
const randomMoney = (min: number, max: number) =>
  faker.number.float({ min, max, fractionDigits: 2 }).toString();

async function main() {
  console.log("🚀 STARTING ROBUST SEED (TEST/DEMO MODE)...");

  try {
    // 1. RUN BASIC SEED (Infrastructure)
    const baseData = await seed(true); // Clean = true
    const { adminUser, branches: seededBranches, currencies: { usd, ves } } = baseData;
    
    // Alias for code clarity
    const currUSD = usd;
    const currVES = ves;
    const branchCCS = seededBranches.find(b => b.name.includes("Caracas"))!;
    const branchVAL = seededBranches.find(b => b.name.includes("Valencia"))!;

    // =================================================================================
    // LEVEL 1.5: ADD MORE USERS
    // =================================================================================
    console.log("👥 [L1.5] Adding Extra Users...");
    
    // Fetch roles again since seed() returns them but we need IDs for all
    const allRoles = await db.select().from(roles);
    const roleSeller = allRoles.find(r => r.name === "seller")!;
    const roleWarehouse = allRoles.find(r => r.name === "warehouse")!;
    const roleTreasury = allRoles.find(r => r.name === "accountant")!;

    const password = await bcrypt.hash("admin123", 10);
    const usersData = [
      {
        email: "ventas.ccs@erp.com",
        name: "Vendedor Caracas",
        role: roleSeller,
        branches: [branchCCS],
      },
      {
        email: "almacen.val@erp.com",
        name: "Jefe Almacén Val",
        role: roleWarehouse,
        branches: [branchVAL],
      },
      {
        email: "tesoreria@erp.com",
        name: "Tesorero General",
        role: roleTreasury,
        branches: [branchCCS, branchVAL],
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

      await db.insert(usersRoles).values({
        userId: newUser.id,
        roleId: u.role.id,
      });

      for (const b of u.branches) {
        await db.insert(usersBranches).values({
          userId: newUser.id,
          branchId: b.id,
          isDefault: b.id === u.branches[0].id,
        });
      }
    }

    // =================================================================================
    // LEVEL 2: FINANCE HISTORICAL DATA
    // =================================================================================
    console.log("💰 [L2] Generating Historical Rates...");

    // Historical Exchange Rates (Past 30 days)
    const ratesData: any[] = [];
    const targetRateNum = 352.7063;
    const targetRateStr = "352.7063000000"; // Exact precision requested
    let currentIterRate = targetRateNum;
    const today = new Date();
    
    // Map to store rate by date string YYYY-MM-DD for invoices
    const rateByDate = new Map<string, string>();

    // 1. Set Today's Rate (Created by seed.ts Base)
    const todayKey = today.toISOString().slice(0, 10);
    rateByDate.set(todayKey, targetRateStr);

    // 2. Generate BACKWARDS from YESTERDAY (i=1) to avoid duplication
    // Start iter rate slightly lower for yesterday
    currentIterRate -= faker.number.float({ min: 0.05, max: 0.5 });

    for (let i = 1; i <= 30; i++) {
      const d = new Date();
      d.setDate(today.getDate() - i);
      const dateKey = d.toISOString().slice(0, 10);
      
      // Calculate formatted for history
      const rateStr = currentIterRate.toFixed(10);
      rateByDate.set(dateKey, rateStr);

      ratesData.push({
        currencyId: currVES.id,
        rate: rateStr,
        date: d,
        source: "BCV",
      });

      // Decrease for the previous day
      currentIterRate -= faker.number.float({ min: 0.05, max: 0.5 });
    }
    
    // Note: seed() created one rate, we append history
    await db.insert(exchangeRates).values(ratesData);
    const currentRate = targetRateStr;

    // Fetch methods and accounts created by seed() to link them
    const allMethods = await db.select().from(paymentMethods);
    const allAccounts = await db.select().from(bankAccounts);

    // Link "Transferencia USD" to "Wallet" if exists (or create if not)
    // The seed() created accounts, let's just ensure we have a Wallet for Zelle
    // Actually seed() creates 3 accounts per branch: Cash USD, Cash VES, Banesco.
    // Let's add a Wallet account for Zelle.
    const seededAccounts = [...allAccounts];
    
    for (const b of [branchCCS, branchVAL]) {
        const [wallet] = await db.insert(bankAccounts).values({
            name: `Zelle Corp - ${b.name.split(" ")[1]}`,
            type: "WALLET",
            currencyId: currUSD.id,
            branchId: b.id,
            currentBalance: "5000.00"
        }).returning();
        seededAccounts.push(wallet);

        const methodTransfUSD = allMethods.find(m => m.code === "TRANSFERENCIA_USD" && m.branchId === b.id);
        if (methodTransfUSD) {
            await db.insert(paymentMethodAccounts).values({
                methodId: methodTransfUSD.id,
                bankAccountId: wallet.id
            });
        }
    }

    // =================================================================================
    // LEVEL 3: MASTER DATA (Partners, Categories, Products)
    // =================================================================================
    console.log("📦 [L3] Seeding Master Data...");

    // Partners (20)
    const partnersData: any[] = [];
    for (let i = 0; i < 5; i++) {
      partnersData.push({
        name: faker.company.name(),
        taxId: `J-${faker.string.numeric(8)}-${faker.string.numeric(1)}`,
        email: faker.internet.email(),
        type: "SUPPLIER",
        taxpayerType: "ORDINARY",
        address: faker.location.streetAddress(),
      });
    }
    for (let i = 0; i < 15; i++) {
      const isSpecial = Math.random() > 0.8;
      partnersData.push({
        name: faker.person.fullName(),
        taxId: `V-${faker.string.numeric(8)}`,
        email: faker.internet.email(),
        type: "CUSTOMER",
        taxpayerType: isSpecial ? "SPECIAL" : "ORDINARY",
        retentionRate: isSpecial ? "75" : "0",
        address: faker.location.city(),
      });
    }
    const seededPartners = await db.insert(partners).values(partnersData).returning();

    // Product Categories
    const [catTech, catServ] = await db.insert(productCategories).values([
        { name: "Tecnología", description: "Equipos y Gadgets" },
        { name: "Servicios", description: "Mano de obra y fletes" },
    ]).returning();

    const [catComp, catAcc] = await db.insert(productCategories).values([
        { name: "Computadores", parentId: catTech.id, description: "Laptops y PCs" },
        { name: "Accesorios", parentId: catTech.id, description: "Periféricos" },
    ]).returning();

    // Products (30)
    const productsData: any[] = [];
    for (let i = 0; i < 10; i++) {
      productsData.push({
        sku: `LPT-${faker.string.alphanumeric(4).toUpperCase()}`,
        name: `Laptop ${faker.commerce.productAdjective()} ${i + 1}`,
        description: faker.commerce.productDescription(),
        categoryId: catComp.id,
        type: "PHYSICAL",
        cost: randomMoney(300, 800),
        price: randomMoney(450, 1200),
        currencyId: currUSD.id,
        taxRate: "16.00",
      });
    }
    for (let i = 0; i < 15; i++) {
      productsData.push({
        sku: `ACC-${faker.string.alphanumeric(4).toUpperCase()}`,
        name: `Accesorios ${faker.commerce.productMaterial()} ${i + 1}`,
        categoryId: catAcc.id,
        type: "PHYSICAL",
        cost: randomMoney(5, 50),
        price: randomMoney(10, 90),
        currencyId: currUSD.id,
        taxRate: "16.00",
      });
    }
    for (let i = 0; i < 5; i++) {
      productsData.push({
        sku: `SRV-${faker.string.alphanumeric(4).toUpperCase()}`,
        name: `Servicio ${faker.hacker.verb()}`,
        categoryId: catServ.id,
        type: "SERVICE",
        cost: "0",
        price: randomMoney(20, 100),
        currencyId: currUSD.id,
        taxRate: "16.00",
      });
    }
    const seededProducts = await db.insert(products).values(productsData).returning();

    // =================================================================================
    // LEVEL 4: INVENTORY & STOCK
    // =================================================================================
    console.log("🏭 [L4] Seeding Warehouses & Initial Stock...");

    const seededWarehouses: any[] = [];
    for (const b of seededBranches) {
      const [wh] = await db.insert(warehouses).values({
          name: `Almacén Principal ${b.name.split(" ")[1]}`,
          branchId: b.id,
          address: b.address,
        }).returning();
      seededWarehouses.push(wh);
    }

    const stockDate = new Date();
    stockDate.setDate(stockDate.getDate() - 30);

    for (const wh of seededWarehouses) {
      const physicalProds = seededProducts.filter((p) => p.type === "PHYSICAL");
      const [move] = await db.insert(inventoryMoves).values({
          code: `ADJ-${wh.id.substring(0, 4)}-INIT`,
          type: "ADJUST",
          fromWarehouseId: wh.id,
          date: stockDate,
          note: "Carga Inicial de Inventario (Seed)",
          userId: adminUser.id,
        }).returning();

      const moveLinesData: any[] = [];
      const stockData: any[] = [];

      for (const prod of physicalProds) {
        const qty = faker.number.int({ min: 10, max: 100 });
        moveLinesData.push({
          moveId: move.id,
          productId: prod.id,
          quantity: qty.toString(),
          cost: prod.cost,
        });
        stockData.push({
          warehouseId: wh.id,
          productId: prod.id,
          quantity: qty.toString(),
        });
      }
      await db.insert(inventoryMoveLines).values(moveLinesData);
      await db.insert(stock).values(stockData);
    }

    // =================================================================================
    // LEVEL 5: TRANSACTIONS (Purchases & Sales)
    // =================================================================================
    console.log("🛒 [L5] Seeding Transactions...");

    const suppliers = seededPartners.filter((p) => p.type === "SUPPLIER");
    const customers = seededPartners.filter((p) => p.type === "CUSTOMER");

    // Purchases
    for (let i = 0; i < 10; i++) {
      const branch = i % 2 === 0 ? branchCCS : branchVAL;
      const wh = seededWarehouses.find((w) => w.branchId === branch.id);
      const supplier = faker.helpers.arrayElement(suppliers);
      const date = faker.date.recent({ days: 20 });
      const dateKey = date.toISOString().slice(0, 10);
      const dailyRate = rateByDate.get(dateKey) || currentRate;

      const [inv] = await db.insert(invoices).values({
          code: `C-${faker.string.numeric(6)}`,
          invoiceNumber: `FACT-${faker.string.numeric(5)}`,
          partnerId: supplier.id,
          branchId: branch.id,
          currencyId: currUSD.id,
          exchangeRate: dailyRate,
          type: "PURCHASE",
          status: "POSTED",
          date: date,
          dueDate: new Date(date.getTime() + 7 * 24 * 60 * 60 * 1000),
          warehouseId: wh?.id,
          userId: adminUser.id,
        }).returning();

      let total = 0;
      const itemsCount = faker.number.int({ min: 2, max: 5 });
      const physicalProds = seededProducts.filter((p) => p.type === "PHYSICAL");

      for (let j = 0; j < itemsCount; j++) {
        const prod = faker.helpers.arrayElement(physicalProds);
        const qty = faker.number.int({ min: 5, max: 20 });
        const cost = Number(prod.cost);
        const lineTotal = qty * cost;

        await db.insert(invoiceItems).values({
          invoiceId: inv.id,
          productId: prod.id,
          quantity: qty.toString(),
          price: cost.toString(),
          cost: cost.toString(),
          total: lineTotal.toString(),
          taxRate: "16.00",
        });
        total += lineTotal;
      }

      const tax = total * 0.16;
      await db.update(invoices).set({
          totalBase: total.toFixed(2),
          totalTax: tax.toFixed(2),
          total: (total + tax).toFixed(2),
        }).where(sql`id = ${inv.id}`);
    }

    // Sales
    const seededSales: any[] = [];
    for (let i = 0; i < 50; i++) {
      const branch = faker.helpers.arrayElement([branchCCS, branchVAL]);
      const customer = faker.helpers.arrayElement(customers);
      const date = faker.date.recent({ days: 30 });
      const dateKey = date.toISOString().slice(0, 10);
      const dailyRate = rateByDate.get(dateKey) || currentRate;
      
      const isVoid = Math.random() > 0.95;
      const status = isVoid ? "VOID" : "POSTED";

      const [inv] = await db.insert(invoices).values({
          code: `A-${faker.string.numeric(5).padStart(5, "0")}`,
          partnerId: customer.id,
          branchId: branch.id,
          currencyId: currUSD.id,
          exchangeRate: dailyRate,
          type: "SALE",
          status: status,
          date: date,
          userId: adminUser.id,
        }).returning();

      let total = 0;
      const itemsCount = faker.number.int({ min: 1, max: 4 });

      for (let j = 0; j < itemsCount; j++) {
        const prod = faker.helpers.arrayElement(seededProducts);
        const qty = faker.number.int({ min: 1, max: 3 });
        const price = Number(prod.price);
        const lineTotal = qty * price;

        await db.insert(invoiceItems).values({
          invoiceId: inv.id,
          productId: prod.id,
          quantity: qty.toString(),
          price: price.toString(),
          cost: prod.cost,
          total: lineTotal.toString(),
          taxRate: prod.taxRate,
        });
        total += lineTotal;
      }

      const tax = total * 0.16;
      const totalFinal = total + tax;

      await db.update(invoices).set({
          totalBase: total.toFixed(2),
          totalTax: tax.toFixed(2),
          total: totalFinal.toFixed(2),
        }).where(sql`id = ${inv.id}`);

      seededSales.push({ ...inv, total: totalFinal });
    }

    // =================================================================================
    // LEVEL 6: TREASURY (Payments)
    // =================================================================================
    console.log("💵 [L6] Seeding Payments...");

    for (const sale of seededSales) {
      if (sale.status !== "POSTED") continue;
      if (Math.random() > 0.7) continue;

      const amount = Number(sale.total);
      const isPartial = Math.random() > 0.8;
      const payAmount = isPartial ? amount * 0.5 : amount;

      const branchMethods = allMethods.filter((m) => m.branchId === sale.branchId);
      const method = faker.helpers.arrayElement(branchMethods);
      const accounts = seededAccounts.filter((a) => a.branchId === sale.branchId);
      const account = accounts.find((a) => a.currencyId === method.currencyId);

      if (!account) continue;

      // Use the invoice rate for payment to keep it simple, or current rate?
      // Usually payment is at current rate, but let's use the invoice's rate to avoid gain/loss logic complexity in seed
      const paymentRate = sale.exchangeRate; 

      const [payment] = await db.insert(payments).values({
          invoiceId: sale.id,
          partnerId: sale.partnerId,
          branchId: sale.branchId,
          methodId: method.id,
          bankAccountId: account.id,
          type: "INCOME",
          amount: payAmount.toFixed(2),
          currencyId: method.currencyId,
          exchangeRate: paymentRate,
          reference: faker.finance.routingNumber(),
          date: faker.date.between({ from: sale.date, to: new Date() }),
          userId: adminUser.id,
        } as any).returning();

      await db.insert(paymentAllocations).values({
        paymentId: payment.id,
        invoiceId: sale.id,
        amount: payAmount.toFixed(2),
      });

      const newStatus = payAmount >= amount ? "PAID" : Math.abs(payAmount - amount) < 0.01 ? "PAID" : "PARTIALLY_PAID";
      await db.update(invoices).set({ status: newStatus }).where(sql`id = ${sale.id}`);
    }

    console.log("✅ ROBUST SEED COMPLETED SUCCESSFULLY!");
    process.exit(0);
  } catch (error) {
    console.error("❌ Seeding failed:", error);
    process.exit(1);
  }
}

main();
