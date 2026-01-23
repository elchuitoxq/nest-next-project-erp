---
name: implementing-strict-features
description: Use when implementing any new feature, form, or API endpoint to ensure strict data validation and Spanish localization from the start.
---

# Implementing Strict Features

This skill guides you to implement robust features with strict data validation and full Spanish localization, preventing "optional field" bugs and "english error" issues.

## 1. Frontend Validation (Zod Schemas)

When creating or modifying Zod schemas (`*.schema.ts`):

- **Spanish Messages**: ALWAYS provide a custom error message in Spanish for every validator.
  - `z.string().min(1, "El campo es requerido")`
  - `z.string().email("Email inválido")`
- **Strict Selection**: For Select/Combobox fields (IDs, Enums), enforce selection.
  - `currencyId: z.string().min(1, "Debe seleccionar una moneda")`
  - `roleIds: z.array(z.string()).min(1, "Debe seleccionar al menos un rol")`
- **Avoid Optional**: Default to required. Only use `.optional()` if the business logic explicitly allows it.
- **Coercion**: Use `z.coerce.number()` for numeric inputs coming from HTML forms.

## 2. Backend Validation (NestJS DTOs)

When creating or modifying DTOs (`*.dto.ts`):

- **Class Validator**: Use `class-validator` decorators for EVERY field.
- **Spanish Messages**: Use the `{ message: '...' }` option for every decorator.
  - `@IsNotEmpty({ message: 'El campo es requerido' })`
  - `@IsEmail({}, { message: 'Format de email inválido' })`
- **Strict Types**: Use specific validators like `@IsUUID(4)`, `@IsDateString()`, `@Min(0)`.
- **Sync with Frontend**: Ensure backend DTO requirements match or exceed frontend Zod rules.

## 3. Service Layer Exceptions

When throwing exceptions in Services:

- **Localization**: Never throw raw English errors like "User not found".
- **Format**: `throw new BadRequestException('Usuario no encontrado');`
- **Context**: Provide helpful details if safe (e.g., "Producto X no pertenece a la sucursal activa").

## 4. Global Validation Check

Before finishing:

- Verify `ValidationPipe` is enabled in `main.ts`.
- Verify the controller uses the DTO (`@Body() dto: CreateItemDto`) and NOT `any`.

## 5. Architecture & Reuse Strategy

When planning new modules:

- **Check Existing Tables**: Before creating `purchase_invoices`, check if `invoices` can be extended with a `type` discriminator.
- **Unified Logic**: If 80% of the logic (totals, taxes, payments) is shared, prefer Single Table Strategy.
- **Component Reuse**: Reuse frontend tables/dialogs by passing props (e.g. `<InvoicesTable type="PURCHASE" />`) instead of duplicating files.

## 6. Data Integrity & Audit

- **Creator Tracking**: All core entities (`invoices`, `moves`, `payments`) MUST have a `userId` field linking to the operator.
- **Snapshot Data**: Values that fluctuate (Exchange Rates, Prices, Costs) MUST be saved as a snapshot in the record at the moment of creation, never inferred from relations.
