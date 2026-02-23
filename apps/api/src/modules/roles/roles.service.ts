import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import {
  db,
  roles,
  usersRoles,
  users,
  permissions,
  rolesPermissions,
} from '@repo/db';
import { eq, and, inArray } from 'drizzle-orm';
import { CreateRoleDto } from './dto/create-role.dto';
import { AssignRoleDto } from './dto/assign-role.dto';

@Injectable()
export class RolesService {
  async create(createRoleDto: CreateRoleDto) {
    try {
      const [role] = await db.insert(roles).values(createRoleDto).returning();
      return role;
    } catch (error) {
      if (error.code === '23505') {
        // Postgres unique violation code
        throw new BadRequestException('Role with this name already exists');
      }
      throw error;
    }
  }

  async findAll() {
    const allRoles = await db.select().from(roles);

    // Fetch permissions for each role
    const rolesWithPermissions = await Promise.all(
      allRoles.map(async (role) => {
        const rolePerms = await db
          .select({
            id: permissions.id,
            code: permissions.code,
            description: permissions.description,
            module: permissions.module,
          })
          .from(rolesPermissions)
          .innerJoin(
            permissions,
            eq(rolesPermissions.permissionId, permissions.id),
          )
          .where(eq(rolesPermissions.roleId, role.id));

        return {
          ...role,
          permissions: rolePerms,
        };
      }),
    );

    return rolesWithPermissions;
  }

  async getAllPermissions() {
    return await db.select().from(permissions);
  }

  async updatePermissions(roleId: string, permissionCodes: string[]) {
    // 1. Clear existing permissions for this role
    await db
      .delete(rolesPermissions)
      .where(eq(rolesPermissions.roleId, roleId));

    if (permissionCodes.length === 0) {
      return { message: 'Permissions updated (cleared)' };
    }

    // 2. Find IDs for these codes
    // We assume codes are valid because they come from static list
    // But we should fetch them from DB to get their UUIDs
    const perms = await db
      .select({ id: permissions.id })
      .from(permissions)
      .where(inArray(permissions.code, permissionCodes));

    if (perms.length === 0) {
      return { message: 'No valid permissions found to assign' };
    }

    // 3. Insert new permissions using found IDs
    const values = perms.map((p) => ({
      roleId,
      permissionId: p.id,
    }));

    await db.insert(rolesPermissions).values(values).onConflictDoNothing();

    return { message: 'Permissions updated successfully' };
  }

  async remove(id: string) {
    // First remove relationships
    await db.delete(rolesPermissions).where(eq(rolesPermissions.roleId, id));
    await db.delete(usersRoles).where(eq(usersRoles.roleId, id));

    const [deleted] = await db
      .delete(roles)
      .where(eq(roles.id, id))
      .returning();

    if (!deleted) {
      throw new NotFoundException(`Role with ID ${id} not found`);
    }
    return deleted;
  }

  async assignRole(assignRoleDto: AssignRoleDto) {
    // Check if user exists
    const userExists = await db
      .select()
      .from(users)
      .where(eq(users.id, assignRoleDto.userId))
      .limit(1);
    if (!userExists.length) throw new NotFoundException('User not found');

    // Check if role exists
    const roleExists = await db
      .select()
      .from(roles)
      .where(eq(roles.id, assignRoleDto.roleId))
      .limit(1);
    if (!roleExists.length) throw new NotFoundException('Role not found');

    // Assign
    try {
      await db
        .insert(usersRoles)
        .values({
          userId: assignRoleDto.userId,
          roleId: assignRoleDto.roleId,
        })
        .onConflictDoNothing(); // Idempotent
      return { message: 'Role assigned successfully' };
    } catch (error) {
      throw new BadRequestException('Could not assign role');
    }
  }
}
