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

## 💰 Economía y Tesorería
- **Estructura Modular:**
  - **Operaciones:** Pagos, Cobros y Cierre de Caja (`/dashboard/treasury/daily-close`).
  - **Configuración:** Cuentas Bancarias y Métodos de Pago movidos a `/dashboard/treasury/config/`.
- **Tasa de Cambio:** Módulo centralizado (BCV) con histórico, segregado por sucursal para permitir variaciones regionales si es necesario.
- **Dualidad Monetaria:** Todo registro guarda monto en moneda origen, tasa aplicada y equivalente en VES. Las monedas (USD/VES) se configuran por sucursal.
- **Recálculo Dinámico:** Los Pedidos pueden recalcularse (`POST /orders/:id/recalculate`) para actualizar precios según la tasa del día antes de facturar.

## ⚖️ Cumplimiento Fiscal (SENIAT)

- **Impuestos:** IVA (General 16%, Reducido, Exento) + IGTF (3% sobre pagos en divisas).
- **Retenciones:** Manejo automático. El módulo visual dedicado de "Gestión de Impuestos" fue eliminado en favor de reportes integrados.
- **Libros Legales:** Generación de Libros de Compra y Venta filtrados por sucursal.

## 🛒 Módulo de Operaciones (Ventas y Compras)

- **Segregación de Pedidos (`Orders`)**:
  - **Ventas (`SALE`)**: Generan Salida de Stock (OUT). Gestión de Clientes.
  - **Compras (`PURCHASE`)**: Generan Entrada de Stock (IN). Gestión de Proveedores y Costos.
- **Distinción Visual (UX)**:
  - **Ventas**: Badge color `teal` (Ingreso).
  - **Compras**: Badge color `orange` (Egreso).
- **Flujo de Facturación (`Invoicing`)**:
  - **Borrador (`DRAFT`)**: Nace con código temporal (`DRAFT-{timestamp}`). No requiere número de control.
  - **Publicación (`POSTED`)**: Asigna correlativo fiscal secuencial (`A-0000X` Ventas / `C-0000X` Compras).
  - **Inventario**: Si la factura viene de una Orden Confirmada, **NO** impacta inventario (ya lo hizo la orden). Si es directa, genera el movimiento.
- **Validación de Compras**: Para emitir una factura de compra (`POSTED`), es obligatorio registrar el Número de Control (Factura del Proveedor).

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
