# ERP API (Backend)

The core business engine of the ERP, built with [NestJS](https://nestjs.com/). It handles the REST API, authentication, business logic, and database orchestration.

## 🏗️ Architecture

- **Modular Monolith:** Logic is divided into feature-based modules (e.g., `inventory`, `billing`, `orders`).
- **Persistence:** PostgreSQL with [Drizzle ORM](https://orm.drizzle.team/).
- **Auth Strategy:** Stateless JWT with `JwtStrategy`.
- **Branch Context:** `BranchInterceptor` automatically handles branch-level data segregation via the `x-branch-id` header.

## 📂 Key Modules

- **`auth/`**: User authentication, registration, and role management.
- **`inventory/`**: Warehouse management and stock movements.
- **`orders/`**: Sales orders and real-time price recalculation (Dual Currency).
- **`billing/`**: Invoice generation and fiscal compliance (IVA/IGTF).
- **`bi/`**: Business Intelligence and KPI calculation.

## 🛠️ Development

### Setup

```bash
# Install dependencies (handled by monorepo root)
npm install
```

### Running the API

```bash
# Watch mode (automatically starts on port 3333/3001)
npm run start:dev
```

### Testing

```bash
# Run unit tests
npm run test

# Run e2e tests
npm run test:e2e
```

## 🔐 Security & Interceptors

- All endpoints required authentication via `@UseGuards(JwtAuthGuard)`.
- Multi-branch endpoints use `@UseInterceptors(BranchInterceptor)` to ensure users only access data they are authorized for.

---

Part of the [ERP Venezuela Monorepo](file:///../../README.md).
