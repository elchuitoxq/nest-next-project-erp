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
  - **Configuración:**
    - Cuentas Bancarias: `/dashboard/treasury/accounts`
    - Métodos de Pago: `/dashboard/treasury/methods`
    - Monedas y Tasas: `/dashboard/settings/currencies`
- **Tasa de Cambio:** Módulo centralizado (BCV) con histórico, segregado por sucursal para permitir variaciones regionales si es necesario.
- **Dualidad Monetaria:** Todo registro guarda monto en moneda origen, tasa aplicada y equivalente en VES. Las monedas (USD/VES) se configuran por sucursal.
- **Pedidos Multimoneda:** Los pedidos (`Orders`) tienen una `currencyId` explícita.
  - Al crear, se define si es Venta en USD o VES.
  - Al facturar, se respeta esa moneda.
  - **Recálculo:** Convierte precios de productos (generalmente en USD) a la moneda del pedido usando la tasa del día si es necesario.
- **Recálculo Dinámico:** Los Pedidos pueden recalcularse (`POST /orders/:id/recalculate`) para actualizar precios según la tasa del día antes de facturar.

## ⚖️ Cumplimiento Fiscal (SENIAT)

- **Impuestos:** IVA (General 16%, Reducido, Exento) + IGTF (3% sobre pagos en divisas).
  - **Lógica IGTF:** El impuesto grava el pago en divisa extranjera. Si la factura se emite en divisa (ej. USD), el sistema sugiere aplicar el 3% sobre el total (Base + IVA). Es configurable por transacción (switch "Aplicar IGTF") para cubrir casos de pago mixto o pago en Bs al cambio.
- **Retenciones:** Manejo automático. El módulo visual dedicado de "Gestión de Impuestos" fue eliminado en favor de reportes integrados.
- **Libros Legales:** Generación de Libros de Compra y Venta filtrados por sucursal.

## 🇻🇪 Cumplimiento Legal Venezuela (Strict)

> [!IMPORTANT]
> Ver reglas detalladas en `venezuelan-tax-compliance/SKILL.md`

1. **Digitalización (Providencia 0102):** Todo desarrollo de facturación debe soportar "Imprentas Digitales" (Seriales de Control) y exportación XML/JSON.
2. **Retenciones (Agente de Retención):**
   - **IVA (75%/100%):** Debe ser calculada automáticamente en Compras.
   - **ISLR (Decreto 1.808):** Requiere tabla de conceptos y sustraendo (U.T.).
   - **Comprobantes:** Obligatorio generar PDF+XML al momento del pago/abono.
   - **Automatización:** Se dispara automáticamente en `TreasuryService.registerPayment` cuando el proveedor es Contribuyente Especial (tasa defecto 75%) o tiene tasa configurada.
   - **Tablas:** `tax_retentions`, `tax_retention_lines`, `tax_concepts`.
3. **IGTF (3%):**
   - Aplicable a pagos en divisa (USD/EUR).
   - Discriminación obligatoria en factura (`totalIgtf`).
4. **Tasa BCV (Automatizada):**
   - ** Servicio:** `BCVScraperService` (Cron jobs/daily 08:00 AM).
   - **Fuente:** Scraping directo a `bcv.org.ve`.
   - **Persistencia:** Tabla `exchange_rates` con fuente `BCV_SCRAPER`.
5. **Pensiones:** Cálculo de contribución especial sobre nómina integral.
6. **Reportes Fiscales:**
   - **Ubicación Frontend:** `/dashboard/reports`.
   - **Formatos:** Excel/PDF con estructura estricta SENIAT (control secuncial).
   - **Lógica Backend:** `FiscalReportsService` (Generación de Libros).

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

## 🎨 Estándares de Diseño Frontend (Dashboard)

Para mantener la consistencia visual y funcional, todas las páginas de listado (Tablas) deben seguir este patrón estricto:

1.  **Contenedor Principal:** Todo el contenido debe estar envuelto en un componente `<Card>` de Shadcn UI.
2.  **Encabezado Integrado:**
    *   `CardHeader`: Debe contener el `CardTitle` y `CardDescription`.
    *   **Buscador Global:** El `Input` de búsqueda debe estar **dentro del CardHeader**, alineado a la derecha (`flex justify-between`).
    *   **Prohibido:** No colocar buscadores dentro del componente de la tabla (`CardContent`) para evitar duplicidad.
3.  **Estilo de Tabla:**
    *   La tabla debe estar envuelta en un `div` con clase `border rounded-md`.
    *   Los filtros específicos (Estado, Tipo) pueden ir en una barra de herramientas dentro del `CardContent` o en el `CardHeader` si hay espacio.

## 💰 Tesorería Multimoneda (Actualización)

El sistema ha evolucionado para manejar una **Tesorería Multimoneda Real**:

- **Estado de Cuenta (Wallet):**
  - Ya no se mezcla USD y VES en un solo saldo.
  - El backend (`getAccountStatement`) agrupa los saldos por moneda.
  - El frontend permite cambiar de vista mediante **Pestañas (Tabs)** por moneda (e.g., Vista USD / Vista VES).
  - La lógica de "Saldo Acumulado" se calcula dinámicamente en el frontend sobre la lista filtrada.

## 👥 Recursos Humanos (RRHH)

- **Módulo:** `apps/api/src/modules/hr`
- **Entidades Principales:**
  - `employees`: Datos personales, laborales y bancarios.
  - `banks`: Maestro de bancos con códigos SUDEBAN (0102, 0134, etc.) para archivos de pago.
  - `job_positions`: Cargos y tabuladores salariales.
  - `payroll_runs`: Cabeceras de nómina (Periodo, Total).
  - `payroll_items`: Detalle por empleado (Asignaciones, Deducciones, Neto).
- **Gestión de Pagos:**
  - Método de Pago configurable por empleado: `BANK_TRANSFER`, `CASH`, `MOBILE_PAYMENT`.
  - Soporte para generación de archivos TXT bancarios mediante códigos oficiales.
- **Nómina (Roadmap):**
  - Motor de cálculo quincenal/semanal.
  - Flujo de estados: Borrador -> Publicada -> Pagada.
  - Filtros de visualización (Por Banco vs Efectivo).
- **Gestión de Novedades (Incidencias):**
  - **Conceptos:** Definición maestra de tipos de movimiento (Ingreso/Egreso). Tabla `payroll_concept_types`.
  - **Incidencias:** Registro diario de eventos (Faltas, Bonos, Horas Extra). Tabla `payroll_incidents`.
  - **Flujo:** Las incidencias se registran como `PENDING`. Al generar la nómina (`DRAFT`), el sistema busca incidencias en el rango de fechas, las suma al cálculo y las marca como `PROCESSED`.
- **Relaciones:** Empleados vinculados a Cargos (1:1) y Moneda de Salario (1:1). Cuentas bancarias relacionadas a tabla maestra `banks`.
