---
description: Guide for maintaining the robust test data seeding script (seed-test.ts).
---

# Maintaining Seed Data (seed-test.ts)

The file `packages/db/seed-test.ts` is the **Source of Truth** for:

- Integration Testing
- System Demos
- Load Testing
- Development Validation

## Core Principles

1.  **Do Not Touch Unless Asked**: Only update this file when the user explicitly requests it or when a schema change breaks the seed (e.g., renamed columns).
2.  **Realistic Data**: Use `@faker-js/faker` to generate data that looks real. Avoid "Test 1", "Product A". Use "Corporación Acme", "Laptop Dell XPS", etc.
3.  **Hierarchy**: Follow the 6-Level seeding strategy:
    - **L1**: Infra (Roles, Users, Branches)
    - **L1.6**: HR (Positions, Employees)
    - **L2**: Finance (Currencies, Rates, Accounts)
    - **L3**: Masters (Partners, Products)
    - **L4**: Inventory (Initial Stock)
    - **L5**: Transactions (Invoices Sales/Purchases)
    - **L6**: Treasury (Payments) -> _Delegated to API Script or Unified Logic_
4.  **Exchange Rates**: When generating historical financial data, always calculate **backwards** from the target current rate (e.g., 352.7063).
    - _Why?_ To ensure the "Today" rate in the app matches the user's expectation, while still providing a realistic curve for past charts.
    - _Method:_ `currentRate = target; for (days) { currentRate -= random_inflation; }`
5.  **No Duplication**: If `seed-test.ts` extends `seed.ts`, do NOT re-insert data for "Today" (like today's Exchange Rate) that `seed.ts` already created. Only insert historical data (Yesterday backwards).
6.  **Consistency Rules (CRITICAL)**:
    - **Retentions**: Never create just a `tax_retention` record. You MUST create the corresponding `payment` (Method: `RET_IVA_XX`) and link them via `tax_retention_lines`. This reflects the "Unified Path" where a retention is a payment document.
    - **Bank Balances**: Random payments create random balances. Always run a **Final Recalculation Step** (L7.5) that sums all Incomes/Expenses per account and updates `bank_accounts.current_balance`.
    - **Fiscal Logic**: All Invoices must have `total_tax` = `total_base` \* 0.16. Do not use random tax amounts.
    - **Sequential Codes**: For `orders` and `invoices`, use sequential strings (e.g., `PED-0001`, `A-0001`) instead of random UUIDs or random strings. This ensures the demo data looks professional and reflects the production increment logic.

## Usage

To run the robust seed (Hybrid):

```bash
npm run db:setup:test
```

(This runs: Reset DB -> Push Schema -> Run seed-test.ts -> Run seed:transactions)
