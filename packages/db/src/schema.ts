import {
  pgTable,
  text,
  timestamp,
  uuid,
  boolean,
  jsonb,
  numeric,
  primaryKey,
  uniqueIndex,
} from "drizzle-orm/pg-core";
import { uuidv7 } from "uuidv7";
import { relations } from "drizzle-orm";

// --- AUTH & USERS SCHEMA ---

export const users = pgTable("users", {
  id: uuid("id")
    .primaryKey()
    .$defaultFn(() => uuidv7()),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  password: text("password").notNull(),
  refreshToken: text("refresh_token"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const roles = pgTable("roles", {
  id: uuid("id")
    .primaryKey()
    .$defaultFn(() => uuidv7()),
  name: text("name").notNull().unique(),
  description: text("description"),
});

export const branches = pgTable("branches", {
  id: uuid("id")
    .primaryKey()
    .$defaultFn(() => uuidv7()),
  name: text("name").notNull(),
  address: text("address"),
  taxId: text("tax_id"), // RIF
  phone: text("phone"),
  email: text("email"),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
});

export const usersRoles = pgTable(
  "users_roles",
  {
    userId: uuid("user_id")
      .references(() => users.id)
      .notNull(),
    roleId: uuid("role_id")
      .references(() => roles.id)
      .notNull(),
  },
  (t) => ({
    pk: primaryKey({ columns: [t.userId, t.roleId] }),
  }),
);

export const usersBranches = pgTable(
  "users_branches",
  {
    userId: uuid("user_id")
      .references(() => users.id)
      .notNull(),
    branchId: uuid("branch_id")
      .references(() => branches.id)
      .notNull(),
    isDefault: boolean("is_default").default(false),
  },
  (t) => ({
    pk: primaryKey({ columns: [t.userId, t.branchId] }),
  }),
);

export const userAppSettings = pgTable("user_app_settings", {
  id: uuid("id")
    .primaryKey()
    .$defaultFn(() => uuidv7()),
  userId: uuid("user_id")
    .references(() => users.id)
    .notNull(),
  settings: jsonb("settings").default({}), // UI preferences (columns, filters)
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const organizationModules = pgTable("organization_modules", {
  id: uuid("id")
    .primaryKey()
    .$defaultFn(() => uuidv7()),
  moduleKey: text("module_key").notNull(), // e.g., 'inventory', 'sales'
  isEnabled: boolean("is_enabled").default(false),
  branchId: uuid("branch_id").references(() => branches.id),
});

// --- CORE / PARTNERS / CURRENCIES ---

export const currencies = pgTable(
  "currencies",
  {
    id: uuid("id")
      .primaryKey()
      .$defaultFn(() => uuidv7()),
    code: text("code").notNull(), // USD, VES
    name: text("name").notNull(),
    symbol: text("symbol").notNull(),
    isBase: boolean("is_base").default(false),
  },
  (t) => ({
    unq: uniqueIndex("currencies_code_unq").on(t.code),
  }),
);

export const exchangeRates = pgTable("exchange_rates", {
  id: uuid("id")
    .primaryKey()
    .$defaultFn(() => uuidv7()),
  currencyId: uuid("currency_id")
    .references(() => currencies.id)
    .notNull(),
  rate: numeric("rate", { precision: 20, scale: 10 }).notNull(),
  date: timestamp("date").defaultNow(),
  source: text("source").default("MANUAL"), // BCV, MANUAL
});

export const taxConcepts = pgTable("tax_concepts", {
  id: uuid("id")
    .primaryKey()
    .$defaultFn(() => uuidv7()),
  code: text("code").notNull().unique(), // e.g., "001"
  name: text("name").notNull(), // "Honorarios Profesionales"
  retentionPercentage: numeric("retention_percentage", {
    precision: 5,
    scale: 2,
  }).notNull(), // 3.00, 5.00
  baseMin: numeric("base_min", { precision: 20, scale: 2 }).default("0"), // Minimum UT to apply
  sustraendo: numeric("sustraendo", { precision: 20, scale: 4 }).default("0"), // Formula factor
  isEnabled: boolean("is_enabled").default(true),
});

export const partners = pgTable("partners", {
  id: uuid("id")
    .primaryKey()
    .$defaultFn(() => uuidv7()),
  name: text("name").notNull(),
  email: text("email"),
  taxId: text("tax_id").notNull().unique(), // RIF or CI
  address: text("address"),
  phone: text("phone"),
  type: text("type").default("CUSTOMER"), // CUSTOMER, SUPPLIER, BOTH

  // Fiscal Info
  taxpayerType: text("taxpayer_type").default("ORDINARY"), // ORDINARY, SPECIAL, FORMAL
  retentionRate: numeric("retention_rate", { precision: 3, scale: 0 }).default(
    "0",
  ), // 0, 75, 100

  isSpecialTaxpayer: boolean("is_special_taxpayer").default(false),

  creditLimit: numeric("credit_limit", { precision: 20, scale: 2 }).default(
    "0",
  ),
  // ISLR Default Concept (Decreto 1808)
  islrConceptId: uuid("islr_concept_id"), // References tax_concepts.id

  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// --- INVENTORY SCHEMA ---

export const warehouses = pgTable("warehouses", {
  id: uuid("id")
    .primaryKey()
    .$defaultFn(() => uuidv7()),
  branchId: uuid("branch_id").references(() => branches.id), // Link to logic branch
  name: text("name").notNull(), // "Almacén Principal", "Depósito Tienda"
  address: text("address"),
  isActive: boolean("is_active").default(true),
});

export const productCategories = pgTable("product_categories", {
  id: uuid("id")
    .primaryKey()
    .$defaultFn(() => uuidv7()),
  name: text("name").notNull(),
  description: text("description"),
  parentId: uuid("parent_id"), // Self-reference for hierarchy if needed (manual handling in Drizzle for now)
});

export const products = pgTable("products", {
  id: uuid("id")
    .primaryKey()
    .$defaultFn(() => uuidv7()),
  sku: text("sku").notNull().unique(),
  name: text("name").notNull(),
  description: text("description"),
  categoryId: uuid("category_id").references(() => productCategories.id),

  // Pricing & Costs
  cost: numeric("cost", { precision: 20, scale: 2 }).default("0"),
  price: numeric("price", { precision: 20, scale: 2 }).default("0"),

  // Tax Flags
  isExempt: boolean("is_exempt").default(false), // Exento de IVA
  taxRate: numeric("tax_rate", { precision: 5, scale: 2 }).default("16.00"), // 16% default

  // Inventory Flags
  type: text("type").default("PHYSICAL"), // PHYSICAL, SERVICE, CONSUMABLE
  minStock: numeric("min_stock", { precision: 20, scale: 2 }).default("0"),

  currencyId: uuid("currency_id").references(() => currencies.id), // Added for USD Anchoring

  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const stock = pgTable("stock", {
  id: uuid("id")
    .primaryKey()
    .$defaultFn(() => uuidv7()),
  warehouseId: uuid("warehouse_id")
    .references(() => warehouses.id)
    .notNull(),
  productId: uuid("product_id")
    .references(() => products.id)
    .notNull(),
  quantity: numeric("quantity", { precision: 20, scale: 4 }).default("0"),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const inventoryMoves = pgTable("inventory_moves", {
  id: uuid("id")
    .primaryKey()
    .$defaultFn(() => uuidv7()),
  code: text("code").notNull(), // IN-001, OUT-005, TR-003
  type: text("type").notNull(), // IN, OUT, TRANSFER, ADJUST

  fromWarehouseId: uuid("from_warehouse_id").references(() => warehouses.id),
  toWarehouseId: uuid("to_warehouse_id").references(() => warehouses.id),

  date: timestamp("date").defaultNow(),
  note: text("note"),
  userId: uuid("user_id").references(() => users.id),
});

export const inventoryMoveLines = pgTable("inventory_move_lines", {
  id: uuid("id")
    .primaryKey()
    .$defaultFn(() => uuidv7()),
  moveId: uuid("move_id")
    .references(() => inventoryMoves.id)
    .notNull(),
  productId: uuid("product_id")
    .references(() => products.id)
    .notNull(),
  quantity: numeric("quantity", { precision: 20, scale: 4 }).notNull(),
  cost: numeric("cost", { precision: 20, scale: 2 }), // Cost at moment of move
});

// --- ORDERS & BILLING SCHEMA ---

export const orders = pgTable("orders", {
  id: uuid("id")
    .primaryKey()
    .$defaultFn(() => uuidv7()),
  code: text("code").notNull().unique(), // PED-0001
  partnerId: uuid("partner_id")
    .references(() => partners.id)
    .notNull(),
  branchId: uuid("branch_id")
    .references(() => branches.id)
    .notNull(),
  warehouseId: uuid("warehouse_id").references(() => warehouses.id), // Where stock will be taken from

  type: text("type").default("SALE"), // SALE, PURCHASE
  status: text("status").default("PENDING"), // PENDING, CONFIRMED, COMPLETED, CANCELLED
  total: numeric("total", { precision: 20, scale: 2 }).default("0"),
  exchangeRate: numeric("exchange_rate", { precision: 20, scale: 10 }).default(
    "1",
  ),
  currencyId: uuid("currency_id").references(() => currencies.id), // Transaction Currency

  date: timestamp("date").defaultNow(),
  userId: uuid("user_id").references(() => users.id),

  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const orderItems = pgTable("order_items", {
  id: uuid("id")
    .primaryKey()
    .$defaultFn(() => uuidv7()),
  orderId: uuid("order_id")
    .references(() => orders.id)
    .notNull(),
  productId: uuid("product_id")
    .references(() => products.id)
    .notNull(),
  quantity: numeric("quantity", { precision: 20, scale: 4 }).notNull(),
  price: numeric("price", { precision: 20, scale: 2 }).notNull(), // Unit Price
});

export const invoices = pgTable("invoices", {
  id: uuid("id")
    .primaryKey()
    .$defaultFn(() => uuidv7()),
  code: text("code").notNull().unique(), // Control Number e.g., A-00001
  partnerId: uuid("partner_id")
    .references(() => partners.id)
    .notNull(),
  branchId: uuid("branch_id")
    .references(() => branches.id)
    .notNull(),
  currencyId: uuid("currency_id")
    .references(() => currencies.id)
    .notNull(),
  exchangeRate: numeric("exchange_rate", {
    precision: 20,
    scale: 10,
  }).notNull(), // Snapshot

  type: text("type").default("SALE"), // SALE, PURCHASE
  invoiceNumber: text("invoice_number"), // External number for purchases
  userId: uuid("user_id").references(() => users.id),
  orderId: uuid("order_id").references(() => orders.id),

  status: text("status").default("DRAFT"), // DRAFT, POSTED, PAID, VOID
  fiscalStatus: text("fiscal_status").default("PENDING"), // PENDING, REPORTED

  totalBase: numeric("total_base", { precision: 20, scale: 2 }).default("0"),
  totalTax: numeric("total_tax", { precision: 20, scale: 2 }).default("0"),
  totalIgtf: numeric("total_igtf", { precision: 20, scale: 2 }).default("0"),
  total: numeric("total", { precision: 20, scale: 2 }).default("0"),

  date: timestamp("date").defaultNow(),
  dueDate: timestamp("due_date"),

  warehouseId: uuid("warehouse_id").references(() => warehouses.id), // Added for Purchases stock logic

  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const invoiceItems = pgTable("invoice_items", {
  id: uuid("id")
    .primaryKey()
    .$defaultFn(() => uuidv7()),
  invoiceId: uuid("invoice_id")
    .references(() => invoices.id)
    .notNull(),
  productId: uuid("product_id")
    .references(() => products.id)
    .notNull(),

  quantity: numeric("quantity", { precision: 20, scale: 4 }).notNull(),
  price: numeric("price", { precision: 20, scale: 2 }).notNull(), // Unit Price at moment of sale
  cost: numeric("cost", { precision: 20, scale: 2 }), // Unit Cost at moment of sale (for profit calc)
  taxRate: numeric("tax_rate", { precision: 5, scale: 2 }).default("0"),

  total: numeric("total", { precision: 20, scale: 2 }).notNull(),
});

export const creditNotes = pgTable("credit_notes", {
  id: uuid("id")
    .primaryKey()
    .$defaultFn(() => uuidv7()),
  code: text("code").notNull().unique(), // NC-00001
  invoiceId: uuid("invoice_id")
    .references(() => invoices.id)
    .notNull(),
  partnerId: uuid("partner_id")
    .references(() => partners.id)
    .notNull(),
  branchId: uuid("branch_id")
    .references(() => branches.id)
    .notNull(),
  warehouseId: uuid("warehouse_id").references(() => warehouses.id), // For stock return
  currencyId: uuid("currency_id")
    .references(() => currencies.id)
    .notNull(),
  exchangeRate: numeric("exchange_rate", { precision: 20, scale: 6 }).notNull(),

  status: text("status").default("DRAFT"), // DRAFT, POSTED

  totalBase: numeric("total_base", { precision: 20, scale: 2 }).default("0"),
  totalTax: numeric("total_tax", { precision: 20, scale: 2 }).default("0"),
  totalIgtf: numeric("total_igtf", { precision: 20, scale: 2 }).default("0"),
  total: numeric("total", { precision: 20, scale: 2 }).default("0"),

  date: timestamp("date").defaultNow(),
  userId: uuid("user_id").references(() => users.id),

  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const creditNoteItems = pgTable("credit_note_items", {
  id: uuid("id")
    .primaryKey()
    .$defaultFn(() => uuidv7()),
  creditNoteId: uuid("credit_note_id")
    .references(() => creditNotes.id)
    .notNull(),
  productId: uuid("product_id")
    .references(() => products.id)
    .notNull(),

  quantity: numeric("quantity", { precision: 20, scale: 4 }).notNull(),
  price: numeric("price", { precision: 20, scale: 2 }).notNull(), // Unit Price at moment of return (usually same as invoice)
  total: numeric("total", { precision: 20, scale: 2 }).notNull(),
});

// --- TAX & COMPLIANCE ---

export const taxRetentions = pgTable("tax_retentions", {
  id: uuid("id")
    .primaryKey()
    .$defaultFn(() => uuidv7()),
  code: text("code").notNull().unique(), // YYYYMM-0000X
  partnerId: uuid("partner_id")
    .references(() => partners.id)
    .notNull(),
  branchId: uuid("branch_id")
    .references(() => branches.id)
    .notNull(),
  period: text("period").notNull(), // YYYYMM e.g. "202401"

  type: text("type").notNull(), // IVA, ISLR

  totalBase: numeric("total_base", { precision: 20, scale: 2 }).notNull(),
  totalTax: numeric("total_tax", { precision: 20, scale: 2 }).default("0"),
  totalRetained: numeric("total_retained", {
    precision: 20,
    scale: 2,
  }).notNull(),

  xmlContent: text("xml_content"), // Stored XML for SENIAT

  date: timestamp("date").defaultNow(),
  userId: uuid("user_id").references(() => users.id),
  createdAt: timestamp("created_at").defaultNow(),
});

export const paymentMethods = pgTable(
  "payment_methods",
  {
    id: uuid("id")
      .primaryKey()
      .$defaultFn(() => uuidv7()),
    name: text("name").notNull(), // Efectivo USD, Zelle, Punto de Venta
    code: text("code").notNull(), // CASH_USD, ZELLE, POS
    isDigital: boolean("is_digital").default(false),
    currencyId: uuid("currency_id").references(() => currencies.id), // If restricted to one currency
    branchId: uuid("branch_id").references(() => branches.id),
  },
  (t) => ({
    unq: uniqueIndex("payment_methods_code_branch_unq").on(t.code, t.branchId),
  }),
);

export const bankAccounts = pgTable("bank_accounts", {
  id: uuid("id")
    .primaryKey()
    .$defaultFn(() => uuidv7()),
  name: text("name").notNull(), // e.g., "Banesco Principal", "Zelle Corp"
  accountNumber: text("account_number"),
  type: text("type").notNull(), // CHECKING, SAVINGS, WALLET (Zelle/Paypal)
  currencyId: uuid("currency_id")
    .references(() => currencies.id)
    .notNull(),
  branchId: uuid("branch_id").references(() => branches.id),
  currentBalance: numeric("current_balance", {
    precision: 20,
    scale: 2,
  }).default("0"),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const payments = pgTable("payments", {
  id: uuid("id")
    .primaryKey()
    .$defaultFn(() => uuidv7()),
  invoiceId: uuid("invoice_id").references(() => invoices.id), // Optional if advance payment
  partnerId: uuid("partner_id")
    .references(() => partners.id)
    .notNull(),
  branchId: uuid("branch_id")
    .references(() => branches.id)
    .notNull(),
  methodId: uuid("method_id")
    .references(() => paymentMethods.id)
    .notNull(),

  type: text("type").default("INCOME"), // INCOME, EXPENSE
  amount: numeric("amount", { precision: 20, scale: 2 }).notNull(),
  currencyId: uuid("currency_id")
    .references(() => currencies.id)
    .notNull(),
  exchangeRate: numeric("exchange_rate", {
    precision: 20,
    scale: 10,
  }).notNull(),

  bankAccountId: uuid("bank_account_id").references(() => bankAccounts.id), // Where money was deposited

  reference: text("reference"), // Transaction number
  metadata: jsonb("metadata"), // For retentions (voucher number, tax base, etc)
  date: timestamp("date").defaultNow(),
  userId: uuid("user_id").references(() => users.id),
});

export const taxRetentionLines = pgTable("tax_retention_lines", {
  id: uuid("id")
    .primaryKey()
    .$defaultFn(() => uuidv7()),
  retentionId: uuid("retention_id")
    .references(() => taxRetentions.id)
    .notNull(),
  invoiceId: uuid("invoice_id").references(() => invoices.id),
  paymentId: uuid("payment_id").references(() => payments.id), // Trigger

  baseAmount: numeric("base_amount", { precision: 20, scale: 2 }).notNull(),
  taxAmount: numeric("tax_amount", { precision: 20, scale: 2 }).default("0"),
  retainedAmount: numeric("retained_amount", {
    precision: 20,
    scale: 2,
  }).notNull(),

  conceptId: uuid("concept_id").references(() => taxConcepts.id), // For ISLR
});

// --- TREASURY & PAYMENTS ---

export const paymentAllocations = pgTable("payment_allocations", {
  id: uuid("id")
    .primaryKey()
    .$defaultFn(() => uuidv7()),
  paymentId: uuid("payment_id")
    .references(() => payments.id)
    .notNull(),
  invoiceId: uuid("invoice_id")
    .references(() => invoices.id)
    .notNull(),
  amount: numeric("amount", { precision: 20, scale: 2 }).notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const paymentMethodAccounts = pgTable(
  "payment_method_accounts",
  {
    methodId: uuid("method_id")
      .references(() => paymentMethods.id)
      .notNull(),
    bankAccountId: uuid("bank_account_id")
      .references(() => bankAccounts.id)
      .notNull(),
  },
  (t) => ({
    pk: primaryKey({ columns: [t.methodId, t.bankAccountId] }),
  }),
);

// --- LOANS ---

export const loans = pgTable("loans", {
  id: uuid("id")
    .primaryKey()
    .$defaultFn(() => uuidv7()),
  code: text("code").notNull().unique(), // PRE-001
  partnerId: uuid("partner_id")
    .references(() => partners.id)
    .notNull(),
  status: text("status").default("ACTIVE"), // ACTIVE, RETURNED, OVERDUE

  startDate: timestamp("start_date").defaultNow(),
  dueDate: timestamp("due_date"),
  returnDate: timestamp("return_date"),

  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const loanItems = pgTable("loan_items", {
  id: uuid("id")
    .primaryKey()
    .$defaultFn(() => uuidv7()),
  loanId: uuid("loan_id")
    .references(() => loans.id)
    .notNull(),
  productId: uuid("product_id")
    .references(() => products.id)
    .notNull(),
  quantity: numeric("quantity", { precision: 20, scale: 4 }).notNull(),
  serialNumber: text("serial_number"), // Optional tracking
  condition: text("condition").default("GOOD"), // GOOD, DAMAGED
});

// --- HR ---

export const jobPositions = pgTable("job_positions", {
  id: uuid("id")
    .primaryKey()
    .$defaultFn(() => uuidv7()),
  name: text("name").notNull().unique(), // Gerente, Vendedor, Analista
  description: text("description"),

  // Salary Tabulator
  currencyId: uuid("currency_id").references(() => currencies.id),
  baseSalaryMin: numeric("base_salary_min", {
    precision: 20,
    scale: 2,
  }).default("0"),
  baseSalaryMax: numeric("base_salary_max", {
    precision: 20,
    scale: 2,
  }).default("0"),

  createdAt: timestamp("created_at").defaultNow(),
});

export const banks = pgTable("banks", {
  id: uuid("id")
    .primaryKey()
    .$defaultFn(() => uuidv7()),
  name: text("name").notNull(), // "Banesco", "Mercantil"
  code: text("code").notNull().unique(), // "0134", "0105"
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
});

export const employees = pgTable("employees", {
  id: uuid("id")
    .primaryKey()
    .$defaultFn(() => uuidv7()),
  firstName: text("first_name").notNull(),
  lastName: text("last_name").notNull(),
  identityCard: text("identity_card").notNull().unique(), // CI
  email: text("email"),
  phone: text("phone"),

  positionId: uuid("position_id").references(() => jobPositions.id), // Link to Position

  hireDate: timestamp("hire_date").defaultNow(),

  // Salary Configuration
  salaryCurrencyId: uuid("salary_currency_id").references(() => currencies.id), // USD or VES
  baseSalary: numeric("base_salary", { precision: 20, scale: 2 }).notNull(), // Monthly base

  payFrequency: text("pay_frequency").default("BIWEEKLY"), // WEEKLY, BIWEEKLY, MONTHLY

  // Payment Configuration
  paymentMethod: text("payment_method").default("BANK_TRANSFER"), // BANK_TRANSFER, CASH, MOBILE_PAYMENT
  bankId: uuid("bank_id").references(() => banks.id), // Link to Bank Master

  // Legacy fields (kept for migration safety, to be deprecated)
  bankName: text("bank_name"),
  accountNumber: text("account_number"), // 20 digits
  accountType: text("account_type").default("CHECKING"), // CHECKING, SAVINGS

  status: text("status").default("ACTIVE"),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const payrollRuns = pgTable("payroll_runs", {
  id: uuid("id")
    .primaryKey()
    .$defaultFn(() => uuidv7()),
  code: text("code").notNull().unique(), // NOM-2024-01-15
  branchId: uuid("branch_id")
    .references(() => branches.id)
    .notNull(),
  frequency: text("frequency").notNull(), // WEEKLY, BIWEEKLY, MONTHLY
  currencyId: uuid("currency_id")
    .references(() => currencies.id)
    .notNull(),

  startDate: timestamp("start_date").notNull(),
  endDate: timestamp("end_date").notNull(),

  totalAmount: numeric("total_amount", { precision: 20, scale: 2 }).default(
    "0",
  ),
  status: text("status").default("DRAFT"), // DRAFT, PAID
  createdAt: timestamp("created_at").defaultNow(),
});

export const payrollItems = pgTable("payroll_items", {
  id: uuid("id")
    .primaryKey()
    .$defaultFn(() => uuidv7()),
  runId: uuid("run_id")
    .references(() => payrollRuns.id)
    .notNull(),
  employeeId: uuid("employee_id")
    .references(() => employees.id)
    .notNull(),

  baseAmount: numeric("base_amount", { precision: 20, scale: 2 }).notNull(),
  bonuses: numeric("bonuses", { precision: 20, scale: 2 }).default("0"),
  deductions: numeric("deductions", { precision: 20, scale: 2 }).default("0"),
  netTotal: numeric("net_total", { precision: 20, scale: 2 }).notNull(),
});

export const payrollConceptTypes = pgTable("payroll_concept_types", {
  id: uuid("id")
    .primaryKey()
    .$defaultFn(() => uuidv7()),
  code: text("code").notNull().unique(), // EXTRA_HOUR, LATE, BONUS
  name: text("name").notNull(),
  category: text("category").notNull(), // INCOME, DEDUCTION
  isSystem: boolean("is_system").default(false), // If true, cannot be deleted (e.g. Cestaticket)
  branchId: uuid("branch_id").references(() => branches.id),
  createdAt: timestamp("created_at").defaultNow(),
});

export const payrollIncidents = pgTable("payroll_incidents", {
  id: uuid("id")
    .primaryKey()
    .$defaultFn(() => uuidv7()),
  employeeId: uuid("employee_id")
    .references(() => employees.id)
    .notNull(),
  conceptId: uuid("concept_id")
    .references(() => payrollConceptTypes.id)
    .notNull(),

  date: timestamp("date").notNull(),
  quantity: numeric("quantity", { precision: 10, scale: 2 }).default("1"), // e.g. 2 hours
  amount: numeric("amount", { precision: 20, scale: 2 }), // Override amount or result

  status: text("status").default("PENDING"), // PENDING, PROCESSED
  processedInRunId: uuid("processed_in_run_id").references(
    () => payrollRuns.id,
  ),

  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow(),
});

// ==========================================
// RELATIONS DEFINITIONS (MUST BE AFTER TABLES)
// ==========================================

export const usersRelations = relations(users, ({ many }) => ({
  roles: many(usersRoles),
  moves: many(inventoryMoves),
  branches: many(usersBranches),
}));

export const usersBranchesRelations = relations(usersBranches, ({ one }) => ({
  user: one(users, {
    fields: [usersBranches.userId],
    references: [users.id],
  }),
  branch: one(branches, {
    fields: [usersBranches.branchId],
    references: [branches.id],
  }),
}));

export const usersRolesRelations = relations(usersRoles, ({ one }) => ({
  user: one(users, {
    fields: [usersRoles.userId],
    references: [users.id],
  }),
  role: one(roles, {
    fields: [usersRoles.roleId],
    references: [roles.id],
  }),
}));

export const currenciesRelations = relations(currencies, ({ one, many }) => ({
  exchangeRates: many(exchangeRates),
  bankAccounts: many(bankAccounts),
}));

export const exchangeRatesRelations = relations(exchangeRates, ({ one }) => ({
  currency: one(currencies, {
    fields: [exchangeRates.currencyId],
    references: [currencies.id],
  }),
}));

export const partnersRelations = relations(partners, ({ one, many }) => ({
  islrConcept: one(taxConcepts, {
    fields: [partners.islrConceptId],
    references: [taxConcepts.id],
  }),
  invoices: many(invoices),
  quotes: many(orders),
}));

export const warehousesRelations = relations(warehouses, ({ one, many }) => ({
  branch: one(branches, {
    fields: [warehouses.branchId],
    references: [branches.id],
  }),
  stock: many(stock),
  movesFrom: many(inventoryMoves, { relationName: "fromWarehouse" }),
  movesTo: many(inventoryMoves, { relationName: "toWarehouse" }),
  orders: many(orders),
}));

export const productsRelations = relations(products, ({ one, many }) => ({
  category: one(productCategories, {
    fields: [products.categoryId],
    references: [productCategories.id],
  }),
  stock: many(stock),
  moveLines: many(inventoryMoveLines),
  orderItems: many(orderItems),
}));

export const stockRelations = relations(stock, ({ one }) => ({
  warehouse: one(warehouses, {
    fields: [stock.warehouseId],
    references: [warehouses.id],
  }),
  product: one(products, {
    fields: [stock.productId],
    references: [products.id],
  }),
}));

export const inventoryMovesRelations = relations(
  inventoryMoves,
  ({ one, many }) => ({
    fromWarehouse: one(warehouses, {
      fields: [inventoryMoves.fromWarehouseId],
      references: [warehouses.id],
      relationName: "fromWarehouse",
    }),
    toWarehouse: one(warehouses, {
      fields: [inventoryMoves.toWarehouseId],
      references: [warehouses.id],
      relationName: "toWarehouse",
    }),
    user: one(users, {
      fields: [inventoryMoves.userId],
      references: [users.id],
    }),
    lines: many(inventoryMoveLines),
  }),
);

export const inventoryMoveLinesRelations = relations(
  inventoryMoveLines,
  ({ one }) => ({
    move: one(inventoryMoves, {
      fields: [inventoryMoveLines.moveId],
      references: [inventoryMoves.id],
    }),
    product: one(products, {
      fields: [inventoryMoveLines.productId],
      references: [products.id],
    }),
  }),
);

export const ordersRelations = relations(orders, ({ one, many }) => ({
  partner: one(partners, {
    fields: [orders.partnerId],
    references: [partners.id],
  }),
  branch: one(branches, {
    fields: [orders.branchId],
    references: [branches.id],
  }),
  warehouse: one(warehouses, {
    fields: [orders.warehouseId],
    references: [warehouses.id],
  }),
  currency: one(currencies, {
    fields: [orders.currencyId],
    references: [currencies.id],
  }),
  user: one(users, {
    fields: [orders.userId],
    references: [users.id],
  }),
  items: many(orderItems),
}));

export const orderItemsRelations = relations(orderItems, ({ one }) => ({
  order: one(orders, {
    fields: [orderItems.orderId],
    references: [orders.id],
  }),
  product: one(products, {
    fields: [orderItems.productId],
    references: [products.id],
  }),
}));

export const invoicesRelations = relations(invoices, ({ one, many }) => ({
  partner: one(partners, {
    fields: [invoices.partnerId],
    references: [partners.id],
  }),
  branch: one(branches, {
    fields: [invoices.branchId],
    references: [branches.id],
  }),
  currency: one(currencies, {
    fields: [invoices.currencyId],
    references: [currencies.id],
  }),
  items: many(invoiceItems),
  payments: many(payments),
}));

export const invoiceItemsRelations = relations(invoiceItems, ({ one }) => ({
  invoice: one(invoices, {
    fields: [invoiceItems.invoiceId],
    references: [invoices.id],
  }),
  product: one(products, {
    fields: [invoiceItems.productId],
    references: [products.id],
  }),
}));

export const creditNotesRelations = relations(creditNotes, ({ one, many }) => ({
  invoice: one(invoices, {
    fields: [creditNotes.invoiceId],
    references: [invoices.id],
  }),
  partner: one(partners, {
    fields: [creditNotes.partnerId],
    references: [partners.id],
  }),
  branch: one(branches, {
    fields: [creditNotes.branchId],
    references: [branches.id],
  }),
  warehouse: one(warehouses, {
    fields: [creditNotes.warehouseId],
    references: [warehouses.id],
  }),
  currency: one(currencies, {
    fields: [creditNotes.currencyId],
    references: [currencies.id],
  }),
  user: one(users, {
    fields: [creditNotes.userId],
    references: [users.id],
  }),
  items: many(creditNoteItems),
}));

export const creditNoteItemsRelations = relations(
  creditNoteItems,
  ({ one }) => ({
    creditNote: one(creditNotes, {
      fields: [creditNoteItems.creditNoteId],
      references: [creditNotes.id],
    }),
    product: one(products, {
      fields: [creditNoteItems.productId],
      references: [products.id],
    }),
  }),
);

export const taxRetentionsRelations = relations(
  taxRetentions,
  ({ one, many }) => ({
    partner: one(partners, {
      fields: [taxRetentions.partnerId],
      references: [partners.id],
    }),
    branch: one(branches, {
      fields: [taxRetentions.branchId],
      references: [branches.id],
    }),
    lines: many(taxRetentionLines),
  }),
);

export const taxRetentionLinesRelations = relations(
  taxRetentionLines,
  ({ one }) => ({
    retention: one(taxRetentions, {
      fields: [taxRetentionLines.retentionId],
      references: [taxRetentions.id],
    }),
    invoice: one(invoices, {
      fields: [taxRetentionLines.invoiceId],
      references: [invoices.id],
    }),
    payment: one(payments, {
      fields: [taxRetentionLines.paymentId],
      references: [payments.id],
    }),
    concept: one(taxConcepts, {
      fields: [taxRetentionLines.conceptId],
      references: [taxConcepts.id],
    }),
  }),
);

export const paymentMethodsRelations = relations(
  paymentMethods,
  ({ one, many }) => ({
    currency: one(currencies, {
      fields: [paymentMethods.currencyId],
      references: [currencies.id],
    }),
    branch: one(branches, {
      fields: [paymentMethods.branchId],
      references: [branches.id],
    }),
    allowedAccounts: many(paymentMethodAccounts),
  }),
);

export const bankAccountsRelations = relations(
  bankAccounts,
  ({ one, many }) => ({
    currency: one(currencies, {
      fields: [bankAccounts.currencyId],
      references: [currencies.id],
    }),
    branch: one(branches, {
      fields: [bankAccounts.branchId],
      references: [branches.id],
    }),
    payments: many(payments),
    allowedMethods: many(paymentMethodAccounts),
  }),
);

export const paymentsRelations = relations(payments, ({ one, many }) => ({
  invoice: one(invoices, {
    fields: [payments.invoiceId],
    references: [invoices.id],
  }),
  partner: one(partners, {
    fields: [payments.partnerId],
    references: [partners.id],
  }),
  method: one(paymentMethods, {
    fields: [payments.methodId],
    references: [paymentMethods.id],
  }),
  currency: one(currencies, {
    fields: [payments.currencyId],
    references: [currencies.id],
  }),
  bankAccount: one(bankAccounts, {
    fields: [payments.bankAccountId],
    references: [bankAccounts.id],
  }),
  user: one(users, {
    fields: [payments.userId],
    references: [users.id],
  }),
  allocations: many(paymentAllocations),
}));

export const paymentAllocationsRelations = relations(
  paymentAllocations,
  ({ one }) => ({
    payment: one(payments, {
      fields: [paymentAllocations.paymentId],
      references: [payments.id],
    }),
    invoice: one(invoices, {
      fields: [paymentAllocations.invoiceId],
      references: [invoices.id],
    }),
  }),
);

export const paymentMethodAccountsRelations = relations(
  paymentMethodAccounts,
  ({ one }) => ({
    method: one(paymentMethods, {
      fields: [paymentMethodAccounts.methodId],
      references: [paymentMethods.id],
    }),
    bankAccount: one(bankAccounts, {
      fields: [paymentMethodAccounts.bankAccountId],
      references: [bankAccounts.id],
    }),
  }),
);

export const jobPositionsRelations = relations(
  jobPositions,
  ({ one, many }) => ({
    currency: one(currencies, {
      fields: [jobPositions.currencyId],
      references: [currencies.id],
    }),
    employees: many(employees),
  }),
);

export const employeesRelations = relations(employees, ({ one, many }) => ({
  position: one(jobPositions, {
    fields: [employees.positionId],
    references: [jobPositions.id],
  }),
  salaryCurrency: one(currencies, {
    fields: [employees.salaryCurrencyId],
    references: [currencies.id],
  }),
  bank: one(banks, {
    fields: [employees.bankId],
    references: [banks.id],
  }),
  payrollItems: many(payrollItems),
  incidents: many(payrollIncidents),
}));

export const payrollRunsRelations = relations(payrollRuns, ({ one, many }) => ({
  branch: one(branches, {
    fields: [payrollRuns.branchId],
    references: [branches.id],
  }),
  currency: one(currencies, {
    fields: [payrollRuns.currencyId],
    references: [currencies.id],
  }),
  items: many(payrollItems),
  processedIncidents: many(payrollIncidents, {
    relationName: "processedInRun",
  }),
}));

export const payrollItemsRelations = relations(payrollItems, ({ one }) => ({
  run: one(payrollRuns, {
    fields: [payrollItems.runId],
    references: [payrollRuns.id],
  }),
  employee: one(employees, {
    fields: [payrollItems.employeeId],
    references: [employees.id],
  }),
}));

export const payrollConceptTypesRelations = relations(
  payrollConceptTypes,
  ({ one, many }) => ({
    branch: one(branches, {
      fields: [payrollConceptTypes.branchId],
      references: [branches.id],
    }),
    incidents: many(payrollIncidents),
  }),
);

export const payrollIncidentsRelations = relations(
  payrollIncidents,
  ({ one }) => ({
    employee: one(employees, {
      fields: [payrollIncidents.employeeId],
      references: [employees.id],
    }),
    concept: one(payrollConceptTypes, {
      fields: [payrollIncidents.conceptId],
      references: [payrollConceptTypes.id],
    }),
    processedInRun: one(payrollRuns, {
      fields: [payrollIncidents.processedInRunId],
      references: [payrollRuns.id],
    }),
  }),
);
