---
description: Use when modifying Billing, Invoices, Orders, or Payments logic to ensure financial integrity and system stability.
---

# Maintaining Finance Module

This skill provides critical context for working with the ERP's financial core (Billing, Treasury, purchases).

## 1. UUID v7 Validation Strategy

The system uses UUID v7 for all primary keys.

- **Challenge**: Standard libraries (`isUUID` from `class-validator`) often strictly enforce UUID v4, rejecting v7 (which has time-ordered bits).
- **Solution**:
  - **Backend Validation**: Use `@IsUUID('all')` in DTOs. **NEVER** use `@IsUUID(4)`.
  - **Frontend Validation**: Sanitization is key.

## 2. DTO Sanitization (Frontend)

When submitting forms with optional UUID relations (like `warehouseId`, `currencyId`), **never send empty strings (`""`)**.

- **The Problem**: Empty strings trigger validation errors ("Invalid UUID") even if optional.
- **The Fix**: Convert empty strings to `undefined` before sending. `JSON.stringify` drops `undefined` keys, effectively cleaning the payload.

```typescript
// Example Implementation (PurchaseDialog.tsx)
const payload = {
  ...data,
  warehouseId: data.warehouseId || undefined, // Sanitize
  items: data.items.map((item) => ({
    ...item,
    currencyId: item.currencyId || undefined, // Sanitize nested
  })),
};
```

## 3. Currency & Decimal Math

- **Libraries**: Always use `decimal.js` on Backend and Frontend for ANY money calculation.
- **Precision**: Database uses `numeric(20, 10)` for exchange rates and prices.
- **Exchange Rate Logic**:
  - Rates are snapshot at the moment of Invoice/Order creation.
  - **Purchase**: Uses the rate to convert Cost (in invoice currency) to Base Cost (for Inventory WAC).
  - **Sale**: Uses the rate to display price in foreign currency.
  - **Conversion Rule**: When creating transactions in Base Currency (VES) from items priced in USD, explicitly multiply: `PriceVES = PriceUSD * ExchangeRate`. Do not rely on implicit DB defaults for critical conversions in seeds.

## 4. Purchasing Logic (Cuentas por Pagar)

- **Flow**: `Order (Purchase)` -> `Invoice (Draft)` -> `Invoice (Posted)`
- **Inventory Impact**:
  - Happens on **Invoice Creation** (if `warehouseId` is present), NOT on Payment.
  - Creates an `InventoryMove` of type `IN`.
  - Updates Product Cost (Weighted Average Cost).
- **Context**: Always pass `branchId` and `userId` to `createInvoice`.

## 5. Updates & Invalidation

- When creating/voiding/posting invoices, ensure you invalidate **BOTH** `['invoices']` (Sales) and `['purchases']` (Purchases) query keys if the action shares logic.

## 6. Common Pitfalls

- **TypeScript Errors**: If adding relations (like `user` or `exchangeRate`) to `findAll`, remember to update the Frontend `Invoice` interface type definition to match.
- **Duplicated Imports**: `drizzle-orm` schema imports can get large. Watch out for duplicated identifiers like `paymentMethods`.

## 7. Frontend Structure & Routing

- **Configuration vs Operation**:
  - **Config**: Static setup like Bank Accounts and Payment Methods lives in `/dashboard/treasury/config/`.
  - **Operations**: Daily tasks like Payments and Daily Close live in `/dashboard/treasury/`.
- **Navigation**: Always update `app-sidebar.tsx` when moving modules to preserve menu integrity.
