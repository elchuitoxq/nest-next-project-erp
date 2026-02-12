import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { db, jobPositions, employees } from '@repo/db';
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
    // Check if employees are assigned to this position
    const assignedEmployees = await db.query.employees.findFirst({
      where: eq(employees.positionId, id),
    });

    if (assignedEmployees) {
      throw new BadRequestException(
        'No se puede eliminar el cargo porque tiene empleados asignados',
      );
    }

    return await db.delete(jobPositions).where(eq(jobPositions.id, id));
  }
}
