import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { db, departments, employees } from '@repo/db';
import { eq, and, sql } from 'drizzle-orm';
import {
  CreateDepartmentDto,
  UpdateDepartmentDto,
} from '../dto/department.dto';

@Injectable()
export class DepartmentsService {
  async findAll(branchId?: string) {
    const conditions = [];
    if (branchId) {
      conditions.push(eq(departments.branchId, branchId));
    }

    // Usamos query builder para incluir relaciones si es posible, o raw query si necesitamos counts complejos
    // Por ahora usaremos db.query para traer la jerarquía básica
    const result = await db.query.departments.findMany({
      where: conditions.length > 0 ? and(...conditions) : undefined,
      with: {
        branch: true,
        employees: true, // Para contar en código o cliente
      },
    });

    // Mapeamos para agregar employeeCount
    return result.map((dept) => ({
      ...dept,
      employeeCount: dept.employees.length,
    }));
  }

  async findOne(id: string) {
    const dept = await db.query.departments.findFirst({
      where: eq(departments.id, id),
      with: {
        branch: true,
        employees: true,
      },
    });
    if (!dept) throw new NotFoundException('Departamento no encontrado');
    return { ...dept, employeeCount: dept.employees.length };
  }

  async create(data: CreateDepartmentDto) {
    // Validar parentId si existe
    if (data.parentId) {
      const parent = await db.query.departments.findFirst({
        where: eq(departments.id, data.parentId),
      });
      if (!parent)
        throw new BadRequestException('Departamento padre no existe');
    }

    const [dept] = await db.insert(departments).values(data).returning();
    return dept;
  }

  async update(id: string, data: UpdateDepartmentDto) {
    // Validar parentId si existe y no es el mismo ID (prevención de ciclo simple)
    if (data.parentId) {
      if (data.parentId === id) {
        throw new BadRequestException(
          'Un departamento no puede ser su propio padre',
        );
      }
      const parent = await db.query.departments.findFirst({
        where: eq(departments.id, data.parentId),
      });
      if (!parent)
        throw new BadRequestException('Departamento padre no existe');
    }

    const [updated] = await db
      .update(departments)
      .set({
        ...data,
      })
      .where(eq(departments.id, id))
      .returning();

    if (!updated) throw new NotFoundException('Departamento no encontrado');
    return updated;
  }

  async delete(id: string) {
    // Verificar si tiene empleados
    const empCount = await db
      .select({ count: sql<number>`count(*)` })
      .from(employees)
      .where(eq(employees.departmentId, id));

    if (Number(empCount[0]?.count) > 0) {
      throw new BadRequestException(
        'No se puede eliminar un departamento con empleados asignados',
      );
    }

    // Verificar si tiene sub-departamentos
    const subDeptCount = await db
      .select({ count: sql<number>`count(*)` })
      .from(departments)
      .where(eq(departments.parentId, id));

    if (Number(subDeptCount[0]?.count) > 0) {
      throw new BadRequestException(
        'No se puede eliminar un departamento que tiene sub-departamentos',
      );
    }

    const [deleted] = await db
      .delete(departments)
      .where(eq(departments.id, id))
      .returning();

    if (!deleted) throw new NotFoundException('Departamento no encontrado');
    return deleted;
  }
}
