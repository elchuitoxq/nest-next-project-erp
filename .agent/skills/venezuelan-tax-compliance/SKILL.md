---
description: Comprehensive guide for Venezuelan ERP compliance (SENIAT 2025-2026), including IGTF, ISLR, IVA Retentions, and Digital Billing.
---

# Venezuelan ERP Compliance (2025-2026)

This skill provides the strict business rules and technical requirements for maintaining compliance with Venezuelan laws (SENIAT, BCV).

## 1. Digital Billing & Providencia 0102

**Context**: The "Providencia Administrativa SNAT/2024/000102" mandates transition to digital billing.

- **Rules**:
  - **Serial/Control**: Must support "Imprentas Digitales" (Digital Printers) control numbers.
  - **Required Fields**: RIF, Date/Time, Detailed Description, Product Codes, Providencia Reference.
  - **Format**: Must be able to export standardized XML/JSON for SENIAT (Checking "Verifactu" or Ecuador models as reference).
  - **Storage**: Invoices must be immutable once POSTED.

## 2. Tax Retentions (Agente de Retención)

**Context**: "Sujetos Pasivos Especiales" (SPE) must retain IVA and ISLR.

- **IVA Retention**:
  - **Trigger**: Automatic upon registering a Purchase Invoice.
  - **Rate**: 75% or 100% of the Tax Amount, defined by supplier's `retentionRate`.
  - **Voucher**: Must generate a "Comprobante de Retención" (PDF + XML).
  - **Formula**: `RetentionAmount = TotalTax * (RetentionRate / 100)`.
- **ISLR Retention**:
  - **Trigger**: Payment or Crediting of Account (whichever first).
  - **Basis**: Decree 1.808. Requires a "Concepts" table (e.g., "Honorarios Profesionales", "Fletes").
  - **Formula**: `(Base * %Retention) - Sustraendo`.
  - **Sustraendo**: Dependent on `Unidad Tributaria (U.T.)`.
  - **Recommendation**: Create a `tax_concepts` table for 1.808 definition.

## 3. IGTF (Impuesto Grandes Transacciones Financieras)

**Context**: 3% tax on payments made in foreign currency (non-VES) within the banking system or designated special taxpayers.

- **Rule**: Apply 3% ONLY to the portion paid in Foreign Currency.
- **Display**: Must be discriminated in the Invoice as `totalIgtf`.
- **Exemptions**: Payments in VES (Bolívares) or Petro are exempt.
- **Reporting**: Needs a specific column in the "Libro de Ventas".

## 4. Monetary System & BCV

- **Official Rate**: All fiscal calculations MUST use the official BCV rate of the operation date.
- **Automation**: The system SHOULD pull the rate daily from BCV API (or robust scraper).
- **Historical**: Must preserve the exchange rate at the moment of the transaction (`exchangeRate` snapshot in DB).
- **Dual Display**: Prices and totals can be displayed in USD, but the Fiscal Invoice is fundamentally a VES document with foreign currency equivalent values.

## 5. Fiscal Calendar & Reporting

- **Pension Contribution**: New 2024/2025 liability. Calculated on "Total Payments to Workers" (Salaries + Bonuses).
- **Alerts**: System should warn SPEs about declaration deadlines based on their RIF terminal digit.
- **Books**: "Libro de Compra" and "Libro de Venta" are mandatory TXT/PDF outputs strictly formatted according to SENIAT specs.

## Checklist for New Features

When implementing any feature in `billing` or `accounting`:

1. [ ] Does it handle multi-currency correctly (saving rate)?
2. [ ] Does it calculate IGTF if applicable?
3. [ ] If it's a Purchase, did I ask for the Control Number?
4. [ ] If it's a Payment to a Supplier, did I check for Retentions?
