# ERP Venezuela: Solución Monorepo Empresarial

Un sistema ERP modular y completo diseñado específicamente para el mercado venezolano, construido con tecnología de vanguardia y enfocado en la experiencia de usuario y el cumplimiento fiscal.

## 🚀 Stack Técnico

- **Gestión de Monorepo:** [Turborepo](https://turbo.build/)
- **Núcleo Frontend:** [Next.js 15+](https://nextjs.org/) (App Router), React Query, Tailwind CSS, [Shadcn/UI](https://ui.shadcn.com/)
- **Núcleo Backend:** [NestJS](https://nestjs.com/) (Arquitectura Modular)
- **Persistencia y ORM:** PostgreSQL + [Drizzle ORM](https://orm.drizzle.team/)
- **Confiabilidad:** TypeScript (Modo Estricto), Validación con Zod

## ✨ Características Principales

- **Diseño Multisucursal:** aislamiento nativo de datos y operaciones por sucursal comercial.
- **Núcleo Bimonetario:** manejo fluido de USD (Base/Ancla) y VES (Fiscal/Legal) con actualizaciones automatizadas de tasas BCV.
- **Inventario y Logística:** gestión multi-almacén, seguimiento de stock en tiempo real y préstamos de activos (comodatos).
- **Cumplimiento Fiscal:** soporte integrado para IVA, IGTF (3%) y gestión automatizada de retenciones (IVA/ISLR).
- **Inteligencia de Negocios:** KPIs en tiempo real y análisis de ventas integrados en el panel ejecutivo.

## 📂 Estructura del Proyecto

```bash
.
├── apps
│   ├── api          # Aplicación Backend (NestJS)
│   └── web          # Aplicación Frontend (Next.js)
├── packages
│   ├── db           # Esquema de Base de Datos, Migraciones y Cliente Drizzle
│   ├── ui           # Componentes de diseño compartidos
│   └── config       # Configuraciones compartidas de ESLint, TSConfig y construcción
└── docs             # Guías de ingeniería y arquitectura
```

## 🛠️ Comenzando (Getting Started)

### 1. Requisitos

- Node.js 18+
- PostgreSQL
- npm o pnpm

### 2. Configuración (Setup)

```bash
# Instalar dependencias
npm install
```

### 3. Base de Datos y Pruebas (Database & Testing)

El proyecto incluye un sistema de semillas (seeds) robusto para generar datos de prueba realistas.

**Opción A: Entorno de Pruebas Completo (Recomendado)**
Genera usuarios, sucursales, inventario y **transacciones reales** (Compras/Ventas/Pagos) simulando lógica de negocio.

```bash
npm run db:setup:test
```
> Esto ejecuta una estrategia híbrida: Limpieza DB -> Schema Push -> Infraestructura (DB) -> Transacciones (API).

**Opción B: Entorno Limpio (Producción)**
Solo configuración esencial (Admin, Roles, Monedas).

```bash
npm run db:setup
```

ℹ️ **Guía Detallada:** Para ver las credenciales de prueba, escenarios cubiertos y detalles de la simulación financiera, consulta la **[Guía de Pruebas (TESTING_GUIDE.md)](./TESTING_GUIDE.md)**.

### 4. Desarrollo

```bash
# Ejecutar Backend y Frontend en paralelo (Turbo)
npm run dev
```

- **Frontend:** [http://localhost:3000](http://localhost:3000)
- **API:** [http://localhost:3001](http://localhost:3001)

## 📖 Documentación

Para inmersiones técnicas profundas y detalles de lógica de negocio, consulta:

- [AI_CONTEXT.md](file:///AI_CONTEXT.md): Reglas de negocio principales y patrones arquitectónicos (Fuente principal para agentes).
- [.system_docs/architecture.md](file:///.system_docs/architecture.md): Estándares técnicos y patrones de diseño.

---

Construido con ❤️ para la Excelencia Empresarial Venezolana.
