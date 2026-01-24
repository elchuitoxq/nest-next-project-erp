# ERP Venezuela: Enterprise Monorepo Solution

A comprehensive, modular ERP system specifically designed for the Venezuelan market, built with a cutting-edge technical stack and a focused on user experience and fiscal compliance.

## 🚀 Technical Stack

- **Monorepo Management:** [Turborepo](https://turbo.build/)
- **Frontend Core:** [Next.js 15+](https://nextjs.org/) (App Router), React Query, Tailwind CSS, [Shadcn/UI](https://ui.shadcn.com/)
- **Backend Core:** [NestJS](https://nestjs.com/) (Modular Architecture)
- **Persistence & ORM:** PostgreSQL + [Drizzle ORM](https://orm.drizzle.team/)
- **Reliability:** TypeScript (Strict Mode), Zod Validation

## ✨ Key Features

- **Multi-Branch Design:** native isolation of data and operations per business branch.
- **Dual Currency Core:** seamless handling of USD (Base/Anchor) and VES (Fiscal/Legal) with automated BCV rate updates.
- **Inventory & Logistics:** multi-warehouse management, real-time stock tracking, and asset loans (comodatos).
- **Fiscal Compliance:** built-in support for IVA, IGTF (3%), and automated retention management (VAT/Income Tax).
- **Business Intelligence:** real-time KPIs and sales analytics integrated into the executive dashboard.

## 📂 Project Structure

```bash
.
├── apps
│   ├── api          # Backend Application (NestJS)
│   └── web          # Frontend Application (Next.js)
├── packages
│   ├── db           # Database Schema, Migrations & Drizzle Client
│   ├── ui           # Shared design system components
│   └── config       # Shared ESLint, TSConfig, and build configurations
└── docs             # Engineering and architectural guides
```

## 🛠️ Getting Started

### 1. Requirements

- Node.js 18+
- PostgreSQL
- npm or pnpm

### 2. Setup (Instalación)

```bash
# Instalar dependencias
npm install
```

### 3. Database & Testing (Base de Datos y Pruebas)

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

### 4. Development

```bash
# Run both Backend and Frontend in parallel (Turbo)
npm run dev
```

- **Frontend:** [http://localhost:3000](http://localhost:3000)
- **API:** [http://localhost:3001](http://localhost:3001)

## 📖 Documentation

For deep technical dives and business logic details, refer to:

- [AI_CONTEXT.md](file:///AI_CONTEXT.md): Core business rules and architectural patterns (Primary source for agents).
- [.system_docs/architecture.md](file:///.system_docs/architecture.md): Technical standards and design patterns.

---

Built with ❤️ for Venezuelan Business Excellence.
