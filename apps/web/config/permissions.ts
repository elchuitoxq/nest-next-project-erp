export const PERMISSIONS = {
  // --- DASHBOARD ---
  DASHBOARD: {
    VIEW: "dashboard:view",
  },

  // --- OPERATIONS ---
  OPERATIONS: {
    VIEW: "operations:view",
    PARTNERS: {
      VIEW: "partners:view",
      CREATE: "partners:create",
      EDIT: "partners:edit",
      DELETE: "partners:delete",
      STATEMENT: "partners:statement",
    },
    SALES: {
      VIEW: "sales:view",
      CREATE: "sales:create",
      APPROVE: "sales:approve",
      CANCEL: "sales:cancel",
    },
    PURCHASES: {
      VIEW: "purchases:view",
      CREATE: "purchases:create",
      APPROVE: "purchases:approve",
      CANCEL: "purchases:cancel",
    },
  },

  // --- INVENTORY ---
  INVENTORY: {
    VIEW: "inventory:view",
    PRODUCTS: {
      VIEW: "products:view",
      CREATE: "products:create",
      EDIT: "products:edit",
      DELETE: "products:delete",
    },
    WAREHOUSES: {
      VIEW: "warehouses:view",
      CREATE: "warehouses:create",
      EDIT: "warehouses:edit",
    },
    MOVES: {
      VIEW: "inventory_moves:view",
      CREATE: "inventory_moves:create",
      APPROVE: "inventory_moves:approve",
    },
  },

  // --- FINANCE ---
  FINANCE: {
    VIEW: "finance:view",
    INVOICES: {
      VIEW: "invoices:view",
      CREATE: "invoices:create",
      VOID: "invoices:void",
    },
    TREASURY: {
      VIEW: "treasury:view",
      CREATE_ACCOUNT: "treasury:create_account",
      EDIT_ACCOUNT: "treasury:edit_account",
      DELETE_ACCOUNT: "treasury:delete_account",
      DAILY_CLOSE: "treasury:daily_close",
    },
    PAYMENTS: {
      VIEW: "payments:view",
      CREATE: "payments:create",
      VOID: "payments:void",
    },
    RETENTIONS: {
      VIEW: "retentions:view",
      CREATE: "retentions:create",
    },
    REPORTS: {
      VIEW: "finance_reports:view",
    },
  },

  // --- HR ---
  HR: {
    VIEW: "hr:view",
    EMPLOYEES: {
      VIEW: "employees:view",
      CREATE: "employees:create",
      EDIT: "employees:edit",
      MANAGE_SALARY: "employees:manage_salary",
    },
    PAYROLL: {
      VIEW: "payroll:view",
      PROCESS: "payroll:process",
    },
    INCIDENTS: {
      VIEW: "incidents:view",
      CREATE: "incidents:create",
      APPROVE: "incidents:approve",
    },
    SETTINGS: {
      VIEW: "hr_settings:view",
      MANAGE: "hr_settings:manage",
    },
  },

  // --- SETTINGS ---
  SETTINGS: {
    VIEW: "settings:view",
    USERS: {
      VIEW: "users:view",
      CREATE: "users:create",
      EDIT: "users:edit",
      DELETE: "users:delete",
    },
    ROLES: {
      VIEW: "roles:view",
      MANAGE: "roles:manage",
    },
    BRANCHES: {
      VIEW: "branches:view",
      MANAGE: "branches:manage",
    },
    BANKS: {
      VIEW: "banks:view",
      MANAGE: "banks:manage",
    },
    CURRENCIES: {
      VIEW: "currencies:view",
      MANAGE: "currencies:manage",
    },
    TAXES: {
      VIEW: "taxes:view",
      MANAGE: "taxes:manage",
    },
  },
} as const;
