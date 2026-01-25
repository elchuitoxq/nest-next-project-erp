# ERP Web Client

The user interface for the ERP, built with [Next.js 15](https://nextjs.org/) (App Router). Designed with a focus on ease of use, speed, and a premium "Enterprise" feel.

## 🏗️ Technical Highlights

- **UI System:** [Shadcn/UI](https://ui.shadcn.com/) + Tailwind CSS.
- **Data Fetching:** [TanStack Query](https://tanstack.com/query) for asynchronous state management.
- **Form Management:** React Hook Form + [Zod](https://zod.dev/) for strict type-safe validations.
- **State Management:** [Zustand](https://github.com/pmndrs/zustand) for global client-side state (Auth, Branch context).
- **Responsive Layout:** Sidebar-driven admin dashboard that works seamlessly on Desktop and Tablet.

## 📂 Key Folders

- **`components/`**: Shared UI components and administrative layouts.
- **`modules/`**: Feature-specific UI logic (Inventory, Sales, Billing). Each module contains its own hooks, components, and schemas.
- **`stores/`**: Global state stores (Auth, Theme).
- **`lib/`**: API clients (Axios) and utility functions.

## 🛠️ Development

### Setup

```bash
# Handled by the monorepo root
npm install
```

### Running the App

```bash
# Development mode (port 3004)
npm run dev
```

### Premium UI Patterns

- **Edición en Contexto:** Use of `Sheet` (sideways panels) for quick edits without navigation.
- **Interactive DataTables:** Advanced tables with server-side filtering and sorting.
- **Dual Currency Display:** Specialized components to show prices in USD and VES simultaneously.

---

Part of the [ERP Venezuela Monorepo](file:///../../README.md).
