import {
  IsString,
  IsOptional,
  IsNumber,
  IsUUID,
  IsEmail,
} from 'class-validator';

export class CreateEmployeeDto {
  @IsString({ message: 'Nombre es requerido' })
  firstName: string;

  @IsString({ message: 'Apellido es requerido' })
  lastName: string;

  @IsString({ message: 'Cédula es requerida' })
  identityCard: string;

  @IsOptional()
  @IsEmail({}, { message: 'Correo electrónico inválido' })
  email?: string;

  @IsOptional()
  @IsString({ message: 'Teléfono debe ser texto' })
  phone?: string;

  @IsUUID('all', { message: 'Cargo inválido' })
  positionId: string;

  @IsOptional()
  @IsUUID('all', { message: 'Departamento inválido' })
  departmentId?: string;

  @IsOptional()
  @IsUUID('all', { message: 'Sucursal inválida' })
  branchId?: string;

  @IsOptional()
  @IsUUID('all', { message: 'Moneda de salario inválida' })
  salaryCurrencyId?: string;

  @IsNumber({}, { message: 'Salario base debe ser un número' })
  baseSalary: number;

  @IsOptional()
  @IsString({ message: 'Frecuencia de pago inválida' })
  payFrequency?: string; // BIWEEKLY, WEEKLY, MONTHLY

  @IsOptional()
  @IsString({ message: 'Método de pago inválido' })
  paymentMethod?: string; // BANK_TRANSFER, CASH

  @IsOptional()
  @IsUUID('all', { message: 'Banco inválido' })
  bankId?: string;

  @IsOptional()
  @IsString()
  accountNumber?: string;

  @IsOptional()
  @IsString()
  accountType?: string;
}

export class UpdateEmployeeDto extends CreateEmployeeDto {}
