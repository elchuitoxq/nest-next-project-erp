# Testing Guide & Seed Data

This guide explains how to populate the database with realistic test data for development, demos, and QA.

## 🚀 Quick Start (Development)

To reset the database and load the **Robust Test Suite** (recommended for development):

```bash
npm run db:setup:test
```

This command performs:
1.  **Reset:** Drops all tables (TRUNCATE CASCADE).
2.  **Push:** Applies the latest Drizzle schema.
3.  **Seed Test:** Runs `seed-test.ts`.

## 🧪 What Data is Included?

The robust seed (`seed-test.ts`) creates a complete simulation of a Venezuelan company structure.

### 1. Infrastructure
*   **Branches:** 2 Active Branches ("Sucursal Caracas", "Sucursal Valencia").
*   **Users:**
    *   `admin@erp.com` (Password: `admin123`) - Full Access.
    *   `ventas.ccs@erp.com` - Sales Representative (Caracas only).
    *   `almacen.val@erp.com` - Warehouse Manager (Valencia only).
    *   `tesoreria@erp.com` - Treasurer (Multi-branch).

### 2. Finance & Economy
*   **Currencies:** USD ($) and VES (Bs).
*   **Exchange Rate:** Base rate set at **~352.7063** (as of simulation date).
*   **History:** Includes 30 days of historical rates (calculated backwards from 352.7 down to ~340) to simulate realistic inflation.
*   **Treasury:**
    *   **Cash:** USD and VES petty cash boxes per branch.
    *   **Bank:** "Banesco" (VES) and "Zelle Corp" (USD).

### 3. Inventory & Operations
*   **Products:** 30 Items (Laptops, Accessories, Services) with different tax rules.
*   **Stock:** Initial inventory adjustment made 30 days ago.
*   **Transactions:**
    *   **10 Purchases:** Historical simulated purchases.
    *   **50 Sales:** Mix of paid, unpaid, and voided invoices spread over the last 30 days.
    *   **Payments:** Automatic partial and full payments registered for ~70% of sales.

## 🧹 Clean Setup (Production-like)

If you only want the bare minimum (Roles, Admin User, Base Config) without fake data:

```bash
npm run db:setup
```

## ⚠️ Troubleshooting

If you encounter foreign key errors or "relation does not exist":
1.  Ensure your `.env` has the correct `DATABASE_URL`.
2.  Run the full setup command again (`npm run db:setup:test`) as it handles the order of operations strictly.
