import {
  IsString,
  IsOptional,
  IsUUID,
  IsEnum,
  IsDateString,
  IsNumber,
} from 'class-validator';

export enum ContractType {
  INDEFINIDO = 'INDEFINIDO',
  DETERMINADO = 'DETERMINADO',
  OBRA = 'OBRA',
}

export enum ContractStatus {
  ACTIVE = 'ACTIVE',
  EXPIRED = 'EXPIRED',
  TERMINATED = 'TERMINATED',
}

export class CreateContractDto {
  @IsUUID('all', { message: 'Empleado inválido' })
  employeeId: string;

  @IsEnum(ContractType, { message: 'Tipo de contrato inválido' })
  type: ContractType;

  @IsDateString({}, { message: 'Fecha de inicio inválida' })
  startDate: string;

  @IsOptional()
  @IsDateString({}, { message: 'Fecha de fin inválida' })
  endDate?: string;

  @IsOptional()
  @IsDateString({}, { message: 'Fin de período de prueba inválido' })
  trialPeriodEnd?: string;

  @IsOptional()
  @IsNumber({}, { message: 'Horas semanales debe ser un número' })
  weeklyHours?: number;

  @IsOptional()
  @IsString()
  notes?: string;
}

export class UpdateContractDto {
  @IsOptional()
  @IsEnum(ContractType)
  type?: ContractType;

  @IsOptional()
  @IsDateString()
  startDate?: string;

  @IsOptional()
  @IsDateString()
  endDate?: string;

  @IsOptional()
  @IsDateString()
  trialPeriodEnd?: string;

  @IsOptional()
  @IsNumber()
  weeklyHours?: number;

  @IsOptional()
  @IsString()
  notes?: string;

  @IsOptional()
  @IsEnum(ContractStatus)
  status?: ContractStatus;
}
