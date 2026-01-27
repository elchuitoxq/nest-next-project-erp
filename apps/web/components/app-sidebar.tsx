"use client";

import * as React from "react";
import {
  Briefcase,
  DollarSign,
  LayoutDashboard,
  Package,
  Settings,
  Users,
  Building2,
  GalleryVerticalEnd,
  type LucideIcon,
} from "lucide-react";

import { NavMain } from "@/components/nav-main";
import { NavProjects } from "@/components/nav-projects";
import { NavUser } from "@/components/nav-user";
import { BranchSwitcher } from "@/components/branch-switcher";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarRail,
} from "@/components/ui/sidebar";
import { useAuthStore } from "@/stores/use-auth-store";

// Menu Configuration
interface NavItem {
  title: string;
  url: string;
  icon?: LucideIcon;
  isActive?: boolean;
  roles: string[]; // Roles allowed to see this item. Empty = all.
  items?: {
    title: string;
    url: string;
    roles?: string[];
  }[];
}

// This is sample data. Removed.

const NAV_ITEMS: NavItem[] = [
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
      {
        title: "Métodos de Pago",
        url: "/dashboard/treasury/methods",
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
        title: "Nóminas",
        url: "/dashboard/hr/payroll",
      },
      {
        title: "Novedades",
        url: "/dashboard/hr/incidents",
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
        title: "Conceptos de Nómina",
        url: "/dashboard/settings/payroll-concepts",
      },
      {
        title: "Conceptos ISLR",
        url: "/dashboard/settings/tax-concepts",
      },
      {
        title: "Monedas y Tasas",
        url: "/dashboard/settings/currencies",
      },
    ],
  },
];

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const { user } = useAuthStore();

  // RBAC Helper
  const hasAccess = (paramRoles: string[]) => {
    if (!paramRoles || paramRoles.length === 0) return true;
    if (!user || !user.roles) return false;

    // 'admin' has access to everything
    if (user.roles.includes("admin")) return true;

    // Check if user has ANY of the required roles for this item
    return paramRoles.some((r) => user.roles.includes(r));
  };

  const filteredNav = NAV_ITEMS.filter((item) => hasAccess(item.roles)).map(
    (item) => ({
      ...item,
      items: item.items, // Optional: Level 2 filtering could be added here if needed
    }),
  );

  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader>
        <BranchSwitcher />
      </SidebarHeader>
      <SidebarContent>
        <NavMain items={filteredNav} />
      </SidebarContent>
      <SidebarFooter>
        <NavUser
          user={{
            name: user?.name || "Usuario",
            email: user?.email || "",
            avatar: "",
          }}
        />
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  );
}
