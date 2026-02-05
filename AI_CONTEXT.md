# AI Context & Business Rules (ERP Venezuela)

Este documento es la fuente de verdad para el contexto del negocio, reglas fiscales y arquitectura técnica. Los agentes de IA deben consultar este archivo antes de proponer cambios significativos.

## 📚 Base de Conocimiento Modular (Skills)

Este proyecto utiliza una arquitectura de conocimiento modular. Para tareas complejas, **consulta siempre la Skill específica** antes de escribir código.

### 🧠 Workflows de Agente (Core Agent Skills)

> Reglas de comportamiento y proceso de pensamiento.

- **📜 Superpoderes (Regla #1):** `.agent/skills/using-superpowers/SKILL.md` (Invocar skills antes de actuar).
- **💡 Lluvia de Ideas:** `.agent/skills/brainstorming/SKILL.md` (Pensamiento divergente antes de convergente).
- **🤖 Sub-Agentes:** `.agent/skills/subagent-driven-development/SKILL.md` & `.agent/skills/dispatching-parallel-agents/SKILL.md`.
- **✅ Verificación:** `.agent/skills/verification-before-completion/SKILL.md` (Checklist final).
- **🏁 Cierre de Tarea:** `.agent/skills/finishing-a-development-branch/SKILL.md` (Tests, Merge, Cleanup).

### 🛠️ Ingeniería & Calidad (Core Engineering)

> Estándares técnicos y mejores prácticas.

- **🛡️ Implementación Estricta:** `.agent/skills/implementing-strict-features/SKILL.md` (Validación Zod/DTO, i18n).
- **🏗️ Estándares ERP:** `.agent/skills/erp-development-standards.md`.
- **⚡ Performance UI (Tablas):** `.agent/skills/building-performant-tables/SKILL.md` (Patrón Input Lag Zero & Animaciones Estables).
- **🚀 Paginación Server-Side (Nuevo):** `.agent/skills/implementing-server-side-pagination.md` (Estándar para tablas de alto rendimiento).
- **🐛 Debugging:** `.agent/skills/systematic-debugging/SKILL.md`.
- **🧪 Testing:** `.agent/skills/test-driven-development/SKILL.md`.
- **🌿 Git Worktrees:** `.agent/skills/using-git-worktrees/SKILL.md`.
- **👀 Code Review:** `.agent/skills/requesting-code-review/SKILL.md` & `.agent/skills/receiving-code-review/SKILL.md`.

### 🎨 Experiencia de Usuario (UI/UX)

> Voz, tono y componentes visuales.

- **🖌️ UI System (Shadcn):** `.agent/skills/using-shadcn-ui/SKILL.md`.
- **✍️ UX Writing & Estilo:** `.agent/skills/ux-writing-and-style/SKILL.md` (Glosario, Español Neutro, Capitalización).

### 💼 Reglas de Negocio (Domain Specific)

> Lógica crítica del ERP Venezuela.

- **🇻🇪 Fiscalidad (CRÍTICO):** `.agent/skills/venezuelan-tax-compliance/SKILL.md` (IVA, Retenciones, IGTF, Libros).
- **💰 Tesorería & Facturación:** `.agent/skills/maintaining-treasury-billing/SKILL.md`.
- **🌱 Seed Data:** `.agent/skills/maintaining-seed-data/SKILL.md` (Reglas de consistencia financiera).

### 📝 Meta-Skills

- **Planificación:** `.agent/skills/writing-plans/SKILL.md` & `.agent/skills/executing-plans/SKILL.md`.
- **Mejora Continua:** `.agent/skills/writing-skills/SKILL.md` (Cómo crear/mejorar estas guías).

---

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

1.  **Digitalización (Providencia 0102):** Todo desarrollo de facturación debe soportar "Imprentas Digitales" (Seriales de Control) y exportación XML/JSON.
2.  **Retenciones (Agente de Retención):**
    - **IVA (75%/100%):** Debe ser calculada automáticamente en Compras.
    - **ISLR (Decreto 1.808):** Requiere tabla de conceptos y sustraendo (U.T.).
    - **Comprobantes:** Obligatorio generar PDF+XML al momento del pago/abono.
    - **Unificación de Lógica:** El sistema usa una lógica unificada en `RetentionsService`. Si se registra un pago manual con método `RET_*` (ej. `RET_IVA_75`), el sistema detecta esto y **crea automáticamente el comprobante fiscal** dentro de la misma transacción de base de datos (`tx`), garantizando integridad.
    - **Tablas:** `tax_retentions`, `tax_retention_lines`, `tax_concepts`.
3.  **IGTF (3%):**
    - Aplicable a pagos en divisa (USD/EUR).
    - Discriminación obligatoria en factura (`totalIgtf`).
4.  **Tasa BCV (Automatizada):**
    - **Servicio:** `BCVScraperService` (Cron jobs/daily 08:00 AM).
    - **Fuente:** Scraping directo a `bcv.org.ve`.
    - **Persistencia:** Tabla `exchange_rates` con fuente `BCV_SCRAPER`.
5.  **Pensiones:** Cálculo de contribución especial sobre nómina integral.
6.  **Reportes Fiscales (Libros de Compra y Venta):**
    - **Moneda:** Los libros SIEMPRE se expresan en **Bolívares (VES)**. Si la factura es en divisa, se convierte a la tasa histórica de la fecha de emisión.
    - **Columnas Críticas:**
      - **IVA / Débito Fiscal:** Muestra el 100% del impuesto de la factura (Derecho a Crédito Fiscal).
      - **IVA Retenido:** Muestra el monto retenido (75% o 100%) en una columna separada.
      - **N° Comprobante:** Obligatorio si existe retención.
    - **Dashboard de Liquidación:** Módulo integrado que cruza Débitos vs Créditos vs Retenciones para calcular la **Cuota Tributaria (A Pagar)** y genera el **TXT de Retenciones** para el portal SENIAT.

## 💰 Tesorería Multimoneda & Saldo a Favor

El sistema maneja una **Tesorería Multimoneda Real** con soporte para **Anticipos y Cruce de Saldos**:

- **Estado de Cuenta (Wallet):**
  - Los saldos se agrupan estrictamente por moneda.
  - El backend (`getAccountStatement`) calcula el saldo total y el **"Saldo Sin Ocupar"** (Anticipos + Notas de Crédito no aplicadas).
- **Saldo a Favor (Advance Payments):**
  - **Generación Automática:** Si un pago de ingreso (`INCOME`) supera el monto de las facturas seleccionadas (allocations), el sistema crea automáticamente una **Nota de Crédito** por el excedente (`NC-ADV-...`).
  - **Uso de Saldo (Cruce):** Se utilizan los métodos de pago `BALANCE_USD` y `BALANCE_VES`. Al usarlos, el sistema consume las Notas de Crédito disponibles del cliente (`credit_note_usages`), reduciendo su deuda sin mover efectivo real.
- **Libro de Banco (Audit Ledger):**
  - Historial detallado por cuenta bancaria.
  - **Protección:** Bloqueo de egresos si el saldo es insuficiente (No saldos negativos).
- **Generación de Códigos Secuenciales:**
  - **Facturas de Venta:** `A-00001`...
  - **Facturas de Compra:** `C-00001`...
  - **Pedidos de Venta:** `PED-00001`... (o estampado de tiempo para unicidad rápida).
  - **Órdenes de Compra:** `OC-00001`...
  - **Lógica Anti-Colisión:** Al generar el siguiente código, el sistema busca el último registro ignorando el estado (incluyendo `DRAFT` y `VOID`) para evitar errores de unicidad `unique_constraint`.

> [!NOTE]
> **Gestión de Métodos:** El administrador puede crear y editar métodos de pago en `/dashboard/settings/methods`, vinculándolos a divisas específicas y restringiendo qué cuentas bancarias pueden recibirlos.

---

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
- **Gestión de Novedades (Incidencias):**
  - **Conceptos:** Definición maestra de tipos de movimiento (Ingreso/Egreso). Tabla `payroll_concept_types`.
  - **Incidencias:** Registro diario de eventos (Faltas, Bonos, Horas Extra). Tabla `payroll_incidents`.
  - **Flujo:** Las incidencias se registran como `PENDING`. Al generar la nómina (`DRAFT`), el sistema busca incidencias en el rango de fechas, las suma al cálculo y las marca como `PROCESSED`.
- **Relaciones:** Empleados vinculados a Cargos (1:1) y Moneda de Salario (1:1). Cuentas bancarias relacionadas a tabla maestra `banks`.

## 📄 Generación de Documentos (PDF)

- **Tecnología:** `@react-pdf/renderer` (Client-side generation).
- **Componentes:** `InvoicePdf`, `OrderPdf`.
- **Datos Dinámicos:**
  - Los encabezados de documento consumen la configuración de la **Sucursal** (`branch`) asociada al registro (Factura/Pedido).
  - Campos obligatorios en Sucursal: RIF (`taxId`), Dirección, Teléfono, Email.
- **Moneda:**
  - Se visualizan montos con formato explícito de moneda (ej. `Bs 100.00`, `$ 25.00`).
  - **Disclaimers:** Los pedidos incluyen nota legal sobre la tasa de cambio referencial.
