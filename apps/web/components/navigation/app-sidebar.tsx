"use client";

import * as React from "react";

import { NavMain } from "@/components/navigation/nav-main";
import { NavUser } from "@/components/navigation/nav-user";
import { BranchSwitcher } from "@/components/navigation/branch-switcher";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarRail,
} from "@/components/ui/sidebar";
import { useAuthStore } from "@/stores/use-auth-store";

import { NAV_ITEMS } from "@/lib/navigation";

import { GlobalRateDisplay } from "@/components/layout/global-rate-display";

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const { user } = useAuthStore();
  const hasAccess = (itemPermissions?: string[]) => {
    // If no permissions defined, it's public (like dashboard)
    if (!itemPermissions || itemPermissions.length === 0) return true;

    // If user has no permissions loaded yet, deny
    if (!user || !user.permissions) return false;

    // Check if user has ANY of the required permissions
    return itemPermissions.some((p) => user.permissions.includes(p));
  };

  const filteredNav = NAV_ITEMS.filter((item) =>
    hasAccess(item.permissions),
  ).map((item) => ({
    ...item,
    // Filter sub-items as well
    items: item.items?.filter((subItem) => hasAccess(subItem.permissions)),
  }));
  return (
    <Sidebar collapsible="icon" className="premium-glass" {...props}>
      <SidebarHeader>
        <BranchSwitcher />
      </SidebarHeader>
      <SidebarContent>
        <NavMain items={filteredNav} />
      </SidebarContent>
      <SidebarFooter>
        <GlobalRateDisplay />
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
