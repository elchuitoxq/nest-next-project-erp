"use client";

import * as React from "react";
import { Building2, ChevronsUpDown, Check } from "lucide-react";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar";
import { useAuthStore } from "@/stores/use-auth-store";
import { useQueryClient } from "@tanstack/react-query";

export function BranchSwitcher() {
  const { isMobile } = useSidebar();
  const { user, currentBranch, setBranch } = useAuthStore();
  const queryClient = useQueryClient();

  // Use user's assigned branches or fallbacks
  const branches = user?.branches || [];

  if (branches.length === 0 && !currentBranch) {
    return null;
  }

  const handleBranchChange = (branch: any) => {
    setBranch(branch);
    // Invalidate all queries to refresh data across the app
    queryClient.invalidateQueries();
    // Optional: Force a soft refresh if using Next.js App Router for server components
    // router.refresh();
  };

  // Fallback if no current branch is set but we have branches
  const activeBranch =
    currentBranch ||
    (branches.length > 0 ? branches[0] : { name: "Sin Sucursal", id: "" });

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <SidebarMenuButton
              size="lg"
              className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
            >
              <div className="bg-sidebar-primary text-sidebar-primary-foreground flex aspect-square size-8 items-center justify-center rounded-lg">
                <Building2 className="size-4" />
              </div>
              <div className="grid flex-1 text-left text-sm leading-tight">
                <span className="truncate font-medium">
                  {activeBranch.name}
                </span>
                <span className="truncate text-xs">Sucursal Activa</span>
              </div>
              <ChevronsUpDown className="ml-auto" />
            </SidebarMenuButton>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            className="w-(--radix-dropdown-menu-trigger-width) min-w-56 rounded-lg"
            align="start"
            side={isMobile ? "bottom" : "right"}
            sideOffset={4}
          >
            <DropdownMenuLabel className="text-muted-foreground text-xs">
              Sucursales
            </DropdownMenuLabel>
            {branches.map((branch, index) => (
              <DropdownMenuItem
                key={branch.id}
                onClick={() => handleBranchChange(branch)}
                className="gap-2 p-2"
              >
                <div className="flex size-6 items-center justify-center rounded-md border">
                  {activeBranch.id === branch.id ? (
                    <Check className="size-4" />
                  ) : (
                    <Building2 className="size-3.5 shrink-0" />
                  )}
                </div>
                {branch.name}
              </DropdownMenuItem>
            ))}
            {branches.length === 0 && (
              <DropdownMenuItem disabled>
                No tienes sucursales asignadas
              </DropdownMenuItem>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuItem>
    </SidebarMenu>
  );
}
