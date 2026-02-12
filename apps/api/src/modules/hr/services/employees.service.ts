import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { db, employees, jobPositions } from '@repo/db';
import { eq, desc, and } from 'drizzle-orm';
import { CreateEmployeeDto, UpdateEmployeeDto } from '../dto/employee.dto';

@Injectable()
export class EmployeesService {
  async findAll(branchId?: string, status = 'ACTIVE') {
    const conditions = [eq(employees.status, status)];
    if (branchId) {
      conditions.push(eq(employees.branchId, branchId));
    }

    return await db.query.employees.findMany({
      where: conditions.length === 1 ? conditions[0] : and(...conditions),
      orderBy: desc(employees.hireDate),
      with: {
        position: true,
        department: true,
        branch: true,
        salaryCurrency: true,
        bank: true,
      },
    });
  }

  async findOne(id: string) {
    const employee = await db.query.employees.findFirst({
      where: eq(employees.id, id),
      with: {
        position: true,
        department: true,
        branch: true,
        salaryCurrency: true,
        bank: true,
      },
    });
    if (!employee) throw new NotFoundException('Empleado no encontrado');
    return employee;
  }

  async create(data: CreateEmployeeDto) {
    // Validate Position
    const position = await db.query.jobPositions.findFirst({
      where: eq(jobPositions.id, data.positionId),
    });
    if (!position) throw new BadRequestException('Cargo inválido');

    // Create
    const [employee] = await db
      .insert(employees)
      .values({
        firstName: data.firstName,
        lastName: data.lastName,
        identityCard: data.identityCard,
        email: data.email,
        phone: data.phone,
        positionId: data.positionId,
        departmentId: data.departmentId,
        branchId: data.branchId,
        salaryCurrencyId: data.salaryCurrencyId,
        baseSalary: data.baseSalary.toString(),
        payFrequency: data.payFrequency,
        paymentMethod: data.paymentMethod,
        bankId: data.bankId,
        accountNumber: data.accountNumber,
        accountType: data.accountType,
        status: 'ACTIVE',
      })
      .returning();

    return employee;
  }

  async update(id: string, data: UpdateEmployeeDto) {
    const [updated] = await db
      .update(employees)
      .set({
        firstName: data.firstName,
        lastName: data.lastName,
        identityCard: data.identityCard,
        email: data.email,
        phone: data.phone,
        positionId: data.positionId,
        departmentId: data.departmentId,
        branchId: data.branchId,
        salaryCurrencyId: data.salaryCurrencyId,
        baseSalary: data.baseSalary.toString(),
        payFrequency: data.payFrequency,
        paymentMethod: data.paymentMethod,
        bankId: data.bankId,
        accountNumber: data.accountNumber,
        accountType: data.accountType,
      })
      .where(eq(employees.id, id))
      .returning();

    if (!updated) throw new NotFoundException('Empleado no encontrado');
    return updated;
  }
}
