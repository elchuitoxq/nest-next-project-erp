# AI Context & Business Rules (ERP Venezuela)

Este documento es la fuente de verdad para el contexto del negocio, reglas fiscales y arquitectura técnica. Los agentes de IA deben consultar este archivo antes de proponer cambios significativos.

## 🏗️ Arquitectura del Sistema (Monorepo)

- **`apps/api` (NestJS):** Lógica de negocio modular, REST API, Auth JWT.
- **`apps/web` (Next.js 15):** Frontend con App Router, React Query, Tailwind y Shadcn UI.
- **`packages/db` (Drizzle):** Esquema centralizado y cliente de base de datos.

## 🏢 Estructura Organizacional y Multisede

El sistema opera bajo un modelo de **Multisucursal (Multi-Branch)** por defecto:

- Toda entidad contable (Pedidos, Facturas, Pagos, Movimientos) y financiera (**Cuentas Bancarias, Métodos de Pago, Tasa de Cambio**) **DEBE** pertenecer a un `branch_id`.
- Los usuarios tienen acceso a una o varias sucursales (tabla `users_branches`).
- **Contexto Activo:** El frontend envía el encabezado `x-branch-id`. El backend usa `BranchInterceptor` para validar el acceso y filtrar datos automáticamente, incluyendo saldos y disponibilidad de tesorería por sucursal.

## 💰 Economía y Multimoneda (USD/VES)

Venezuela opera bajo una economía dual. Reglas críticas:

- **Tasa de Cambio:** Módulo centralizado (BCV) con histórico, segregado por sucursal para permitir variaciones regionales si es necesario.
- **Dualidad Monetaria:** Todo registro guarda monto en moneda origen, tasa aplicada y equivalente en VES. Las monedas (USD/VES) se configuran por sucursal.
- **Recálculo Dinámico:** Los Pedidos pueden recalcularse (`POST /orders/:id/recalculate`) para actualizar precios según la tasa del día antes de facturar.

## ⚖️ Cumplimiento Fiscal (SENIAT)

- **Impuestos:** IVA (General 16%, Reducido, Exento) + IGTF (3% sobre pagos en divisas).
- **Retenciones:** Manejo automático de comprobantes de retención de IVA e ISLR según perfil de contribuyente (Ordinario vs Especial).
- **Libros Legales:** Generación de Libros de Compra y Venta filtrados por sucursal.

## 🛒 Módulo de Compras (Purchases)

- **Flujo**: Pedido (Opcional) -> Factura (Borrador) -> Publicada (Afecta Stock).
- **Inventario**: La entrada de mercancía se registra al crear la factura si se selecciona un almacén. El costo se convierte a la moneda base automáticamente.
- **Validación Especial**: Sanitizar payloads para evitar envíos de strings vacíos en campos UUID opcionales (`warehouseId`, `currencyId`).

## 📦 Inventario y Logística

- **Almacenes (Warehouses):** Vinculados a sucursales. Un usuario solo puede mover stock entre almacenes de sucursales a las que tiene acceso.
- **Stock en Tiempo Real:** Actualizado en Pedidos (Confirmación), Compras (Recepción) y Ajustes Manuales.
- **Préstamos (Comodatos):** Gestión de activos prestados que no generan cuenta por cobrar pero sí afectan el stock físico.

## ⚠️ Puntos de Atención (Gotchas)

1. **UUID v7:** Usamos UUID v7 para todas las llaves primarias para balancear rendimiento de inserción y unicidad.
2. **Tablas Sensibles:** La tabla `partners` tiene lógica delicada con tipos de contribuyente.
3. **Decimal Precision:** Usar `numeric` en DB y `decimal.js` en lógica para evitar errores de redondeo en moneda.

## 🛠️ Flujo de Trabajo (DevOps)

- **Reinicio de Base de Datos:** Usar siempre `npm run db:setup` desde la raíz. Este comando automatiza: `reset` (vaciado total) -> `push` (recreación de esquema) -> `seed` (poblado multi-sucursal).
- **Pruebas:** Correr `npm run test -w api` para validar cambios en el backend antes de desplegar.

## 📍 Mapa de Referencia

- **Esquema DB:** `packages/db/src/schema.ts`
- **Intercepción de Sucursal:** `apps/api/src/common/interceptors/branch.interceptor.ts`
- **Store de Autenticación (Web):** `apps/web/stores/use-auth-store.ts`
