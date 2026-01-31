# ERP Venezuela: Solución Monorepo Empresarial

Un sistema ERP modular y completo diseñado específicamente para el mercado venezolano, construido con tecnología de vanguardia y enfocado en la experiencia de usuario y el cumplimiento fiscal.

## 🚀 Stack Técnico (Actualizado)

- **Gestión de Monorepo:** [Turborepo](https://turbo.build/) v2.7+
- **Núcleo Frontend:** [Next.js 16](https://nextjs.org/) (App Router), React 19, React Query, Tailwind CSS 4, [Shadcn/UI](https://ui.shadcn.com/)
- **Núcleo Backend:** [NestJS 11](https://nestjs.com/) (Arquitectura Modular, Interceptors)
- **Persistencia y ORM:** PostgreSQL + [Drizzle ORM v0.45+](https://orm.drizzle.team/)
- **Confiabilidad:** TypeScript 5.7+ (Modo Estricto), Zod

## ✨ Características Principales

- **Diseño Multisucursal:** Aislamiento nativo de datos y operaciones por sucursal comercial.
- **Núcleo Bimonetario Inteligente:**
  - Manejo fluido de USD (Base) y VES (Fiscal).
  - Conversión en tiempo real en tablas y formularios.
  - Registro histórico de tasa de cambio por transacción.
- **Tesorería Avanzada:**
  - Historial de Pagos Globales con filtros y búsqueda integrada.
  - **Protección de Saldos:** Bloqueo automático de operaciones si no hay fondos suficientes.
  - **Libro de Banco:** Auditoría detallada de movimientos (Ingresos/Egresos) por cuenta.
  - Gestión de Cuentas Bancarias y Cajas (Efectivo/Digital).
  - Conciliación de facturas con pagos parciales y tasas dinámicas.
- **Inventario y Logística:** Gestión multi-almacén, stock en tiempo real y movimientos.
- **Cumplimiento Fiscal:**
  - Libros de Compra y Venta exportables a Excel (Formato SENIAT).
  - **Liquidación de Impuestos:** Dashboard quincenal con cálculo de Cuota Tributaria y generación de archivo TXT de Retenciones.
  - Cálculo automático de IGTF (3%) y Retenciones Integradas (Pago + Comprobante).
- **Recursos Humanos:** Nómina y maestros bancarios.

## 📂 Estructura del Proyecto

```bash
.
├── apps
│   ├── api          # Backend NestJS (Puerto 4000)
│   ├── web          # Frontend Next.js (Puerto 3005)
├── packages
│   ├── db           # Esquema Drizzle, Migraciones y Scripts
│   │   └── scripts  # Scripts de mantenimiento (seed, reset)
│   ├── eslint-config # Reglas de linting compartidas
│   └── typescript-config # Configuración TS base
└── docs             # Documentación técnica
```

## 🛠️ Comandos Principales

### 1. Instalación

```bash
npm install
```

### 2. Configuración de Entorno

1. **API:** Crea un archivo `.env` en `apps/api/` (ver `apps/api/README.md`):

   ```env
   DATABASE_URL="postgres://elchuitoxq:elchuitoxq@localhost:5432/erp_project_db"
   PORT=4000
   JWT_SECRET="alguna-clave-secreta-segura"
   ```

2. **Base de Datos:** Crea un archivo `.env` en `packages/db/src/` para los scripts de mantenimiento:
   ```env
   DATABASE_URL="postgres://elchuitoxq:elchuitoxq@localhost:5432/erp_project_db"
   ```

### 3. Base de Datos

El proyecto incluye scripts organizados en `packages/db/scripts`:

- **Inicializar DB (Reset + Seed):**

  ```bash
  npm run db:setup:test
  ```

  _(Crea tablas, limpia datos y genera transacciones de prueba: Usuarios, Inventario, Ventas)._

- **Panel de Administración (Drizzle Studio):**
  ```bash
  npm run db:studio
  ```

### 4. Desarrollo

Ejecuta todo el stack (API + Web) en paralelo:

```bash
npm run dev
```

- **Web:** [http://localhost:3005](http://localhost:3005)
- **API:** [http://localhost:4000](http://localhost:4000)

## 📖 Patrones de Desarrollo (Skills)

Para mantener la consistencia, el proyecto sigue estos estándares (documentados en `.agent/skills`):

1.  **Tablas:** Usar componentes Shadcn (`<Table>`) con buscadores integrados dentro del componente.
2.  **Moneda:** Usar `DualCurrencyDisplay` para mostrar precios (USD + VES) y `formatCurrency` para totales.
3.  **Carga de Datos:** Unificar estados de carga (`isLoading`) en componentes complejos para evitar errores de renderizado.

---

Construido con ❤️ para la Excelencia Empresarial Venezolana.
