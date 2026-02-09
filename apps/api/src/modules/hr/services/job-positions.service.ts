import { Injectable, NotFoundException } from '@nestjs/common';
import { db, jobPositions } from '@repo/db';
import { eq, desc } from 'drizzle-orm';
import {
  CreateJobPositionDto,
  UpdateJobPositionDto,
} from '../dto/job-position.dto';

@Injectable()
export class JobPositionsService {
  async findAll() {
    return await db.query.jobPositions.findMany({
      orderBy: desc(jobPositions.createdAt),
      with: {
        currency: true,
      },
    });
  }

  async findOne(id: string) {
    const position = await db.query.jobPositions.findFirst({
      where: eq(jobPositions.id, id),
      with: { currency: true },
    });
    if (!position) throw new NotFoundException('Cargo no encontrado');
    return position;
  }

  async create(data: CreateJobPositionDto) {
    const [position] = await db
      .insert(jobPositions)
      .values({
        name: data.name,
        description: data.description,
        currencyId: data.currencyId,
        baseSalaryMin: data.baseSalaryMin?.toString(),
        baseSalaryMax: data.baseSalaryMax?.toString(),
      })
      .returning();
    return position;
  }

  async update(id: string, data: UpdateJobPositionDto) {
    const [updated] = await db
      .update(jobPositions)
      .set({
        name: data.name,
        description: data.description,
        currencyId: data.currencyId,
        baseSalaryMin: data.baseSalaryMin?.toString(),
        baseSalaryMax: data.baseSalaryMax?.toString(),
      })
      .where(eq(jobPositions.id, id))
      .returning();

    if (!updated) throw new NotFoundException('Cargo no encontrado');
    return updated;
  }

  async delete(id: string) {
    // TODO: Check if employees are assigned
    return await db.delete(jobPositions).where(eq(jobPositions.id, id));
  }
}
