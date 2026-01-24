---
name: UX Writing and Style Guide
description: Guidelines for frontend text, terminology, and visual grammar to ensure consistency across the ERP.
---

# UX Writing & Style Guide

## Goal

Ensure a consistent, professional, and clear voice across the entire ERP application. Terminology should be domain-specific and unambiguous.

## Core Language Rules

1.  **Language**: Spanish (Latin American/Neutral).
2.  **Voice**: Professional but approachable. Clarity over formality.
3.  **Capitalization**: Title Case for Headers/Buttons ("Crear Nuevo Usuario"), Sentence case for descriptions.

## Domain Dictionary (Glosario)

### CRM & Entidades (Partners)

| DB Entity          | Context   | Term to Use (Spanish)     | Avoid                   |
| :----------------- | :-------- | :------------------------ | :---------------------- |
| `partners`         | Sales     | **Cliente**               | Partner, Socio, Tercero |
| `partners`         | Purchases | **Proveedor**             | Seller, Vendedor        |
| `partners.taxId`   | Venezuela | **RIF / C.I.**            | Tax ID, Identificación  |
| `partners.name`    | General   | **Razón Social** / Nombre | Name                    |
| `partners.address` | General   | **Dirección Fiscal**      | Address                 |

### Ventas (Sales)

| DB Entity        | Context    | Term to Use (Spanish) | Avoid              |
| :--------------- | :--------- | :-------------------- | :----------------- |
| `orders`         | Creation   | **Solicitar Pedido**  | Crear Orden, Pedir |
| `orders`         | Submitting | **Confirmar Pedido**  | Enviar             |
| `invoices`       | Creation   | **Emitir Factura**    | Crear Factura      |
| `items.price`    | Line Item  | **Precio Unitario**   | Precio             |
| `items.quantity` | Line Item  | **Cantidad**          | Qty                |

### Compras (Purchases)

| DB Entity                | Context | Term to Use (Spanish)       | Avoid                       |
| :----------------------- | :------ | :-------------------------- | :-------------------------- |
| `invoices`               | Input   | **Registrar Compra**        | Crear Compra, Nueva Factura |
| `invoices`               | List    | **Cuentas por Pagar**       | Compras                     |
| `invoices.invoiceNumber` | Form    | **N° de Factura / Control** | Número                      |
| `invoices.status=DRAFT`  | Status  | **Borrador**                | Draft                       |
| `invoices.status=POSTED` | Status  | **Procesada**               | Posteada, Confirmada        |
| `invoices.status=VOID`   | Status  | **Anulada**                 | Cancelada, Invalidada       |

### Inventario (Inventory)

| DB Entity                    | Context         | Term to Use               | Avoid            |
| :--------------------------- | :-------------- | :------------------------ | :--------------- |
| `warehouses`                 | General         | **Almacén**               | Depósito, Bodega |
| `warehouses`                 | Transfer Source | **Almacén de Origen**     | Desde            |
| `warehouses`                 | Transfer Target | **Almacén de Destino**    | Hacia            |
| `products.sku`               | General         | **Código / SKU**          | ID               |
| `inventoryMoves.type=IN`     | Type            | **Entrada de Inventario** | Recepción        |
| `inventoryMoves.type=OUT`    | Type            | **Salida de Inventario**  | Despacho         |
| `inventoryMoves.type=ADJUST` | Type            | **Ajuste de Inventario**  | Corrección       |

### Finanzas & Tesorería

| DB Entity         | Context | Term to Use                | Avoid         |
| :---------------- | :------ | :------------------------- | :------------ |
| `currencies`      | General | **Moneda**                 | Divisa        |
| `exchangeRates`   | General | **Tasa de Cambio**         | Tasa, Rate    |
| `payments`        | General | **Pago** / **Transacción** | Cobro         |
| `payments.method` | General | **Método de Pago**         | Forma de Pago |
| `bankAccounts`    | General | **Cuenta Bancaria**        | Banco         |

## Visual Grammar & Microcopy Rules

1.  **Dialog Titles**: Format as `[Action] [Entity]`.
    - _Example_: "Registrar Compra", "Editar Pedido", "Anular Factura".
    - _Bad_: "Nueva Compra", "Pedido #123", "Anulación".

2.  **Button Labels**: Use verbs that describe the specific action.
    - _Good_: "Confirmar Pedido", "Procesar Pago", "Publicar".
    - _Bad_: "OK", "Listo", "Si".

3.  **Empty States**: Explain _what_ is missing and _how_ to fix it.
    - _Good_: "No hay productos registrados. Presiona 'Nuevo Producto' para comenzar."
    - _Bad_: "Sin datos", "Vacío".

4.  **Error Messages**: Be specific and actionable.
    - _Good_: "El campo RIF es obligatorio."
    - _Bad_: "Error", "Campo inválido".

5.  **Success Messages**: Confirm the action + the entity.
    - _Good_: "Factura registrada exitosamente."
    - _Bad_: "Éxito", "Guardado".

6.  **Visual Indicators (Badges)**: Use consistent colors for transaction types to allow quick scanning.
    - **Income/Sales (Ingresos)**: `Teal` (`bg-teal-600`).
    - **Expense/Purchases (Egresos)**: `Orange` (`bg-orange-600`).
    - **Neutral/Info**: `Gray` or `Blue`.

## Technical Implementation (Frontend)

- **Validation**: Use Zod schemas with custom Spanish error messages (`.min(1, "El campo es obligatorio")`).
- **Dates**: Display as `DD/MM/YYYY`. Use `date-fns` with `es` locale.
- **Numbers**: Format currency with `formatCurrency(val, currencyCode)`.

## Review Checklist (For AI Agents)

- [ ] Are all labels in Spanish?
- [ ] Is "Partner" translated contextually (Cliente vs Proveedor)?
- [ ] Are buttons using specific verbs?
- [ ] Are error messages helpful?
- [ ] Is the terminology consistent with the Glossary above?
