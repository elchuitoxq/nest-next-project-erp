# Engineering Standards & Architecture

## 🏗️ Monorepo Strategy (Turborepo)

Our system is structured to maximize code reuse and maintain clear boundaries:

- **`apps/api`**: NestJS backend. Pure business logic and database orchestration.
- **`apps/web`**: Next.js 15 frontend. Focuses on UX and data visualization.
- **`packages/db`**: The "Source of Truth" for the database. Contains Drizzle schemas, migrations, and a pre-configured database client.
- **`packages/config`**: Shared TypeScript, ESLint, and Prettier configurations to ensure consistency across the workspace.

## ⚙️ Backend Patterns (NestJS)

- **Feature-Based Modularity**: Each business domain (Sales, Inventory, etc.) has its own module, controller, and service.
- **Data Segregation**: Multi-branch support is enforced at the infrastructure level via `BranchInterceptor`. This interceptor extracts `x-branch-id` and validates user permissions.
- **Validation**: Strict use of DTOs with `class-validator` and `zod`.
- **Error Handling**: Standardized Exception Filters to provide consistent JSON error responses.

## 🎨 Frontend Standards (Premium Admin)

- **Atomic Design-ish**: Components are divided into `ui/` (primitives like buttons) and `modules/` (composed domain components).
- **Server Components (RSC)**: Used for initial data fetching where possible.
- **Mutation Pattern**: All write operations use Tanstack Query's `useMutation` with optimistic updates for a snappy feel.
- **Theming**: native support for Light/Dark mode via `next-themes`.

## 📂 Conventions

- **Audit**: Every financial or stock movement must log the `user_id` and `timestamp`.

## 🛠️ DevOps & Workflow

- **Database Initialization**: For a fresh environment or data reset, use `npm run db:setup`. This ensures the correct order: Schema Wipe (CASCADE) -> Drizzle Push -> Multi-branch Seeding.
- **CI/CD Readiness**: All modules must maintain high test coverage (`npm run test -w api`).
