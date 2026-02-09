import './load-db-env';
import { NestFactory } from '@nestjs/core';
import { AppModule } from '../app.module';
import { OrdersService } from '../modules/orders/orders.service';
import { BillingService } from '../modules/billing/billing.service';
import { UsersService } from '../modules/users/users.service';
import { CurrenciesService } from '../modules/settings/currencies/currencies.service';
import {
  db,
  users,
  invoices,
  payments,
  paymentAllocations,
  orders,
  orderItems,
  stock,
  inventoryMoves,
  exchangeRates,
  bankAccounts,
  paymentMethods,
  partners,
  products,
  branches,
  warehouses,
} from '@repo/db';
import { eq, desc } from 'drizzle-orm';
import { faker } from '@faker-js/faker';
import Decimal from 'decimal.js';

async function seedTransactions() {
  console.log('🚀 Starting Transaction Seed (API Logic Mode)...');

  const app = await NestFactory.createApplicationContext(AppModule);

  try {
    const ordersService = app.get(OrdersService);
    const billingService = app.get(BillingService);
    const usersService = app.get(UsersService);
    const currenciesService = app.get(CurrenciesService);

    // 1. Fetch Context Data
    const adminUser = await db.query.users.findFirst({
      where: eq(users.email, 'admin@erp.com'),
    });
    if (!adminUser)
      throw new Error('Admin user not found. Run basic seed first.');

    const allBranches = await db.query.branches.findMany();
    const allPartners = await db.query.partners.findMany();
    const allProducts = await db.query.products.findMany({
      where: eq(products.type, 'PHYSICAL'),
    });
    const allWarehouses = await db.query.warehouses.findMany();
    const allMethods = await db.query.paymentMethods.findMany();
    const allAccounts = await db.query.bankAccounts.findMany();

    // Fetch currencies and find VES (non-base currency for transactions)
    const allCurrencies = await currenciesService.findAll();
    const vesCurrency = allCurrencies.find((c) => !c.isBase); // VES is not the base currency
    if (!vesCurrency)
      throw new Error('VES currency not found. Run basic seed first.');

    const suppliers = allPartners.filter((p) => p.type === 'SUPPLIER');
    const customers = allPartners.filter((p) => p.type === 'CUSTOMER');

    // Fetch Historical Rates map (Date -> Rate)
    // We assume rates were seeded by seed-test.ts
    const ratesHistory = await db.query.exchangeRates.findMany({
      orderBy: desc(exchangeRates.date),
      limit: 100,
    });

    // Helper to get rate for a date
    const getRateForDate = (date: Date) => {
      const dateStr = date.toISOString().slice(0, 10);
      const rate = ratesHistory.find(
        (r) => r.date && r.date.toISOString().slice(0, 10) === dateStr,
      );
      return rate ? rate.rate : '352.7063000000'; // Fallback
    };

    console.log('🛒 Generating Sales Orders & Invoices...');

    // 2. Generate 20 Sales (Full Cycle: Order -> Confirm -> Invoice -> Post -> Pay)
    for (let i = 0; i < 20; i++) {
      const branch = faker.helpers.arrayElement(allBranches);
      const customer = faker.helpers.arrayElement(customers);
      const warehouse = allWarehouses.find((w) => w.branchId === branch.id);

      if (!warehouse) continue;

      // Simulate Date (Past 30 days)
      const date = faker.date.recent({ days: 30 });
      const dailyRate = getRateForDate(date);

      // A. Create Order
      const itemsCount = faker.number.int({ min: 1, max: 3 });
      const items = [];

      for (let j = 0; j < itemsCount; j++) {
        const prod = faker.helpers.arrayElement(allProducts);
        // Convert USD Price to VES for the Order Item
        // Since we are creating a VES Order, items must be in VES
        const priceUSD = Number(prod.price);
        const rate = Number(dailyRate);
        const priceVES = priceUSD * rate;

        items.push({
          productId: prod.id,
          quantity: faker.number.int({ min: 1, max: 5 }),
          price: priceVES, // Send price in VES
        });
      }

      try {
        // Create (Pending)
        // We assume the Order is created in the Base Currency (VES) by default logic in Seed context
        // or we explicitly rely on the calculated prices above.
        const order = await ordersService.create(
          {
            partnerId: customer.id,
            branchId: branch.id,
            warehouseId: warehouse.id,
            currencyId: vesCurrency.id,
            items: items,
            type: 'SALE',
            exchangeRate: Number(dailyRate),
          },
          adminUser.id,
        );

        // Backdate Order
        await db
          .update(orders)
          .set({ date: date })
          .where(eq(orders.id, order.id));

        // Confirm (Moves Stock)
        const confirmedOrder = await ordersService.confirm(
          order.id,
          adminUser.id,
        );

        // Backdate Move
        // Find related move
        // (Skipping for brevity, ideally update inventory_moves date too)

        // B. Generate Invoice
        // The service converts Order Items (USD) -> Invoice Items (VES) using the Rate
        const { invoice } = await ordersService.generateInvoice(
          confirmedOrder.id,
          adminUser.id,
        );

        // Backdate Invoice
        await db
          .update(invoices)
          .set({ date: date, exchangeRate: dailyRate })
          .where(eq(invoices.id, invoice.id));

        // Post Invoice (Assign Control Number)
        const postedInvoice = await billingService.postInvoice(
          invoice.id,
          adminUser.id,
        );

        // C. Pay Invoice (Partial or Full)
        if (Math.random() > 0.3) {
          // 70% Paid
          const amount = Number(postedInvoice.total); // Total in VES
          const branchMethods = allMethods.filter(
            (m) => m.branchId === branch.id,
          );
          const method = faker.helpers.arrayElement(branchMethods);
          const account = allAccounts.find(
            (a) =>
              a.currencyId === method.currencyId && a.branchId === branch.id,
          );

          if (account) {
            const payment: any = await db
              .insert(payments)
              .values({
                invoiceId: postedInvoice.id,
                partnerId: customer.id,
                branchId: branch.id,
                methodId: method.id,
                bankAccountId: account.id,
                type: 'INCOME',
                amount: amount.toFixed(2), // VES Amount
                currencyId: method.currencyId,
                exchangeRate: dailyRate,
                reference: faker.finance.routingNumber(),
                date: faker.date.between({ from: date, to: new Date() }),
                userId: adminUser.id,
              } as any)
              .returning();

            await db.insert(paymentAllocations).values({
              paymentId: payment[0].id,
              invoiceId: postedInvoice.id,
              amount: amount.toFixed(2),
            });

            await db
              .update(invoices)
              .set({ status: 'PAID' })
              .where(eq(invoices.id, postedInvoice.id));
          }
        }

        console.log(
          `   ✅ Sale ${postedInvoice.code} ($${order.total}) -> Bs ${postedInvoice.total}`,
        );
      } catch (e) {
        console.error(`   ❌ Failed Sale: ${e.message}`);
      }
    }

    console.log('📦 Generating Purchase Orders...');
    // 3. Generate 10 Purchases
    for (let i = 0; i < 10; i++) {
      const branch = faker.helpers.arrayElement(allBranches);
      const supplier = faker.helpers.arrayElement(suppliers);
      const warehouse = allWarehouses.find((w) => w.branchId === branch.id);

      if (!warehouse) continue;

      const date = faker.date.recent({ days: 30 });
      const dailyRate = getRateForDate(date);

      const itemsCount = faker.number.int({ min: 2, max: 5 });
      const items = [];

      for (let j = 0; j < itemsCount; j++) {
        const prod = faker.helpers.arrayElement(allProducts);

        // Convert Cost USD -> VES
        const costUSD = Number(prod.cost);
        const rate = Number(dailyRate);
        const costVES = costUSD * rate;

        items.push({
          productId: prod.id,
          quantity: faker.number.int({ min: 10, max: 50 }),
          price: costVES, // USD Cost converted to VES
        });
      }

      try {
        // Create Order
        const order = await ordersService.create(
          {
            partnerId: supplier.id,
            branchId: branch.id,
            warehouseId: warehouse.id,
            currencyId: vesCurrency.id,
            items: items,
            type: 'PURCHASE',
            exchangeRate: Number(dailyRate),
          },
          adminUser.id,
        );

        await db
          .update(orders)
          .set({ date: date })
          .where(eq(orders.id, order.id));

        // Confirm
        const confirmedOrder = await ordersService.confirm(
          order.id,
          adminUser.id,
        );

        // Generate Invoice (Draft)
        const { invoice } = await ordersService.generateInvoice(
          confirmedOrder.id,
          adminUser.id,
        );

        // Set External Invoice Number (Required for Purchase)
        const controlNum = `FAC-${faker.string.numeric(6)}`;
        await db
          .update(invoices)
          .set({
            invoiceNumber: controlNum,
            date: date,
            exchangeRate: dailyRate,
          })
          .where(eq(invoices.id, invoice.id));

        // Post
        const postedInvoice = await billingService.postInvoice(
          invoice.id,
          adminUser.id,
        );
        console.log(
          `   ✅ Purchase ${postedInvoice.code} (Bs ${postedInvoice.total})`,
        );
      } catch (e) {
        console.error(`   ❌ Failed Purchase: ${e.message}`);
      }
    }

    console.log('✅ Transaction Seed Completed!');
    await app.close();
    process.exit(0);
  } catch (error) {
    console.error('❌ Fatal Error:', error);
    await app.close();
    process.exit(1);
  }
}

seedTransactions();
