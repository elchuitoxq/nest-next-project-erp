import {
  IsString,
  IsOptional,
  IsNumber,
  IsUUID,
  IsEmail,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateEmployeeDto {
  @ApiProperty({
    description: 'Nombres del empleado',
    example: 'Juan Alberto',
  })
  @IsString({ message: 'Nombre es requerido' })
  firstName: string;

  @ApiProperty({
    description: 'Apellidos del empleado',
    example: 'Pérez García',
  })
  @IsString({ message: 'Apellido es requerido' })
  lastName: string;

  @ApiProperty({
    description: 'Número de identificación (Cédula/Pasaporte)',
    example: 'V-12345678',
  })
  @IsString({ message: 'Cédula es requerida' })
  identityCard: string;

  @ApiPropertyOptional({
    description: 'Correo electrónico corporativo o personal',
    example: 'juan.perez@empresa.com',
  })
  @IsOptional()
  @IsEmail({}, { message: 'Correo electrónico inválido' })
  email?: string;

  @ApiPropertyOptional({
    description: 'Número de teléfono de contacto',
    example: '+584121234567',
  })
  @IsOptional()
  @IsString({ message: 'Teléfono debe ser texto' })
  phone?: string;

  @ApiProperty({
    description: 'ID de la posición o cargo actual',
    example: 'uuid',
  })
  @IsUUID('all', { message: 'Cargo inválido' })
  positionId: string;

  @ApiPropertyOptional({
    description: 'ID del departamento administrativo',
    example: 'uuid',
  })
  @IsOptional()
  @IsUUID('all', { message: 'Departamento inválido' })
  departmentId?: string;

  @ApiPropertyOptional({
    description: 'ID de la sucursal de adscripción',
    example: 'uuid',
  })
  @IsOptional()
  @IsUUID('all', { message: 'Sucursal inválida' })
  branchId?: string;

  @ApiPropertyOptional({
    description: 'ID de la moneda asignada para el salario',
    example: 'uuid',
  })
  @IsOptional()
  @IsUUID('all', { message: 'Moneda de salario inválida' })
  salaryCurrencyId?: string;

  @ApiProperty({
    description: 'Sueldo base mensual',
    example: 450.5,
  })
  @IsNumber({}, { message: 'Salario base debe ser un número' })
  baseSalary: number;

  @ApiPropertyOptional({
    description: 'Frecuencia con la que se procesa el pago',
    enum: ['BIWEEKLY', 'WEEKLY', 'MONTHLY'],
    example: 'BIWEEKLY',
  })
  @IsOptional()
  @IsString({ message: 'Frecuencia de pago inválida' })
  payFrequency?: string;

  @ApiPropertyOptional({
    description: 'Método preferido de pago',
    enum: ['BANK_TRANSFER', 'CASH'],
    example: 'BANK_TRANSFER',
  })
  @IsOptional()
  @IsString({ message: 'Método de pago inválido' })
  paymentMethod?: string;

  @ApiPropertyOptional({
    description: 'ID del banco para depósitos de nómina',
    example: 'uuid',
  })
  @IsOptional()
  @IsUUID('all', { message: 'Banco inválido' })
  bankId?: string;

  @ApiPropertyOptional({
    description: 'Número de cuenta bancaria',
    example: '01340000000000000000',
  })
  @IsOptional()
  @IsString()
  accountNumber?: string;

  @ApiPropertyOptional({
    description: 'Tipo de cuenta bancaria',
    example: 'Corriente',
  })
  @IsOptional()
  @IsString()
  accountType?: string;
}

export class UpdateEmployeeDto extends CreateEmployeeDto {}
