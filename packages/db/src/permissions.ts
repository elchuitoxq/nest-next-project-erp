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

export const ALL_PERMISSIONS = [
  // --- DASHBOARD ---
  {
    code: PERMISSIONS.DASHBOARD.VIEW,
    description: "Ver dashboard principal y estadísticas",
    module: "dashboard",
  },

  // --- OPERATIONS ---
  {
    code: PERMISSIONS.OPERATIONS.VIEW,
    description: "Ver módulo de operaciones",
    module: "operations",
  },
  {
    code: PERMISSIONS.OPERATIONS.PARTNERS.VIEW,
    description: "Ver clientes y socios",
    module: "operations",
  },
  {
    code: PERMISSIONS.OPERATIONS.PARTNERS.CREATE,
    description: "Crear clientes",
    module: "operations",
  },
  {
    code: PERMISSIONS.OPERATIONS.PARTNERS.EDIT,
    description: "Editar clientes",
    module: "operations",
  },
  {
    code: PERMISSIONS.OPERATIONS.PARTNERS.STATEMENT,
    description: "Ver estado de cuenta de clientes",
    module: "operations",
  },
  {
    code: PERMISSIONS.OPERATIONS.SALES.VIEW,
    description: "Ver ventas",
    module: "operations",
  },
  {
    code: PERMISSIONS.OPERATIONS.SALES.CREATE,
    description: "Crear pedidos de venta",
    module: "operations",
  },
  {
    code: PERMISSIONS.OPERATIONS.SALES.APPROVE,
    description: "Aprobar pedidos de venta",
    module: "operations",
  },
  {
    code: PERMISSIONS.OPERATIONS.SALES.CANCEL,
    description: "Cancelar pedidos de venta",
    module: "operations",
  },
  {
    code: PERMISSIONS.OPERATIONS.PURCHASES.VIEW,
    description: "Ver compras",
    module: "operations",
  },
  {
    code: PERMISSIONS.OPERATIONS.PURCHASES.CREATE,
    description: "Crear órdenes de compra",
    module: "operations",
  },
  {
    code: PERMISSIONS.OPERATIONS.PURCHASES.APPROVE,
    description: "Aprobar órdenes de compra",
    module: "operations",
  },
  {
    code: PERMISSIONS.OPERATIONS.PURCHASES.CANCEL,
    description: "Cancelar órdenes de compra",
    module: "operations",
  },

  // --- INVENTORY ---
  {
    code: PERMISSIONS.INVENTORY.VIEW,
    description: "Ver módulo de inventario",
    module: "inventory",
  },
  {
    code: PERMISSIONS.INVENTORY.PRODUCTS.VIEW,
    description: "Ver productos",
    module: "inventory",
  },
  {
    code: PERMISSIONS.INVENTORY.PRODUCTS.CREATE,
    description: "Crear productos",
    module: "inventory",
  },
  {
    code: PERMISSIONS.INVENTORY.PRODUCTS.EDIT,
    description: "Editar productos",
    module: "inventory",
  },
  {
    code: PERMISSIONS.INVENTORY.PRODUCTS.DELETE,
    description: "Eliminar productos",
    module: "inventory",
  },
  {
    code: PERMISSIONS.INVENTORY.WAREHOUSES.VIEW,
    description: "Ver almacenes",
    module: "inventory",
  },
  {
    code: PERMISSIONS.INVENTORY.WAREHOUSES.CREATE,
    description: "Crear almacenes",
    module: "inventory",
  },
  {
    code: PERMISSIONS.INVENTORY.WAREHOUSES.EDIT,
    description: "Editar almacenes",
    module: "inventory",
  },
  {
    code: PERMISSIONS.INVENTORY.MOVES.VIEW,
    description: "Ver movimientos de inventario",
    module: "inventory",
  },
  {
    code: PERMISSIONS.INVENTORY.MOVES.CREATE,
    description: "Crear movimientos de inventario",
    module: "inventory",
  },
  {
    code: PERMISSIONS.INVENTORY.MOVES.APPROVE,
    description: "Aprobar movimientos de inventario",
    module: "inventory",
  },

  // --- FINANCE ---
  {
    code: PERMISSIONS.FINANCE.VIEW,
    description: "Ver módulo de finanzas",
    module: "finance",
  },
  {
    code: PERMISSIONS.FINANCE.INVOICES.VIEW,
    description: "Ver facturas",
    module: "finance",
  },
  {
    code: PERMISSIONS.FINANCE.INVOICES.CREATE,
    description: "Crear facturas",
    module: "finance",
  },
  {
    code: PERMISSIONS.FINANCE.INVOICES.VOID,
    description: "Anular facturas",
    module: "finance",
  },
  {
    code: PERMISSIONS.FINANCE.TREASURY.VIEW,
    description: "Ver tesorería",
    module: "finance",
  },
  {
    code: PERMISSIONS.FINANCE.TREASURY.CREATE_ACCOUNT,
    description: "Crear cuentas bancarias",
    module: "finance",
  },
  {
    code: PERMISSIONS.FINANCE.TREASURY.EDIT_ACCOUNT,
    description: "Editar cuentas bancarias",
    module: "finance",
  },
  {
    code: PERMISSIONS.FINANCE.TREASURY.DELETE_ACCOUNT,
    description: "Eliminar cuentas bancarias",
    module: "finance",
  },
  {
    code: PERMISSIONS.FINANCE.TREASURY.DAILY_CLOSE,
    description: "Cierre de caja",
    module: "finance",
  },
  {
    code: PERMISSIONS.FINANCE.RETENTIONS.VIEW,
    description: "Ver retenciones",
    module: "finance",
  },
  {
    code: PERMISSIONS.FINANCE.RETENTIONS.CREATE,
    description: "Crear retenciones",
    module: "finance",
  },
  {
    code: PERMISSIONS.FINANCE.PAYMENTS.VIEW,
    description: "Ver pagos",
    module: "finance",
  },
  {
    code: PERMISSIONS.FINANCE.PAYMENTS.CREATE,
    description: "Registrar pagos",
    module: "finance",
  },
  {
    code: PERMISSIONS.FINANCE.PAYMENTS.VOID,
    description: "Anular pagos",
    module: "finance",
  },
  {
    code: PERMISSIONS.FINANCE.REPORTS.VIEW,
    description: "Ver reportes financieros",
    module: "finance",
  },

  // --- HR ---
  {
    code: PERMISSIONS.HR.VIEW,
    description: "Ver módulo de RRHH",
    module: "hr",
  },
  {
    code: PERMISSIONS.HR.EMPLOYEES.VIEW,
    description: "Ver empleados",
    module: "hr",
  },
  {
    code: PERMISSIONS.HR.EMPLOYEES.CREATE,
    description: "Crear empleados",
    module: "hr",
  },
  {
    code: PERMISSIONS.HR.EMPLOYEES.EDIT,
    description: "Editar empleados",
    module: "hr",
  },
  {
    code: PERMISSIONS.HR.EMPLOYEES.MANAGE_SALARY,
    description: "Gestionar salarios",
    module: "hr",
  },
  {
    code: PERMISSIONS.HR.PAYROLL.VIEW,
    description: "Ver nómina",
    module: "hr",
  },
  {
    code: PERMISSIONS.HR.PAYROLL.PROCESS,
    description: "Procesar nómina",
    module: "hr",
  },
  {
    code: PERMISSIONS.HR.INCIDENTS.VIEW,
    description: "Ver novedades",
    module: "hr",
  },
  {
    code: PERMISSIONS.HR.INCIDENTS.CREATE,
    description: "Crear novedades",
    module: "hr",
  },
  {
    code: PERMISSIONS.HR.INCIDENTS.APPROVE,
    description: "Aprobar novedades",
    module: "hr",
  },
  {
    code: PERMISSIONS.HR.SETTINGS.VIEW,
    description: "Ver configuración RRHH",
    module: "hr",
  },
  {
    code: PERMISSIONS.HR.SETTINGS.MANAGE,
    description: "Gestionar configuración RRHH",
    module: "hr",
  },

  // --- SETTINGS ---
  {
    code: PERMISSIONS.SETTINGS.VIEW,
    description: "Ver configuraciones",
    module: "settings",
  },
  {
    code: PERMISSIONS.SETTINGS.USERS.VIEW,
    description: "Ver usuarios",
    module: "settings",
  },
  {
    code: PERMISSIONS.SETTINGS.USERS.CREATE,
    description: "Crear usuarios",
    module: "settings",
  },
  {
    code: PERMISSIONS.SETTINGS.USERS.EDIT,
    description: "Editar usuarios",
    module: "settings",
  },
  {
    code: PERMISSIONS.SETTINGS.USERS.DELETE,
    description: "Eliminar usuarios",
    module: "settings",
  },
  {
    code: PERMISSIONS.SETTINGS.ROLES.VIEW,
    description: "Ver roles",
    module: "settings",
  },
  {
    code: PERMISSIONS.SETTINGS.ROLES.MANAGE,
    description: "Gestionar roles",
    module: "settings",
  },
  {
    code: PERMISSIONS.SETTINGS.BRANCHES.VIEW,
    description: "Ver sucursales",
    module: "settings",
  },
  {
    code: PERMISSIONS.SETTINGS.BRANCHES.MANAGE,
    description: "Gestionar sucursales",
    module: "settings",
  },
  {
    code: PERMISSIONS.SETTINGS.BANKS.VIEW,
    description: "Ver bancos",
    module: "settings",
  },
  {
    code: PERMISSIONS.SETTINGS.BANKS.MANAGE,
    description: "Gestionar bancos",
    module: "settings",
  },
  {
    code: PERMISSIONS.SETTINGS.CURRENCIES.VIEW,
    description: "Ver monedas",
    module: "settings",
  },
  {
    code: PERMISSIONS.SETTINGS.CURRENCIES.MANAGE,
    description: "Gestionar monedas",
    module: "settings",
  },
  {
    code: PERMISSIONS.SETTINGS.TAXES.VIEW,
    description: "Ver impuestos",
    module: "settings",
  },
  {
    code: PERMISSIONS.SETTINGS.TAXES.MANAGE,
    description: "Gestionar impuestos",
    module: "settings",
  },
];

export const DEFAULT_ROLES = {
  ADMIN: {
    name: "admin",
    description: "Administrador del sistema con acceso total",
    permissions: ALL_PERMISSIONS.map((p) => p.code),
  },
  MANAGER: {
    name: "manager",
    description: "Gerente de operaciones y finanzas",
    permissions: [
      PERMISSIONS.DASHBOARD.VIEW,
      PERMISSIONS.OPERATIONS.VIEW,
      PERMISSIONS.OPERATIONS.PARTNERS.VIEW,
      PERMISSIONS.OPERATIONS.PARTNERS.CREATE,
      PERMISSIONS.OPERATIONS.PARTNERS.EDIT,
      PERMISSIONS.OPERATIONS.PARTNERS.STATEMENT,
      PERMISSIONS.OPERATIONS.SALES.VIEW,
      PERMISSIONS.OPERATIONS.SALES.APPROVE,
      PERMISSIONS.OPERATIONS.PURCHASES.VIEW,
      PERMISSIONS.OPERATIONS.PURCHASES.APPROVE,
      PERMISSIONS.INVENTORY.VIEW,
      PERMISSIONS.INVENTORY.PRODUCTS.VIEW,
      PERMISSIONS.INVENTORY.PRODUCTS.EDIT,
      PERMISSIONS.FINANCE.VIEW,
      PERMISSIONS.FINANCE.INVOICES.VIEW,
      PERMISSIONS.FINANCE.TREASURY.VIEW,
      PERMISSIONS.FINANCE.REPORTS.VIEW,
      PERMISSIONS.HR.VIEW,
      PERMISSIONS.HR.EMPLOYEES.VIEW,
    ],
  },
  SELLER: {
    name: "seller",
    description: "Vendedor con acceso a ventas y clientes",
    permissions: [
      PERMISSIONS.OPERATIONS.VIEW,
      PERMISSIONS.OPERATIONS.PARTNERS.VIEW,
      PERMISSIONS.OPERATIONS.PARTNERS.CREATE,
      PERMISSIONS.OPERATIONS.PARTNERS.STATEMENT,
      PERMISSIONS.OPERATIONS.SALES.VIEW,
      PERMISSIONS.OPERATIONS.SALES.CREATE,
      PERMISSIONS.INVENTORY.VIEW,
      PERMISSIONS.INVENTORY.PRODUCTS.VIEW, // To see what to sell
    ],
  },
  WAREHOUSE: {
    name: "warehouse",
    description: "Almacenista encargado de inventarios",
    permissions: [
      PERMISSIONS.INVENTORY.VIEW,
      PERMISSIONS.INVENTORY.PRODUCTS.VIEW,
      PERMISSIONS.INVENTORY.PRODUCTS.CREATE,
      PERMISSIONS.INVENTORY.PRODUCTS.EDIT,
      PERMISSIONS.INVENTORY.WAREHOUSES.VIEW,
      PERMISSIONS.INVENTORY.WAREHOUSES.CREATE,
      PERMISSIONS.INVENTORY.WAREHOUSES.EDIT,
      PERMISSIONS.INVENTORY.MOVES.VIEW,
      PERMISSIONS.INVENTORY.MOVES.CREATE,
    ],
  },
  ACCOUNTANT: {
    name: "accountant",
    description: "Contador con acceso a finanzas y tesorería",
    permissions: [
      PERMISSIONS.FINANCE.VIEW,
      PERMISSIONS.FINANCE.INVOICES.VIEW,
      PERMISSIONS.FINANCE.INVOICES.VOID,
      PERMISSIONS.FINANCE.TREASURY.VIEW,
      PERMISSIONS.FINANCE.TREASURY.CREATE_ACCOUNT,
      PERMISSIONS.FINANCE.TREASURY.EDIT_ACCOUNT,
      PERMISSIONS.FINANCE.TREASURY.DAILY_CLOSE,
      PERMISSIONS.FINANCE.REPORTS.VIEW,
      PERMISSIONS.FINANCE.RETENTIONS.VIEW,
    ],
  },
};

export type PermissionCode = string; // Simplified for now to avoid deep recursion type issues
