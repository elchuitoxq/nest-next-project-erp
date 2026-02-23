---
name: securing-controllers
description: Guide for auditing and Securing NestJS Controllers with RBAC/PBAC. Use when creating new controllers or auditing existing ones to ensure granular permissions are strictly enforced.
---

# Securing Controllers (RBAC/PBAC)

This skill outlines the strict standards for securing NestJS controllers in this project. We use a **Permission-Based Access Control (PBAC)** system where every action is protected by a specific permission code.

## 🚨 Critical Security Rule

**Providing `@RequirePermission` is NOT enough.**
You MUST validly apply the `PermissionsGuard` in the `@UseGuards` decorator. Without the guard, the `@RequirePermission` decorator is just metadata and does **NOT** block access.

## audit Checklist

When reviewing or creating a controller, verify these 4 points:

1.  **Imports:** Are `RequirePermission`, `PermissionsGuard`, and `PERMISSIONS` imported?
2.  **Guards:** Is `PermissionsGuard` included in `@UseGuards`?
3.  **Decorators:** Are endpoints protected with granular permissions (`CREATE`, `EDIT`, `DELETE`)?
4.  **No Typos:** Are you using the `PERMISSIONS` constant (e.g., `PERMISSIONS.OPERATIONS.PARTNERS.CREATE`) instead of hardcoded strings?

## Implementation Pattern

```typescript
import { Controller, Get, Post, UseGuards, UseInterceptors } from '@nestjs/common';
import { JwtAuthGuard } from '../../modules/auth/jwt-auth.guard';
// 1. Import Security Primitives
import { PermissionsGuard } from '../../common/guards/permissions.guard';
import { RequirePermission } from '../../common/decorators/permissions.decorator';
import { PERMISSIONS } from '@repo/db';

@Controller('items')
// 2. Apply Guards Globally (or per method)
@UseGuards(JwtAuthGuard, PermissionsGuard)
@UseInterceptors(AuditInterceptor)
export class ItemsController {

  @Get()
  // 3. Apply Granular Permission
  @RequirePermission(PERMISSIONS.INVENTORY.ITEMS.VIEW)
  findAll() { ... }

  @Post()
  @Audit('items', 'CREATE')
  // 3. Apply Granular Permission
  @RequirePermission(PERMISSIONS.INVENTORY.ITEMS.CREATE)
  create(@Body() body: any) { ... }
}
```

## Troubleshooting Common Errors

### 1. "Cannot find name PERMISSIONS"

- **Cause:** Missing import.
- **Fix:** `import { PERMISSIONS } from '@repo/db';`

### 2. User can perform actions without permission

- **Cause:** `PermissionsGuard` is missing from `@UseGuards`.
- **Fix:** Add `PermissionsGuard` to the controller or method.

### 3. "ForbiddenResource" for Admin

- **Cause:** The Admin role might lack the specific permission in the database.
- **Fix:** Run `npm run db:seed` to ensure all permissions are assigned to the Admin role.

## Advanced Usage

### Multiple Permissions (OR Logic)

You can require _any_ of multiple permissions by passing an array to `@RequirePermission`. If the user has _at least one_ of the permissions, access is granted.

```typescript
@Get('statements/:partnerId')
@RequirePermission([
  PERMISSIONS.FINANCE.TREASURY.VIEW,       // Accountant
  PERMISSIONS.OPERATIONS.PARTNERS.STATEMENT // Seller
])
getStatement(...) { ... }
```
