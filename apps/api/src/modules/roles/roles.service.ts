import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { db, roles, usersRoles, users } from '@repo/db';
import { eq, and } from 'drizzle-orm';
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
    return await db.select().from(roles);
  }

  async remove(id: string) {
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
