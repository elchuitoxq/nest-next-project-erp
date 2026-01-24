import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { db, employees, jobPositions } from '@repo/db';
import { eq, desc } from 'drizzle-orm';
import { CreateEmployeeDto, UpdateEmployeeDto } from '../dto/employee.dto';

@Injectable()
export class EmployeesService {
  async findAll(status = 'ACTIVE') {
    return await db.query.employees.findMany({
      where: eq(employees.status, status),
      orderBy: desc(employees.hireDate),
      with: {
        position: true,
        salaryCurrency: true
      }
    });
  }

  async findOne(id: string) {
    const employee = await db.query.employees.findFirst({
      where: eq(employees.id, id),
      with: {
        position: true,
        salaryCurrency: true
      }
    });
    if (!employee) throw new NotFoundException('Empleado no encontrado');
    return employee;
  }

  async create(data: CreateEmployeeDto) {
    // Validate Position
    const position = await db.query.jobPositions.findFirst({
        where: eq(jobPositions.id, data.positionId)
    });
    if (!position) throw new BadRequestException('Cargo inválido');

    // Create
    const [employee] = await db.insert(employees).values({
      firstName: data.firstName,
      lastName: data.lastName,
      identityCard: data.identityCard,
      email: data.email,
      phone: data.phone,
      positionId: data.positionId,
      salaryCurrencyId: data.salaryCurrencyId,
      baseSalary: data.baseSalary.toString(),
      payFrequency: data.payFrequency,
      bankName: data.bankName,
      accountNumber: data.accountNumber,
      accountType: data.accountType,
      status: 'ACTIVE'
    }).returning();

    return employee;
  }

  async update(id: string, data: UpdateEmployeeDto) {
    const [updated] = await db.update(employees)
      .set({
        firstName: data.firstName,
        lastName: data.lastName,
        identityCard: data.identityCard,
        email: data.email,
        phone: data.phone,
        positionId: data.positionId,
        salaryCurrencyId: data.salaryCurrencyId,
        baseSalary: data.baseSalary.toString(),
        payFrequency: data.payFrequency,
        bankName: data.bankName,
        accountNumber: data.accountNumber,
        accountType: data.accountType,
      })
      .where(eq(employees.id, id))
      .returning();
    
    if (!updated) throw new NotFoundException('Empleado no encontrado');
    return updated;
  }
}
