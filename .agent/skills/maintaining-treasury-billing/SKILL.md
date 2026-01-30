---
description: Use when modifying Billing, Invoices, Orders, or Payments logic to ensure financial integrity and system stability.
---

# Maintaining Treasury & Billing Modules

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
  - **Invoice Generation**: Invoices generated from Orders MUST default to the Fiscal Base Currency (VES). The system calculates the conversion automatically.

## 4. Purchasing Logic (Cuentas por Pagar)

- **Flow**: `Order (Purchase)` -> `Invoice (Draft)` -> `Invoice (Posted)`
- **Inventory Impact**:
  - Happens on **Invoice Creation** (if `warehouseId` is present), NOT on Payment.
  - Creates an `InventoryMove` of type `IN`.
  - Updates Product Cost (Weighted Average Cost).
- **Context**: Always pass `branchId` and `userId` to `createInvoice`.

## 5. Treasury & Bank Accounts

- **Balance Logic (Critical)**:
  - **Income (Venta/Cobro)**: `balance = balance + amount`
  - **Expense (Compra/Pago)**: `balance = balance - amount`
  - *Note:* Always validate `paymentType` before applying the math. Do not assume all payments add up.
- **Audit (Libro de Banco)**:
  - Users must be able to see the breakdown. Implement `BankAccountLedger` using `findAllPayments` filtered by `bankAccountId`.
- **Payment Intelligence**:
  - **Rate Inheritance**: If paying a specific Invoice, the payment MUST use the `invoice.exchangeRate` to avoid accounting gaps (diferencial cambiario).
  - **Manual Rate**: Only use manual/daily rate for unlinked payments (Advances).

## 6. Updates & Invalidation

- When creating/voiding/posting invoices, ensure you invalidate **BOTH** `['invoices']` (Sales) and `['purchases']` (Purchases) query keys if the action shares logic.

## 6. Common Pitfalls

- **TypeScript Errors**: If adding relations (like `user` or `exchangeRate`) to `findAll`, remember to update the Frontend `Invoice` interface type definition to match.
- **Duplicated Imports**: `drizzle-orm` schema imports can get large. Watch out for duplicated identifiers like `paymentMethods`.

## 7. Frontend Structure & Routing

- **Configuration vs Operation**:
  - **Treasury Config**: Bank Accounts (`/dashboard/treasury/accounts`) and Payment Methods (`/dashboard/treasury/methods`) are now at the root of the Treasury module.
  - **General Settings**: Currencies and Exchange Rates are managed in `/dashboard/settings/currencies`.
  - **Operations**: Daily tasks like Payments and Daily Close live in `/dashboard/treasury/`.
- **Navigation**: Always update `app-sidebar.tsx` when moving modules to preserve menu integrity.
