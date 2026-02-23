"use client";

import { usePermission } from "@/hooks/use-permission";
import { ReactNode } from "react";

interface PermissionsGateProps {
  children: ReactNode;
  permission?: string;
  anyPermission?: string[];
  allPermissions?: string[];
  fallback?: ReactNode;
}

export const PermissionsGate = ({
  children,
  permission,
  anyPermission,
  allPermissions,
  fallback = null,
}: PermissionsGateProps) => {
  const { hasPermission, hasAnyPermission, hasAllPermissions } =
    usePermission();

  let isAllowed = false;

  if (permission) {
    isAllowed = hasPermission(permission);
  } else if (anyPermission) {
    isAllowed = hasAnyPermission(anyPermission);
  } else if (allPermissions) {
    isAllowed = hasAllPermissions(allPermissions);
  }

  if (!isAllowed) {
    return <>{fallback}</>;
  }

  return <>{children}</>;
};
