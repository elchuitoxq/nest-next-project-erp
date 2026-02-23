import {
  IsString,
  IsOptional,
  IsUUID,
  IsEnum,
  IsDateString,
  IsNumber,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

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
  @ApiProperty({
    description: 'ID de empleado asociado al contrato',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  @IsUUID('all', { message: 'Empleado inválido' })
  employeeId: string;

  @ApiProperty({
    description: 'Tipo de relación contractual',
    enum: ContractType,
    example: ContractType.INDEFINIDO,
  })
  @IsEnum(ContractType, { message: 'Tipo de contrato inválido' })
  type: ContractType;

  @ApiProperty({
    description: 'Fecha en que inicia la relación laboral',
    example: '2024-01-01',
  })
  @IsDateString({}, { message: 'Fecha de inicio inválida' })
  startDate: string;

  @ApiPropertyOptional({
    description:
      'Fecha en que finaliza el contrato (obligatorio para contratos determinados/obra)',
    example: '2024-12-31',
  })
  @IsOptional()
  @IsDateString({}, { message: 'Fecha de fin inválida' })
  endDate?: string;

  @ApiPropertyOptional({
    description: 'Fecha límite del período de prueba',
    example: '2024-03-31',
  })
  @IsOptional()
  @IsDateString({}, { message: 'Fin de período de prueba inválido' })
  trialPeriodEnd?: string;

  @ApiPropertyOptional({
    description: 'Horas laborales pactadas por semana',
    example: 40,
    default: 40,
  })
  @IsOptional()
  @IsNumber({}, { message: 'Horas semanales debe ser un número' })
  weeklyHours?: number;

  @ApiPropertyOptional({
    description: 'Observaciones o términos especiales',
    example: 'Bonificación por cumplimiento de objetivos incluida.',
  })
  @IsOptional()
  @IsString()
  notes?: string;
}

export class UpdateContractDto {
  @ApiPropertyOptional({
    description: 'Tipo de contrato',
    enum: ContractType,
  })
  @IsOptional()
  @IsEnum(ContractType)
  type?: ContractType;

  @ApiPropertyOptional({
    description: 'Fecha de inicio',
    example: '2024-01-01',
  })
  @IsOptional()
  @IsDateString()
  startDate?: string;

  @ApiPropertyOptional({
    description: 'Fecha de finalización',
    example: '2024-12-31',
  })
  @IsOptional()
  @IsDateString()
  endDate?: string;

  @ApiPropertyOptional({
    description: 'Fin de período de prueba',
  })
  @IsOptional()
  @IsDateString()
  trialPeriodEnd?: string;

  @ApiPropertyOptional({
    description: 'Horas semanales',
  })
  @IsOptional()
  @IsNumber()
  weeklyHours?: number;

  @ApiPropertyOptional({
    description: 'Notas adicionales',
  })
  @IsOptional()
  @IsString()
  notes?: string;

  @ApiPropertyOptional({
    description: 'Estado actual del contrato',
    enum: ContractStatus,
  })
  @IsOptional()
  @IsEnum(ContractStatus)
  status?: ContractStatus;
}
