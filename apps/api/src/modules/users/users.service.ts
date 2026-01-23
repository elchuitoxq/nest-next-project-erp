import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ConflictException,
} from '@nestjs/common';
import {
  db,
  users,
  usersRoles,
  roles,
  usersBranches,
  branches,
} from '@repo/db';
import { eq, inArray, sql } from 'drizzle-orm';
import * as bcrypt from 'bcrypt';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';

@Injectable()
export class UsersService {
  async findAll() {
    const rows = await db
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
      .leftJoin(branches, eq(usersBranches.branchId, branches.id));

    // Grouping manually since Drizzle doesn't automatically nest one-to-many in flat selects easily without 'with' query
    // Using a Map to group by user ID
    const userMap = new Map<string, any>();

    for (const row of rows) {
      if (!userMap.has(row.user.id)) {
        userMap.set(row.user.id, {
          ...row.user,
          roles: [],
          branches: [],
        });
        // Remove sensitive data
        // Remove sensitive data
        delete userMap.get(row.user.id).password;
      }
      if (row.roleName) {
        if (!userMap.get(row.user.id).roles.includes(row.roleName)) {
          userMap.get(row.user.id).roles.push(row.roleName);
        }
      }
      if (row.branchId) {
        // Check if branch already added to avoid duplicates from cartesian product
        const userEntry = userMap.get(row.user.id);
        if (!userEntry.branches.find((b: any) => b.id === row.branchId)) {
          userEntry.branches.push({
            id: row.branchId,
            name: row.branchName,
            isDefault: row.isDefaultBranch,
          });
        }
      }
    }

    return Array.from(userMap.values());
  }

  async findOne(id: string) {
    const rows = await db
      .select({
        user: users,
        roleName: roles.name,
        roleId: roles.id,
        branchId: branches.id,
        branchName: branches.name,
        isDefaultBranch: usersBranches.isDefault,
      })
      .from(users)
      .leftJoin(usersRoles, eq(users.id, usersRoles.userId))
      .leftJoin(roles, eq(usersRoles.roleId, roles.id))
      .leftJoin(usersBranches, eq(users.id, usersBranches.userId))
      .leftJoin(branches, eq(usersBranches.branchId, branches.id))
      .where(eq(users.id, id));

    if (rows.length === 0) {
      throw new NotFoundException(`User with ID ${id} not found`);
    }

    const user = {
      ...rows[0].user,
      roles: [] as string[],
      roleIds: [] as string[],
    };
    delete (user as any).password;

    for (const row of rows) {
      if (row.roleId) {
        if (!user.roleIds.includes(row.roleId)) user.roleIds.push(row.roleId);
      }
      if (row.roleName) {
        if (!user.roles.includes(row.roleName)) user.roles.push(row.roleName);
      }
      if (row.branchId) {
        if (!(user as any).branches) (user as any).branches = [];
        if (!(user as any).branches.find((b: any) => b.id === row.branchId)) {
          (user as any).branches.push({
            id: row.branchId,
            name: row.branchName,
            isDefault: row.isDefaultBranch,
          });
        }
      }
    }

    return user;
  }

  async create(createUserDto: CreateUserDto) {
    const { roleIds, branchIds, password, ...userData } = createUserDto;

    // Check email existence
    const existing = await db
      .select()
      .from(users)
      .where(eq(users.email, userData.email))
      .limit(1);
    if (existing.length > 0) {
      throw new ConflictException('Email already in use');
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    // Transaction to ensure user and roles are created together
    try {
      return await db.transaction(async (tx) => {
        const [newUser] = await tx
          .insert(users)
          .values({
            ...userData,
            password: hashedPassword,
          })
          .returning();

        if (roleIds && roleIds.length > 0) {
          // Verify roles exist (optional, but good practice)
          // for now assuming they exist to keep it simple, or catch error
          for (const roleId of roleIds) {
            await tx.insert(usersRoles).values({
              userId: newUser.id,
              roleId: roleId,
            });
          }
        }

        if (branchIds && branchIds.length > 0) {
          for (let i = 0; i < branchIds.length; i++) {
            const branchId = branchIds[i];
            const isDefault = i === 0;
            await tx.insert(usersBranches).values({
              userId: newUser.id,
              branchId: branchId,
              isDefault: isDefault,
            });
          }
        }

        const { password: _, ...result } = newUser;
        return result;
      });
    } catch (error) {
      throw new BadRequestException('Error creating user: ' + error.message);
    }
  }

  async update(id: string, updateUserDto: UpdateUserDto) {
    const { roleIds, branchIds, password, ...userData } = updateUserDto;

    // Check existence
    await this.findOne(id);

    const updateData: any = { ...userData, updatedAt: new Date() };
    if (password) {
      updateData.password = await bcrypt.hash(password, 10);
    }

    try {
      await db.transaction(async (tx) => {
        if (Object.keys(updateData).length > 1) {
          // 1 because updatedAt is always there
          await tx.update(users).set(updateData).where(eq(users.id, id));
        }

        if (roleIds !== undefined) {
          // Sync roles: Delete all and re-insert
          await tx.delete(usersRoles).where(eq(usersRoles.userId, id));

          if (roleIds.length > 0) {
            for (const roleId of roleIds) {
              await tx.insert(usersRoles).values({
                userId: id,
                roleId: roleId,
              });
            }
          }
        }

        if (branchIds !== undefined) {
          await tx.delete(usersBranches).where(eq(usersBranches.userId, id));
          if (branchIds.length > 0) {
            for (let i = 0; i < branchIds.length; i++) {
              const branchId = branchIds[i];
              const isDefault = i === 0;
              await tx.insert(usersBranches).values({
                userId: id,
                branchId: branchId,
                isDefault: isDefault,
              });
            }
          }
        }
      });
      return this.findOne(id);
    } catch (error) {
      throw new BadRequestException('Error updating user');
    }
  }

  async remove(id: string) {
    // Delete relations first or use Cascade? Schema says nothing, so manual cleanup might be needed if no CASCADE FK
    // Schema doesn't declare onDelete: cascade in Drizzle definition explicitly in Step 358,
    // but usually PG references default to NO ACTION. Logic suggests removing relations.
    // However, seed reset.ts used DROP CASCADE.
    // Let's rely on manual deletion of usersRoles first.

    await db.delete(usersRoles).where(eq(usersRoles.userId, id));
    const [deleted] = await db
      .delete(users)
      .where(eq(users.id, id))
      .returning();

    if (!deleted) throw new NotFoundException('User not found');
    return deleted;
  }
}
