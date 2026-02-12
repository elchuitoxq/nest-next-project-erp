import {
  LayoutDashboard,
  Briefcase,
  Package,
  DollarSign,
  Users,
  Settings,
  type LucideIcon,
} from "lucide-react";

export interface NavSubItem {
  title: string;
  url: string;
  roles?: string[];
}

export interface NavItem {
  title: string;
  url: string;
  icon?: LucideIcon;
  isActive?: boolean;
  roles: string[];
  items?: NavSubItem[];
}

export const NAV_ITEMS: NavItem[] = [
  {
    title: "Dashboard",
    url: "/dashboard",
    icon: LayoutDashboard,
    roles: [],
  },
  {
    title: "Operaciones",
    url: "/dashboard/operations",
    icon: Briefcase,
    roles: ["admin", "seller", "manager"],
    items: [
      {
        title: "Clientes y Socios",
        url: "/dashboard/operations/partners",
      },
      {
        title: "Pedidos de Venta",
        url: "/dashboard/operations/sales",
      },
      {
        title: "Órdenes de Compra",
        url: "/dashboard/operations/purchases",
      },
    ],
  },
  {
    title: "Inventario",
    url: "/dashboard/inventory",
    icon: Package,
    roles: ["admin", "warehouse", "manager"],
    items: [
      {
        title: "Productos",
        url: "/dashboard/inventory/products",
      },
      {
        title: "Almacenes",
        url: "/dashboard/inventory/warehouses",
      },
      {
        title: "Movimientos",
        url: "/dashboard/inventory/moves",
      },
    ],
  },
  {
    title: "Finanzas",
    url: "/dashboard/finance",
    icon: DollarSign,
    roles: ["admin", "accountant", "manager"],
    items: [
      {
        title: "Facturación",
        url: "/dashboard/billing/invoices",
      },
      {
        title: "Pagos y Cobranzas",
        url: "/dashboard/treasury",
      },
      {
        title: "Cierre de Caja",
        url: "/dashboard/treasury/daily-close",
      },
      {
        title: "Retenciones",
        url: "/dashboard/treasury/retentions",
      },
      {
        title: "Cuentas Bancarias",
        url: "/dashboard/treasury/accounts",
      },
      {
        title: "Reportes Fiscales",
        url: "/dashboard/treasury/reports",
      },
    ],
  },
  {
    title: "Recursos Humanos",
    url: "/dashboard/hr",
    icon: Users,
    roles: ["admin", "manager"],
    items: [
      {
        title: "Empleados",
        url: "/dashboard/hr/employees",
      },
      {
        title: "Cargos",
        url: "/dashboard/hr/positions",
      },
      {
        title: "Departamentos",
        url: "/dashboard/hr/departments",
      },
      {
        title: "Nóminas",
        url: "/dashboard/hr/payroll",
      },
      {
        title: "Novedades",
        url: "/dashboard/hr/incidents",
      },
      {
        title: "Configuración",
        url: "/dashboard/hr/settings",
      },
    ],
  },
  {
    title: "Configuración",
    url: "/dashboard/settings",
    icon: Settings,
    roles: ["admin"],
    items: [
      {
        title: "Usuarios y Roles",
        url: "/dashboard/settings/users",
      },
      {
        title: "Sucursales",
        url: "/dashboard/branches",
      },
      {
        title: "Maestro de Bancos",
        url: "/dashboard/settings/banks",
      },
      {
        title: "Conceptos ISLR",
        url: "/dashboard/settings/tax-concepts",
      },
      {
        title: "Monedas y Tasas",
        url: "/dashboard/settings/currencies",
      },
      {
        title: "Métodos de Pago",
        url: "/dashboard/settings/methods",
      },
    ],
  },
];
