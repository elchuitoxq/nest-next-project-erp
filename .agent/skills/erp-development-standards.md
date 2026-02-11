---
name: erp-development-standards
description: Use when developing new features or refactoring components in the ERP project to ensure consistency with UI, currency, database, and architecture patterns.
---

# ERP Development Standards

Use this skill when developing new features or refactoring components in the ERP project.

## 1. UI & Components (Frontend)

### Tables

- **Self-Contained:** Table components (e.g., `GlobalPaymentsTable`, `BankAccountsTable`) must contain their own `search` state and filtering logic. Do not lift search state to the page level unless strictly necessary.
- **Loading States:** Always handle `isLoading` explicitly. For complex tables with multiple queries (e.g., Data + Relations + Currencies), combine loading states:
  ```typescript
  const isLoading = isLoadingData || isLoadingRelations || isLoadingSettings;
  if (isLoading) return <Loader2 />;
  ```
  _Rationale: Prevents "undefined" errors when accessing relation maps._

### Currency & formatting

- **Dual Display:** When displaying prices/costs in grids, use the `<DualCurrencyDisplay />` component. It automatically handles the USD -> VES conversion based on system rates.
- **Formatting:** Always use `formatCurrency(amount, symbol)` from `@/lib/utils`. Never use `.toFixed(2)` directly for UI display.
- **Input:** For monetary inputs, allow numbers but display the currency symbol contextually near the label.

## 2. Forms & Mutations

- **Optimistic Updates:** Use `onSuccess` in mutations to invalidate relevant queries (`queryClient.invalidateQueries`).
- **Validation:** Validate "required fields" and "logical constraints" (e.g., allocated amount <= total) before calling the mutation.
- **Feedback:** Use `toast.success` and `toast.error` (Sonner) for user feedback.

## 3. Database & Backend (NestJS + Drizzle)

- **Scripts:** Database maintenance scripts reside in `packages/db/scripts/`.
- **Services:** API services should return Drizzle result objects directly.
- **Seeds:** Ensure seed data (`seed.ts`) populates all necessary relations (e.g., `currencyId`) to prevent frontend null pointers.

## 4. Architecture

- **Modules:** Follow the modular directory structure: `apps/web/modules/[feature]/`.
- **Hooks:** Encapsulate data fetching in custom hooks (e.g., `usePayments`, `usePartners`) inside the module's `hooks/` folder.
