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

import { NAV_ITEMS, type NavItem } from "@/lib/navigation";

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
    <Sidebar collapsible="icon" className="premium-glass" {...props}>
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
