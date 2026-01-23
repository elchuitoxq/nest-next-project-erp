# ERP Implementation Roadmap

## Phase 1: Foundation & Infrastructure 🏗️ [COMPLETED]

- [x] Monorepo Configuration (Turbo, Next.js, NestJS).
- [x] Database Schema & Drizzle Setup.
- [x] **Backend Auth**: JWT Strategy, Guards, and Decorators.
- [x] **Frontend Auth**: Login screen and session logic.
- [x] CRUD for Branches and Users.
- [x] Base UI Components (Layout, Sidebar, Header).

## Phase 2: Core Modules (Inventory & Partners) 📦 [IN PROGRESS]

- [x] **Frontend Core**: Advanced `DataTable` with server-side logic.
- [x] Backend: Partners module with Tax IDs and Credits.
- [x] Frontend: Partner Management (Customers/Suppliers).
- [x] Backend: Products Module (Pricing, Tax Flags).
- [x] Frontend: Product Catalog (Table + Detail Sheet).
- [x] **Multi-Branch Isolation**: Implemented across inventory and auth.
- [/] Stock Management (IN/OUT/Movements).

## Phase 3: Transactions & Fiscality 💰 [NEXT]

- [x] Backend: Billing logic, Tax calculations (IVA/IGTF), and Retentions.
- [x] Frontend: Invoices Management (List, Details, PDF/View).
- [x] Frontend: Payment Registration (via Treasury/Dialog).
- [ ] Frontend: Manual Invoice Creation (Wizard or Form).
- [/] Cash & Bank Management (Reconciliation).
- [ ] Dual Currency Recalculation (Orders to Invoice flow).

## Phase 4: Logistics & Analytics 🔄

- [ ] Loan Module (Asset tracking and return alerts).
- [ ] Human Resources (Payroll).
- [ ] Executive Dashboard (KPIs, Charts).
- [ ] Excel Bulk Upload & Export.
