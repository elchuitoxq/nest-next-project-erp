---
name: Secure UI Features
description: Guide for conditionally rendering UI elements based on user permissions using PermissionsGate and usePermission.
---

# Securing UI Features

Use this skill when you need to hide or disable UI elements (buttons, links, routes) based on the user's permissions.

## Core Concepts

The application uses a **Permission-Based Access Control (PBAC)** system.

- **Frontend Source of Truth:** `apps/web/config/permissions.ts` (exports `PERMISSIONS` object).
- **Backend Source of Truth:** `packages/db/src/permissions.ts` (source of all permissions).

## 1. Hiding Elements (Declarative)

Use the `<PermissionsGate>` component to wrap elements that should only be visible to authorized users.

### Imports

```typescript
import { PermissionsGate } from "@/components/auth/permissions-gate";
import { PERMISSIONS } from "@/config/permissions";
```

### Usage

**Single Permission:**

```tsx
<PermissionsGate permission={PERMISSIONS.OPERATIONS.SALES.CREATE}>
  <Button>New Order</Button>
</PermissionsGate>
```

**OR Logic (Any Permission):**
User needs _at least one_ of the listed permissions.

```tsx
<PermissionsGate
  anyPermission={[
    PERMISSIONS.FINANCE.INVOICES.CREATE,
    PERMISSIONS.OPERATIONS.SALES.APPROVE,
  ]}
>
  <Button>Generate Invoice</Button>
</PermissionsGate>
```

**AND Logic (All Permissions):**
User needs _all_ of the listed permissions.

```tsx
<PermissionsGate
  allPermissions={[
    PERMISSIONS.SETTINGS.USERS.EDIT,
    PERMISSIONS.SETTINGS.ROLES.MANAGE,
  ]}
>
  <Button>Super Admin Action</Button>
</PermissionsGate>
```

**Fallback UI:**
Optional `fallback` prop to show something else instead of nothing.

```tsx
<PermissionsGate
  permission="restricted:action"
  fallback={<span className="text-muted">No Access</span>}
>
  <SensitiveButton />
</PermissionsGate>
```

## 2. Programmatic Checks (Hooks)

Use the `usePermission` hook for logic inside functions, effects, or complex conditionals (e.g., table columns).

### Imports

```typescript
import { usePermission } from "@/hooks/use-permission";
import { PERMISSIONS } from "@/config/permissions";
```

### Usage

```typescript
const { hasPermission, hasAnyPermission, hasAllPermissions } = usePermission();

// Example: Table Actions
const canEdit = hasPermission(PERMISSIONS.OPERATIONS.PARTNERS.EDIT);
const canDelete = hasPermission(PERMISSIONS.OPERATIONS.PARTNERS.DELETE);

if (!canEdit && !canDelete) return null;

return (
  <DropdownMenu>
    {canEdit && <DropdownMenuItem>Edit</DropdownMenuItem>}
    {canDelete && <DropdownMenuItem>Delete</DropdownMenuItem>}
  </DropdownMenu>
);
```

## 3. Protecting Pages

For protecting full pages, wrapping the content in `<PermissionsGate>` is often sufficient, but for redirection, you may need a client-side effect or server-side check.

**Client-Side Redirection (Simple):**

```tsx
// inside page component
const { hasPermission } = usePermission();
const router = useRouter();

useEffect(() => {
  if (!isLoading && !hasPermission(REQUIRED_PERMISSION)) {
    router.replace("/forbidden");
  }
}, [isLoading, hasPermission, router]);
```

## Checklist

- [ ] Identify the exact permission required from `PERMISSIONS` constant.
- [ ] Determine if it's a simple hide (Gate) or complex logic (Hook).
- [ ] If adding new permissions, ensure they exist in `packages/db` and are seeded.
- [ ] Test with a user who has the permission and one who doesn't.
