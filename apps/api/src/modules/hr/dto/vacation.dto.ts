import {
  IsString,
  IsNumber,
  IsOptional,
  IsBoolean,
  IsDateString,
  IsEnum,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export enum VacationStatus {
  PENDING = 'PENDING',
  TAKEN = 'TAKEN',
  PAID = 'PAID', // For "Vacaciones fraccionadas" or purely monetary
}

export class CreateVacationDto {
  @ApiProperty({
    description: 'ID del empleado que solicita las vacaciones',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  @IsString()
  employeeId: string;

  @ApiProperty({
    description: 'Año correspondiente al período vacacional',
    example: 2024,
  })
  @IsNumber()
  year: number;

  @ApiProperty({
    description: 'Cantidad total de días solicitados',
    example: 15,
  })
  @IsNumber()
  totalDays: number;

  @ApiProperty({
    description: 'Fecha de inicio del disfrute',
    example: '2024-08-01',
  })
  @IsDateString()
  startDate: string;

  @ApiProperty({
    description: 'Fecha de culminación del disfrute',
    example: '2024-08-15',
  })
  @IsDateString()
  endDate: string;

  @ApiProperty({
    description: 'Fecha programada de retorno a labores',
    example: '2024-08-16',
  })
  @IsDateString()
  returnDate: string;

  @ApiPropertyOptional({
    description: 'Monto pagado por bono vacacional (opcional)',
    example: 120.75,
  })
  @IsNumber()
  @IsOptional()
  amount?: number;

  @ApiPropertyOptional({
    description: 'Comentarios adicionales o motivo de la solicitud',
    example: 'Vacaciones anuales correspondientes al período 2023-2024.',
  })
  @IsString()
  @IsOptional()
  notes?: string;
}

export class UpdateVacationDto {
  @ApiPropertyOptional({
    description: 'Estado actual de la solicitud',
    enum: VacationStatus,
  })
  @IsEnum(VacationStatus)
  @IsOptional()
  status?: VacationStatus;

  @ApiPropertyOptional({
    description: 'Fecha de inicio (ajuste)',
    example: '2024-08-01',
  })
  @IsDateString()
  @IsOptional()
  startDate?: string;

  @ApiPropertyOptional({
    description: 'Fecha de fin (ajuste)',
    example: '2024-08-15',
  })
  @IsDateString()
  @IsOptional()
  endDate?: string;

  @ApiPropertyOptional({
    description: 'Fecha de retorno (ajuste)',
    example: '2024-08-16',
  })
  @IsDateString()
  @IsOptional()
  returnDate?: string;

  @ApiPropertyOptional({
    description: 'Total de días (ajuste)',
    example: 15,
  })
  @IsNumber()
  @IsOptional()
  totalDays?: number;

  @ApiPropertyOptional({
    description: 'Fecha en que se procesó el pago',
    example: '2024-07-28',
  })
  @IsDateString()
  @IsOptional()
  paymentDate?: string;

  @ApiPropertyOptional({
    description: 'Monto del pago (ajuste)',
    example: 120.75,
  })
  @IsNumber()
  @IsOptional()
  amount?: number;

  @ApiPropertyOptional({
    description: 'Notas adicionales',
  })
  @IsString()
  @IsOptional()
  notes?: string;
}
