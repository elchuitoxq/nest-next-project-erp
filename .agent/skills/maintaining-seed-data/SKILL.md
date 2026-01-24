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
    - **L6**: Treasury (Payments) -> *Delegated to API Script*
4.  **Exchange Rates**: When generating historical financial data, always calculate **backwards** from the target current rate (e.g., 352.7063).
    - *Why?* To ensure the "Today" rate in the app matches the user's expectation, while still providing a realistic curve for past charts.
    - *Method:* `currentRate = target; for (days) { currentRate -= random_inflation; }`
5.  **No Duplication**: If `seed-test.ts` extends `seed.ts`, do NOT re-insert data for "Today" (like today's Exchange Rate) that `seed.ts` already created. Only insert historical data (Yesterday backwards).
6.  **Hybrid Strategy (Robustness)**:
    - **Infra (DB Level)**: `seed-test.ts` creates static data (Users, Branches, Historical Rates, Stock).
    - **Transactions (API Level)**: Use `seed:transactions` (NestJS script) to generate Orders, Invoices, and Payments.
    - *Why?* This ensures test data respects **real business logic** (tax calc, conversions, stock moves, correlatives) instead of inserting raw/potentially invalid rows.

## Usage

To run the robust seed (Hybrid):
```bash
npm run db:setup:test
```
(This runs: Reset DB -> Push Schema -> Run seed-test.ts -> Run seed:transactions)
