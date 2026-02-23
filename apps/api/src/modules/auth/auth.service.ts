import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import {
  db,
  users,
  usersRoles,
  roles,
  usersBranches,
  branches,
  permissions,
  rolesPermissions,
} from '@repo/db';
import { eq } from 'drizzle-orm';
import * as bcrypt from 'bcrypt';

import { ConfigService } from '@nestjs/config';

@Injectable()
export class AuthService {
  constructor(
    private jwtService: JwtService,
    private configService: ConfigService,
  ) {}

  async validateUser(email: string, pass: string): Promise<any> {
    const userWithRolesAndPermissions = await db
      .select({
        user: users,
        roleName: roles.name,
        roleId: roles.id,
        branchName: branches.name,
        branchId: branches.id,
        isDefaultBranch: usersBranches.isDefault,
        permissionCode: permissions.code,
      })
      .from(users)
      .leftJoin(usersRoles, eq(users.id, usersRoles.userId))
      .leftJoin(roles, eq(usersRoles.roleId, roles.id))
      .leftJoin(rolesPermissions, eq(roles.id, rolesPermissions.roleId))
      .leftJoin(permissions, eq(rolesPermissions.permissionId, permissions.id))
      .leftJoin(usersBranches, eq(users.id, usersBranches.userId))
      .leftJoin(branches, eq(usersBranches.branchId, branches.id))
      .where(eq(users.email, email));

    if (userWithRolesAndPermissions.length === 0) return null;

    const user = userWithRolesAndPermissions[0].user;

    // Extract unique roles
    const userRolesList = [
      ...new Set(
        userWithRolesAndPermissions
          .map((u) => u.roleName)
          .filter((r): r is string => r !== null),
      ),
    ];

    // Extract unique permissions
    const userPermissionsList = [
      ...new Set(
        userWithRolesAndPermissions
          .map((u) => u.permissionCode)
          .filter((p): p is string => p !== null),
      ),
    ];

    const userBranchesList = [];
    const seenBranches = new Set();
    for (const row of userWithRolesAndPermissions) {
      if (row.branchId && !seenBranches.has(row.branchId)) {
        seenBranches.add(row.branchId);
        userBranchesList.push({
          id: row.branchId,
          name: row.branchName,
          isDefault: row.isDefaultBranch,
        });
      }
    }

    if (user && (await bcrypt.compare(pass, user.password))) {
      const { password, ...result } = user;
      // Determine default branch logic: explicitly default, or first one
      let defaultBranchId = null;
      const explicitDefault = userBranchesList.find((b) => b.isDefault);
      if (explicitDefault) {
        defaultBranchId = explicitDefault.id;
      } else if (userBranchesList.length > 0) {
        defaultBranchId = userBranchesList[0].id;
      }

      return {
        ...result,
        roles: userRolesList,
        permissions: userPermissionsList,
        branches: userBranchesList,
        branchId: defaultBranchId,
      };
    }
    return null;
  }

  async login(user: any) {
    const payload = {
      email: user.email,
      sub: user.id,
      branchId: user.branchId,
      roles: user.roles,
      permissions: user.permissions,
    };
    console.log('Login Payload:', JSON.stringify(payload, null, 2));
    console.log(
      'JWT Secret used:',
      this.configService.get('JWT_SECRET') ? 'DEFINED' : 'UNDEFINED',
    );
    return {
      access_token: this.jwtService.sign(payload),
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        roles: user.roles,
        permissions: user.permissions,
        branchId: user.branchId, // Default active branch
        branches: user.branches || [],
      },
    };
  }
}
