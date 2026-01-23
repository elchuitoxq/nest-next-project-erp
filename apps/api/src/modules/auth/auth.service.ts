import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import {
  db,
  users,
  usersRoles,
  roles,
  usersBranches,
  branches,
} from '@repo/db';
import { eq } from 'drizzle-orm';
import * as bcrypt from 'bcrypt';

@Injectable()
export class AuthService {
  constructor(private jwtService: JwtService) {}

  async validateUser(email: string, pass: string): Promise<any> {
    const userWithRoles = await db
      .select({
        user: users,
        roleName: roles.name,
        branchName: branches.name,
        branchId: branches.id,
        isDefaultBranch: usersBranches.isDefault,
      })
      .from(users)
      .leftJoin(usersRoles, eq(users.id, usersRoles.userId))
      .leftJoin(roles, eq(usersRoles.roleId, roles.id))
      .leftJoin(usersBranches, eq(users.id, usersBranches.userId))
      .leftJoin(branches, eq(usersBranches.branchId, branches.id))
      .where(eq(users.email, email));

    if (userWithRoles.length === 0) return null;

    const user = userWithRoles[0].user;
    const userRolesList = [
      ...new Set(
        userWithRoles
          .map((u) => u.roleName)
          .filter((r): r is string => r !== null),
      ),
    ];

    const userBranchesList = [];
    const seenBranches = new Set();
    for (const row of userWithRoles) {
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
    };
    return {
      access_token: this.jwtService.sign(payload),
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        roles: user.roles,
        branchId: user.branchId, // Default active branch
        branches: user.branches || [],
      },
    };
  }
}
