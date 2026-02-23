import { useAuthStore } from "@/stores/use-auth-store";

export function usePermission() {
  const { user } = useAuthStore();

  const hasPermission = (permission: string) => {
    if (!user || !user.permissions) return false;
    // Admin override (optional, but good practice if we want ADMIN role to have all access)
    // However, in our plan we seeded explicit permissions for ADMIN.
    // So we stick to explicit check.
    return user.permissions.includes(permission);
  };

  const hasAnyPermission = (permissions: string[]) => {
    if (!user || !user.permissions) return false;
    return permissions.some((p) => user.permissions.includes(p));
  };

  const hasAllPermissions = (permissions: string[]) => {
    if (!user || !user.permissions) return false;
    return permissions.every((p) => user.permissions.includes(p));
  };

  return {
    hasPermission,
    hasAnyPermission,
    hasAllPermissions,
    permissions: user?.permissions || [],
  };
}
