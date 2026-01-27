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
  payrollConceptTypes,
  payrollIncidents,
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

async function main() {
  console.log("🚀 STARTING E2E MULTICURRENCY SEED...");

  try {
    // 1. RUN BASIC SEED (Infrastructure)
    const baseData = await seed(true); // Clean = true
    
    const allBanks = await db.select().from(banks);

    const { adminUser, branches: seededBranches, currencies: { usd, ves } } = baseData;
    
    // Alias for code clarity
    const currUSD = usd;
    const currVES = ves;
    const branchCCS = seededBranches.find(b => b.name.includes("Caracas"))!;
    const branchVAL = seededBranches.find(b => b.name.includes("Valencia"))!;

    // Fetch master roles
    const allRoles = await db.select().from(roles);
    const roleSeller = allRoles.find(r => r.name === "seller")!;
    const roleWarehouse = allRoles.find(r => r.name === "warehouse")!;
    const roleTreasury = allRoles.find(r => r.name === "accountant")!;

    // =================================================================================
    // LEVEL 1: SETUP (Users, Accounts, Rates)
    // =================================================================================
    console.log("👥 [L1] Setting up Users & Accounts...");

    // Create extra users
    const password = await bcrypt.hash("admin123", 10);
    const usersData = [
      { email: "ventas.ccs@erp.com", name: "Vendedor Caracas", role: roleSeller, branch: branchCCS },
      { email: "almacen.val@erp.com", name: "Jefe Almacén Val", role: roleWarehouse, branch: branchVAL },
      { email: "tesoreria@erp.com", name: "Tesorero General", role: roleTreasury, branch: branchCCS },
    ];

    for (const u of usersData) {
      const [newUser] = await db.insert(users).values({
          email: u.email, name: u.name, password: password,
        }).returning();
      await db.insert(usersRoles).values({ userId: newUser.id, roleId: u.role.id });
      await db.insert(usersBranches).values({ userId: newUser.id, branchId: u.branch.id, isDefault: true });
      // Add secondary branch for treasurer
      if (u.role.name === 'accountant') {
         await db.insert(usersBranches).values({ userId: newUser.id, branchId: branchVAL.id, isDefault: false });
      }
    }

    // Wallets & Accounts (Zelle, Cash)
    const allMethods = await db.select().from(paymentMethods);
    const seededAccounts = await db.select().from(bankAccounts);
    
    for (const b of [branchCCS, branchVAL]) {
        // Ensure Wallet Account
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

    // Historical Rates (60 days)
    console.log("💰 [L2] Generating 60-Day Rate History...");
    const rateByDate = new Map<string, string>();
    const ratesData: any[] = [];
    const today = new Date();
    let currentRateNum = 352.70; // Starting point today

    for (let i = 0; i <= 60; i++) {
        const d = new Date();
        d.setDate(today.getDate() - i);
        const dateKey = d.toISOString().slice(0, 10);
        
        // Slight fluctuation
        if (i > 0) currentRateNum -= faker.number.float({ min: 0.1, max: 0.8 });
        
        const rateStr = currentRateNum.toFixed(4);
        rateByDate.set(dateKey, rateStr);

        if (i > 0) { // Today is already created by seed()
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
    for(let i=0; i<5; i++) {
        const [p] = await db.insert(partners).values({
            name: faker.company.name(),
            taxId: `J-${faker.string.numeric(8)}-${faker.string.numeric(1)}`,
            email: faker.internet.email(),
            type: "SUPPLIER",
            taxpayerType: "ORDINARY",
            address: faker.location.streetAddress(),
        }).returning();
        suppliers.push(p);
    }
    for(let i=0; i<10; i++) {
        const [p] = await db.insert(partners).values({
            name: faker.person.fullName(),
            taxId: `V-${faker.string.numeric(8)}`,
            type: "CUSTOMER",
            taxpayerType: Math.random() > 0.8 ? "SPECIAL" : "ORDINARY",
            address: faker.location.city(),
        }).returning();
        customers.push(p);
    }

    // Products (Priced in USD)
    const [catTech] = await db.insert(productCategories).values([{ name: "Tecnología", description: "General" }]).returning();
    const productsData: any[] = [];
    for(let i=0; i<20; i++) {
        const cost = parseFloat(randomMoney(50, 800));
        const price = cost * 1.4; // 40% margin
        const [prod] = await db.insert(products).values({
            sku: `PROD-${faker.string.alphanumeric(4).toUpperCase()}`,
            name: faker.commerce.productName(),
            categoryId: catTech.id,
            type: "PHYSICAL",
            currencyId: currUSD.id,
            cost: cost.toFixed(2),
            price: price.toFixed(2),
            taxRate: "16.00"
        }).returning();
        productsData.push(prod);
    }

    // =================================================================================
    // NEW: TAX CONCEPTS (Catálogo Fiscal Venezolano)
    // =================================================================================
    console.log("📋 [L3.1] Creating Tax Concepts...");
    
    const taxConceptsData = await db.insert(taxConcepts).values([
      { code: "001", name: "Honorarios Profesionales (Personas Naturales)", retentionPercentage: "3.00", baseMin: "0", sustraendo: "0" },
      { code: "002", name: "Honorarios Profesionales (Personas Jurídicas)", retentionPercentage: "5.00", baseMin: "0", sustraendo: "0" },
      { code: "003", name: "Comisiones Mercantiles", retentionPercentage: "5.00", baseMin: "0", sustraendo: "0" },
      { code: "004", name: "Servicios de Transporte", retentionPercentage: "1.00", baseMin: "0", sustraendo: "0" },
      { code: "005", name: "Servicios Generales", retentionPercentage: "2.00", baseMin: "0", sustraendo: "0" },
      { code: "006", name: "Arrendamiento de Bienes Inmuebles", retentionPercentage: "5.00", baseMin: "0", sustraendo: "0" },
      { code: "007", name: "Publicidad y Propaganda", retentionPercentage: "5.00", baseMin: "0", sustraendo: "0" },
      { code: "008", name: "Pagos a Contratistas", retentionPercentage: "2.00", baseMin: "0", sustraendo: "0" },
    ]).returning();

    console.log(`   ✅ Created ${taxConceptsData.length} tax concepts`);

    // =================================================================================
    // NEW: JOB POSITIONS (Cargos con Tabulador Salarial)
    // =================================================================================
    console.log("💼 [L3.2] Creating Job Positions...");
    
    const jobPositionsData = await db.insert(jobPositions).values([
      { name: "Gerente General", description: "Dirección general de la empresa", currencyId: currUSD.id, baseSalaryMin: "2000.00", baseSalaryMax: "5000.00" },
      { name: "Gerente de Ventas", description: "Dirección del equipo comercial", currencyId: currUSD.id, baseSalaryMin: "1200.00", baseSalaryMax: "2500.00" },
      { name: "Contador", description: "Gestión contable y fiscal", currencyId: currUSD.id, baseSalaryMin: "800.00", baseSalaryMax: "1500.00" },
      { name: "Vendedor", description: "Atención al cliente y ventas", currencyId: currUSD.id, baseSalaryMin: "400.00", baseSalaryMax: "800.00" },
      { name: "Almacenista", description: "Gestión de inventario y almacén", currencyId: currUSD.id, baseSalaryMin: "350.00", baseSalaryMax: "600.00" },
      { name: "Analista Administrativo", description: "Soporte administrativo general", currencyId: currUSD.id, baseSalaryMin: "500.00", baseSalaryMax: "900.00" },
      { name: "Cajero", description: "Manejo de caja y cobros", currencyId: currUSD.id, baseSalaryMin: "350.00", baseSalaryMax: "550.00" },
    ]).returning();

    console.log(`   ✅ Created ${jobPositionsData.length} job positions`);

    // =================================================================================
    // NEW: EMPLOYEES (Empleados)
    // =================================================================================
    console.log("👷 [L3.3] Creating Employees...");
    
    const employeesData: any[] = [];
    
    for (let i = 0; i < 12; i++) {
      const position = faker.helpers.arrayElement(jobPositionsData);
      const minSalary = parseFloat(position.baseSalaryMin || "400");
      const maxSalary = parseFloat(position.baseSalaryMax || "800");
      const salary = faker.number.float({ min: minSalary, max: maxSalary, fractionDigits: 2 });
      
      const paymentMethod = faker.helpers.arrayElement(["BANK_TRANSFER", "CASH"]);
      const bank = paymentMethod === "BANK_TRANSFER" ? faker.helpers.arrayElement(allBanks) : null;

      const [emp] = await db.insert(employees).values({
        firstName: faker.person.firstName(),
        lastName: faker.person.lastName(),
        identityCard: `V-${faker.string.numeric(8)}`,
        email: faker.internet.email(),
        phone: `+58 4${faker.string.numeric(2)}-${faker.string.numeric(7)}`,
        positionId: position.id,
        hireDate: faker.date.past({ years: 3 }),
        salaryCurrencyId: currUSD.id,
        baseSalary: salary.toFixed(2),
        payFrequency: faker.helpers.arrayElement(["BIWEEKLY", "MONTHLY"]),
        paymentMethod: paymentMethod,
        bankId: bank?.id,
        // Legacy Fields (for compatibility view)
        bankName: bank?.name || "",
        accountNumber: paymentMethod === "BANK_TRANSFER" ? `0${faker.string.numeric(19)}` : "",
        accountType: faker.helpers.arrayElement(["CHECKING", "SAVINGS"]),
        status: "ACTIVE",
      }).returning();
      
      employeesData.push(emp);
    }

    console.log(`   ✅ Created ${employeesData.length} employees`);

    // =================================================================================
    // NEW: ORGANIZATION MODULES (Módulos habilitados por sucursal)
    // =================================================================================
    console.log("🔧 [L3.4] Creating Organization Modules...");
    
    const moduleKeys = ["sales", "purchases", "inventory", "treasury", "hr", "reports", "bi"];
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
    const whCCS = await db.insert(warehouses).values({ name: "Almacén CCS Principal", branchId: branchCCS.id, address: "Caracas" }).returning();
    const whVAL = await db.insert(warehouses).values({ name: "Almacén VAL Principal", branchId: branchVAL.id, address: "Valencia" }).returning();
    const warehousesList = [whCCS[0], whVAL[0]];

    // =================================================================================
    // LEVEL 4: PROCUREMENT CYCLE (Purchases)
    // =================================================================================
    console.log("🚚 [L4] Executing Purchase Cycle (Restocking)...");

    for (let i = 0; i < 15; i++) {
        const branch = i % 2 === 0 ? branchCCS : branchVAL;
        const wh = i % 2 === 0 ? whCCS[0] : whVAL[0];
        const supplier = faker.helpers.arrayElement(suppliers);
        
        // Purchase Date (Past 30-60 days)
        const date = faker.date.recent({ days: 30, refDate: new Date(today.getTime() - 30*24*60*60*1000) });
        const dateKey = date.toISOString().slice(0, 10);
        const rate = rateByDate.get(dateKey) || "350.00";

        // 1. Create Purchase Order
        // Scenario: Purchase in USD (Import) or VES (National)
        const isImport = Math.random() > 0.5;
        const currency = isImport ? currUSD : currVES;
        
        // Order Header
        const [order] = await db.insert(orders).values({
            code: `OC-${faker.string.numeric(6)}`,
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
        } as any).returning();

        // Order Items
        let totalOrder = 0;
        const itemsCount = faker.number.int({ min: 3, max: 8 });
        const orderLines: any[] = [];

        for (let j = 0; j < itemsCount; j++) {
            const prod = faker.helpers.arrayElement(productsData);
            const qty = faker.number.int({ min: 10, max: 50 });
            
            // Cost calculation
            let unitCost = parseFloat(prod.cost!);
            if (currency.id === currVES.id) {
                unitCost = unitCost * parseFloat(rate); // Convert to VES
            }

            const lineTotal = unitCost * qty;
            totalOrder += lineTotal;

            orderLines.push({
                orderId: order.id,
                productId: prod.id,
                quantity: qty.toString(),
                price: unitCost.toFixed(2), // In Purchase, price is cost
            });

            // Stock Movement (IN)
            // We need to create stock records if they don't exist
            const existingStock = await db.query.stock.findFirst({ where: (stock, { and, eq }) => and(eq(stock.warehouseId, wh.id), eq(stock.productId, prod.id)) });
            if (existingStock) {
                await db.update(stock).set({ quantity: (parseFloat(existingStock.quantity || "0") + qty).toString() }).where(eq(stock.id, existingStock.id));
            } else {
                await db.insert(stock).values({ warehouseId: wh.id, productId: prod.id, quantity: qty.toString() });
            }
        }

        await db.insert(orderItems).values(orderLines);
        await db.update(orders).set({ total: totalOrder.toFixed(2) }).where(eq(orders.id, order.id));

        // Inventory Move Record
        const [move] = await db.insert(inventoryMoves).values({
            code: `MOV-IN-${order.code}`,
            type: "IN",
            toWarehouseId: wh.id,
            branchId: branch.id,
            date: date,
            note: `Recepción Orden #${order.code}`,
            userId: adminUser.id
        } as any).returning(); // Explicit cast to avoid type issues with relations

        const moveLines = orderLines.map(l => ({
            moveId: move.id,
            productId: l.productId,
            quantity: l.quantity,
            cost: l.price
        }));
        await db.insert(inventoryMoveLines).values(moveLines);

        // 2. Generate Invoice (Bill)
        const totalBase = totalOrder;
        const totalTax = totalBase * 0.16;
        const totalInv = totalBase + totalTax;

        await db.insert(invoices).values({
            code: `C-${faker.string.numeric(6)}`, // Supplier Invoice Number (Control)
            invoiceNumber: `CTRL-${faker.string.numeric(8)}`,
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
    console.log("🛒 [L5] Executing Sales Cycle (Revenue)...");

    for (let i = 0; i < 60; i++) {
        const branch = i % 2 === 0 ? branchCCS : branchVAL;
        const wh = i % 2 === 0 ? whCCS[0] : whVAL[0];
        const customer = faker.helpers.arrayElement(customers);
        
        // Sale Date (Recent 30 days)
        const date = faker.date.recent({ days: 30 });
        const dateKey = date.toISOString().slice(0, 10);
        const rate = rateByDate.get(dateKey) || "350.00"; // Fallback

        // Scenario: 60% USD (IGTF), 40% VES
        const isUSD = Math.random() > 0.4;
        const currency = isUSD ? currUSD : currVES;
        const rateUsed = isUSD ? rate : "1"; 
        
        // Logic: Invoice Exchange Rate is ALWAYS the market rate of the day (VES/USD)
        // Correction: If currency is VES, rate is 1 for Fiscal consistency
        const invoiceRate = rateUsed; 

        // 1. Create Sale Order
        const [order] = await db.insert(orders).values({
            code: `PED-${faker.string.numeric(5)}`,
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
        } as any).returning();

        let totalBase = 0;
        const itemsCount = faker.number.int({ min: 1, max: 5 });
        const orderLines: any[] = [];

        for (let j = 0; j < itemsCount; j++) {
            const prod = faker.helpers.arrayElement(productsData);
            const qty = faker.number.int({ min: 1, max: 5 });
            
            // Check Stock
            // (Skipping strict check for seed, assuming purchases filled enough, or allowing negative for test)
            // But let's decrement
            const existingStock = await db.query.stock.findFirst({ where: (stock, { and, eq }) => and(eq(stock.warehouseId, wh.id), eq(stock.productId, prod.id)) });
            if (existingStock) {
                const newQty = parseFloat(existingStock.quantity || "0") - qty;
                await db.update(stock).set({ quantity: newQty.toString() }).where(eq(stock.id, existingStock.id));
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
                quantity: qty.toString(),
                price: unitPrice.toFixed(2),
            });
        }

        await db.insert(orderItems).values(orderLines);
        await db.update(orders).set({ total: totalBase.toFixed(2) }).where(eq(orders.id, order.id));

        // Inventory Out
        const [move] = await db.insert(inventoryMoves).values({
            code: `MOV-OUT-${order.code}`,
            type: "OUT",
            fromWarehouseId: wh.id,
            branchId: branch.id,
            date: date,
            note: `Despacho Pedido #${order.code}`,
            userId: adminUser.id
        } as any).returning();

        const moveLines = orderLines.map(l => ({
            moveId: move.id,
            productId: l.productId,
            quantity: l.quantity,
            cost: "0" // Simplified
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

        const [inv] = await db.insert(invoices).values({
            code: `A-${faker.string.numeric(6)}`,
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
        }).returning();

        // Invoice Items
        const invItems = orderLines.map(l => ({
            invoiceId: inv.id,
            productId: l.productId,
            quantity: l.quantity,
            price: l.price,
            total: (parseFloat(l.price) * parseFloat(l.quantity)).toFixed(2),
            taxRate: "16.00"
        }));
        await db.insert(invoiceItems).values(invItems);

        // 3. Payment (80% Paid, 20% Debt)
        if (Math.random() > 0.2) {
            const methods = allMethods.filter(m => m.branchId === branch.id);
            // If USD -> Zelle/Cash USD
            // If VES -> Transfer/PagoMovil
            let methodCode = isUSD ? "TRANSFERENCIA_USD" : "PAGO_MOVIL"; // Simplified selection
            let method = methods.find(m => m.code === methodCode);
            if (!method) method = methods[0]; // Fallback

            // Account
            const accounts = seededAccounts.filter(a => a.branchId === branch.id && a.currencyId === method?.currencyId);
            const account = accounts[0];

            if (method && account) {
                const [pay] = await db.insert(payments).values({
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
                    userId: adminUser.id
                } as any).returning();

                await db.insert(paymentAllocations).values({
                    paymentId: pay.id,
                    invoiceId: inv.id,
                    amount: totalFinal.toFixed(2)
                } as any);

                await db.update(invoices).set({ status: "PAID" }).where(eq(invoices.id, inv.id));
            }
        }
    }

    // =================================================================================
    // LEVEL 6: CREDIT NOTES (Notas de Crédito)
    // =================================================================================
    console.log("📝 [L6] Creating Credit Notes...");

    // Fetch posted/paid sale invoices for credit notes
    const saleInvoices = await db.query.invoices.findMany({
      where: (inv, { and, eq, or }) => and(
        eq(inv.type, "SALE"),
        or(eq(inv.status, "POSTED"), eq(inv.status, "PAID"))
      ),
      with: { items: true },
      limit: 15,
    });

    let creditNotesCreated = 0;
    for (let i = 0; i < Math.min(10, saleInvoices.length); i++) {
      const invoice = saleInvoices[i];
      if (!invoice.items || invoice.items.length === 0) continue;

      // Select 1-2 items for partial return
      const itemsToReturn = invoice.items.slice(0, Math.min(2, invoice.items.length));
      
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

      const [nc] = await db.insert(creditNotes).values({
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
      }).returning();

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
          where: (s, { and, eq }) => and(eq(s.warehouseId, wh.id), eq(s.productId, item.productId))
        });
        if (existingStock) {
          const newQty = Number(existingStock.quantity) + Number(item.quantity);
          await db.update(stock).set({ quantity: newQty.toString() }).where(eq(stock.id, existingStock.id));
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
    console.log(`   ✅ Created ${creditNotesCreated} credit notes with stock returns`);

    // =================================================================================
    // LEVEL 7: TAX RETENTIONS (Retenciones Fiscales)
    // =================================================================================
    console.log("🧾 [L7] Creating Tax Retentions...");

    // Fetch purchase invoices for retentions (from SPECIAL taxpayer suppliers)
    const purchaseInvoices = await db.query.invoices.findMany({
      where: (inv, { and, eq }) => and(
        eq(inv.type, "PURCHASE"),
        eq(inv.status, "POSTED")
      ),
      with: { partner: true },
      limit: 20,
    });

    // Filter for special taxpayers (or just use all for demo)
    const specialPurchases = purchaseInvoices.filter(inv => 
      inv.partner?.taxpayerType === "SPECIAL" || Math.random() > 0.5
    ).slice(0, 10);

    let retentionsCreated = 0;
    const currentPeriod = new Date().toISOString().slice(0, 7).replace("-", ""); // YYYYMM

    for (const invoice of specialPurchases) {
      const retentionRate = 75; // 75% IVA retention for special taxpayers
      const taxAmount = Number(invoice.totalTax);
      const retainedAmount = (taxAmount * retentionRate) / 100;

      if (retainedAmount <= 0) continue;

      const [retention] = await db.insert(taxRetentions).values({
        code: `${currentPeriod}-${faker.string.numeric(4)}`,
        partnerId: invoice.partnerId,
        branchId: invoice.branchId,
        period: currentPeriod,
        type: "IVA",
        totalBase: invoice.totalBase,
        totalTax: taxAmount.toFixed(2),
        totalRetained: retainedAmount.toFixed(2),
        date: faker.date.recent({ days: 10 }),
        userId: adminUser.id,
      } as any).returning();

      // Insert retention line
      await db.insert(taxRetentionLines).values({
        retentionId: retention.id,
        invoiceId: invoice.id,
        baseAmount: invoice.totalBase,
        taxAmount: taxAmount.toFixed(2),
        retainedAmount: retainedAmount.toFixed(2),
      } as any);

      retentionsCreated++;
    }
    console.log(`   ✅ Created ${retentionsCreated} IVA tax retentions`);

    // =================================================================================
    // LEVEL 8: LOANS (Préstamos de Productos)
    // =================================================================================
    console.log("📦 [L8] Creating Product Loans...");

    let loansCreated = 0;
    for (let i = 0; i < 8; i++) {
      const customer = faker.helpers.arrayElement(customers);
      const isReturned = Math.random() > 0.6;

      const [loan] = await db.insert(loans).values({
        code: `PRE-${faker.string.numeric(5)}`,
        partnerId: customer.id,
        status: isReturned ? "RETURNED" : "ACTIVE",
        startDate: faker.date.recent({ days: 30 }),
        dueDate: faker.date.soon({ days: 30 }),
        returnDate: isReturned ? faker.date.recent({ days: 5 }) : null,
        notes: faker.lorem.sentence(),
      }).returning();

      // Add 1-3 loan items
      const itemsCount = faker.number.int({ min: 1, max: 3 });
      for (let j = 0; j < itemsCount; j++) {
        const prod = faker.helpers.arrayElement(productsData);
        await db.insert(loanItems).values({
          loanId: loan.id,
          productId: prod.id,
          quantity: faker.number.int({ min: 1, max: 5 }).toString(),
          serialNumber: Math.random() > 0.5 ? `SN-${faker.string.alphanumeric(8).toUpperCase()}` : null,
          condition: faker.helpers.arrayElement(["GOOD", "GOOD", "GOOD", "DAMAGED"]),
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
    const [concBono] = await db.insert(payrollConceptTypes).values({
      code: "BONO_PROD",
      name: "Bono de Productividad",
      category: "INCOME",
      branchId: branchCCS.id,
    } as any).returning();

    const [concFalta] = await db.insert(payrollConceptTypes).values({
      code: "FALTA_INJ",
      name: "Falta Injustificada",
      category: "DEDUCTION",
      branchId: branchCCS.id,
    } as any).returning();

    const [concExtra] = await db.insert(payrollConceptTypes).values({
      code: "H_EXTRA_D",
      name: "Hora Extra Diurna",
      category: "INCOME",
      branchId: branchCCS.id,
    } as any).returning();

    // 2. Incidents (For Current Month Draft)
    const currStartDate = new Date(today.getFullYear(), today.getMonth(), 1);
    const currEndDate = new Date(today.getFullYear(), today.getMonth(), 15);
    const incidentsData: any[] = [];

    // Assign random incidents
    for (const emp of employeesData) {
      // 30% chance of bonus
      if (Math.random() > 0.7) {
        const amount = faker.number.float({ min: 20, max: 100, fractionDigits: 2 });
        const [inc] = await db.insert(payrollIncidents).values({
          employeeId: emp.id,
          conceptId: concBono.id,
          date: faker.date.between({ from: currStartDate, to: currEndDate }),
          amount: amount.toFixed(2),
          status: "PENDING", // Will be processed in L9
          notes: "Cumplimiento de meta mensual",
        }).returning();
        incidentsData.push(inc);
      }

      // 10% chance of deduction
      if (Math.random() > 0.9) {
        const amount = faker.number.float({ min: 10, max: 50, fractionDigits: 2 });
        const [inc] = await db.insert(payrollIncidents).values({
          employeeId: emp.id,
          conceptId: concFalta.id,
          date: faker.date.between({ from: currStartDate, to: currEndDate }),
          amount: amount.toFixed(2),
          status: "PENDING",
          notes: "Ausencia día lunes",
        }).returning();
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
    const prevStartDate = new Date(prevMonthDate.getFullYear(), prevMonthDate.getMonth(), 1);
    const prevEndDate = new Date(prevMonthDate.getFullYear(), prevMonthDate.getMonth(), 15);
    
    const [paidRun] = await db.insert(payrollRuns).values({
      code: `NOM-${prevStartDate.toISOString().slice(0, 7)}-Q1`,
      branchId: branchCCS.id,
      frequency: "BIWEEKLY",
      currencyId: currVES.id,
      startDate: prevStartDate,
      endDate: prevEndDate,
      status: "PAID",
      totalAmount: "0" // Will update
    } as any).returning();

    // 2. Draft Payroll (Current Month)
    const [draftRun] = await db.insert(payrollRuns).values({
      code: `NOM-${currStartDate.toISOString().slice(0, 7)}-Q1`,
      branchId: branchCCS.id,
      frequency: "BIWEEKLY",
      currencyId: currVES.id,
      startDate: currStartDate,
      endDate: currEndDate,
      status: "DRAFT",
      totalAmount: "0"
    } as any).returning();

    // Generate Items for Draft Run
    let totalDraft = 0;
    const rateVes = 36.5; // Fixed for seed simplicity or fetch from history

    for (const emp of employeesData) {
      if (emp.payFrequency !== "BIWEEKLY") continue;

      const monthlySalary = parseFloat(emp.baseSalary); // In USD usually
      const salaryVes = monthlySalary * rateVes;
      const biweeklyVes = salaryVes / 2;
      const cestaticketVes = 40 * rateVes / 2; // Half cestaticket

      // Process Incidents for this employee
      let incidentIncome = 0;
      let incidentDeduction = 0;
      const empIncidents = incidentsData.filter(inc => inc.employeeId === emp.id);
      
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
        await db.update(payrollIncidents).set({ 
          status: "PROCESSED", 
          processedInRunId: draftRun.id 
        }).where(eq(payrollIncidents.id, inc.id));
      }

      const totalBonuses = cestaticketVes + incidentIncome;
      const totalDeductions = incidentDeduction;
      const netTotal = biweeklyVes + totalBonuses - totalDeductions;
      
      totalDraft += netTotal;

      await db.insert(payrollItems).values({
        runId: draftRun.id,
        employeeId: emp.id,
        baseAmount: biweeklyVes.toFixed(2),
        bonuses: totalBonuses.toFixed(2),
        deductions: totalDeductions.toFixed(2),
        netTotal: netTotal.toFixed(2),
      });
    }

    await db.update(payrollRuns).set({ totalAmount: totalDraft.toFixed(2) }).where(eq(payrollRuns.id, draftRun.id));
    console.log("   ✅ Created sample Payroll Runs (Paid & Draft with Incidents)");

    console.log("✅ E2E SEED COMPLETED SUCCESSFULLY!");
    process.exit(0);
  } catch (error) {
    console.error("❌ Seeding failed:", error);
    process.exit(1);
  }
}

main();
