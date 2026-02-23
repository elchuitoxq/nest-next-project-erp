import {
  LayoutDashboard,
  Briefcase,
  Package,
  DollarSign,
  Users,
  Settings,
  type LucideIcon,
} from "lucide-react";

import { PERMISSIONS, type PermissionCode } from "@repo/db/permissions";

export interface NavSubItem {
  title: string;
  url: string;
  permissions?: PermissionCode[];
}

export interface NavItem {
  title: string;
  url: string;
  icon?: LucideIcon;
  isActive?: boolean;
  permissions?: PermissionCode[];
  items?: NavSubItem[];
}

export const NAV_ITEMS: NavItem[] = [
  {
    title: "Dashboard",
    url: "/dashboard",
    icon: LayoutDashboard,
    permissions: [PERMISSIONS.DASHBOARD.VIEW],
  },
  {
    title: "Operaciones",
    url: "/dashboard/operations",
    icon: Briefcase,
    permissions: [PERMISSIONS.OPERATIONS.VIEW],
    items: [
      {
        title: "Clientes y Socios",
        url: "/dashboard/operations/partners",
        permissions: [PERMISSIONS.OPERATIONS.PARTNERS.VIEW],
      },
      {
        title: "Pedidos de Venta",
        url: "/dashboard/operations/sales",
        permissions: [PERMISSIONS.OPERATIONS.SALES.VIEW],
      },
      {
        title: "Órdenes de Compra",
        url: "/dashboard/operations/purchases",
        permissions: [PERMISSIONS.OPERATIONS.PURCHASES.VIEW],
      },
    ],
  },
  {
    title: "Inventario",
    url: "/dashboard/inventory",
    icon: Package,
    permissions: [PERMISSIONS.INVENTORY.VIEW],
    items: [
      {
        title: "Productos",
        url: "/dashboard/inventory/products",
        permissions: [PERMISSIONS.INVENTORY.PRODUCTS.VIEW],
      },
      {
        title: "Almacenes",
        url: "/dashboard/inventory/warehouses",
        permissions: [PERMISSIONS.INVENTORY.WAREHOUSES.VIEW],
      },
      {
        title: "Movimientos",
        url: "/dashboard/inventory/moves",
        permissions: [PERMISSIONS.INVENTORY.MOVES.VIEW],
      },
    ],
  },
  {
    title: "Finanzas",
    url: "/dashboard/finance",
    icon: DollarSign,
    permissions: [PERMISSIONS.FINANCE.VIEW],
    items: [
      {
        title: "Facturación",
        url: "/dashboard/billing/invoices",
        permissions: [PERMISSIONS.FINANCE.INVOICES.VIEW],
      },
      {
        title: "Pagos y Cobranzas",
        url: "/dashboard/treasury",
        permissions: [PERMISSIONS.FINANCE.TREASURY.VIEW],
      },
      {
        title: "Cierre de Caja",
        url: "/dashboard/treasury/daily-close",
        permissions: [PERMISSIONS.FINANCE.TREASURY.DAILY_CLOSE],
      },
      {
        title: "Retenciones",
        url: "/dashboard/treasury/retentions",
        permissions: [PERMISSIONS.FINANCE.RETENTIONS.VIEW],
      },
      {
        title: "Cuentas Bancarias",
        url: "/dashboard/treasury/accounts",
        permissions: [PERMISSIONS.FINANCE.TREASURY.VIEW],
      },
      {
        title: "Reportes Fiscales",
        url: "/dashboard/treasury/reports",
        permissions: [PERMISSIONS.FINANCE.REPORTS.VIEW],
      },
    ],
  },
  {
    title: "Recursos Humanos",
    url: "/dashboard/hr",
    icon: Users,
    permissions: [PERMISSIONS.HR.VIEW],
    items: [
      {
        title: "Empleados",
        url: "/dashboard/hr/employees",
        permissions: [PERMISSIONS.HR.EMPLOYEES.VIEW],
      },
      {
        title: "Cargos",
        url: "/dashboard/hr/positions",
        permissions: [PERMISSIONS.HR.EMPLOYEES.VIEW],
      },
      {
        title: "Departamentos",
        url: "/dashboard/hr/departments",
        permissions: [PERMISSIONS.HR.EMPLOYEES.VIEW],
      },
      {
        title: "Nóminas",
        url: "/dashboard/hr/payroll",
        permissions: [PERMISSIONS.HR.PAYROLL.VIEW],
      },
      {
        title: "Novedades",
        url: "/dashboard/hr/incidents",
        permissions: [PERMISSIONS.HR.INCIDENTS.VIEW],
      },
      {
        title: "Configuración",
        url: "/dashboard/hr/settings",
        permissions: [PERMISSIONS.HR.SETTINGS.VIEW],
      },
    ],
  },
  {
    title: "Configuración",
    url: "/dashboard/settings",
    icon: Settings,
    permissions: [PERMISSIONS.SETTINGS.VIEW],
    items: [
      {
        title: "Usuarios y Roles",
        url: "/dashboard/settings/users",
        permissions: [PERMISSIONS.SETTINGS.USERS.VIEW],
      },
      {
        title: "Sucursales",
        url: "/dashboard/branches",
        permissions: [PERMISSIONS.SETTINGS.BRANCHES.MANAGE],
      },
      {
        title: "Maestro de Bancos",
        url: "/dashboard/settings/banks",
        permissions: [PERMISSIONS.SETTINGS.BANKS.MANAGE],
      },
      {
        title: "Conceptos ISLR",
        url: "/dashboard/settings/tax-concepts",
        permissions: [PERMISSIONS.SETTINGS.TAXES.MANAGE],
      },
      {
        title: "Monedas y Tasas",
        url: "/dashboard/settings/currencies",
        permissions: [PERMISSIONS.SETTINGS.CURRENCIES.MANAGE],
      },
      // {
      //   title: "Métodos de Pago",
      //   url: "/dashboard/settings/methods",
      // },
    ],
  },
];
