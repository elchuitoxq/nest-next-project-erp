import { Injectable, NotFoundException } from '@nestjs/common';
import { db, branches } from '@repo/db';
import { eq, desc } from 'drizzle-orm';
import { CreateBranchDto } from './dto/create-branch.dto';
import { UpdateBranchDto } from './dto/update-branch.dto';

@Injectable()
export class BranchesService {
  async create(createBranchDto: CreateBranchDto) {
    const [newBranch] = await db
      .insert(branches)
      .values(createBranchDto)
      .returning();
    return newBranch;
  }

  async findAll() {
    return await db.select().from(branches).orderBy(desc(branches.createdAt));
  }

  async findOne(id: string) {
    const [branch] = await db
      .select()
      .from(branches)
      .where(eq(branches.id, id));

    if (!branch) {
      throw new NotFoundException(`Branch with ID ${id} not found`);
    }
    return branch;
  }

  async update(id: string, updateBranchDto: UpdateBranchDto) {
    const [updatedBranch] = await db
      .update(branches)
      .set({ ...updateBranchDto }) // updatedAt is automatic in schema? Check schema.
      .where(eq(branches.id, id))
      .returning();

    if (!updatedBranch) {
      throw new NotFoundException(`Branch with ID ${id} not found`);
    }
    return updatedBranch;
  }

  async remove(id: string) {
    // Logical deletion as requested
    const [deactivatedBranch] = await db
      .update(branches)
      .set({ isActive: false })
      .where(eq(branches.id, id))
      .returning();

    if (!deactivatedBranch) {
      throw new NotFoundException(`Branch with ID ${id} not found`);
    }
    return deactivatedBranch;
  }
}
