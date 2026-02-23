import {
  IsString,
  IsNumber,
  IsOptional,
  IsDateString,
  IsEnum,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export enum IncidentStatus {
  PENDING = 'PENDING',
  PROCESSED = 'PROCESSED',
  CANCELLED = 'CANCELLED',
}

export class CreateIncidentDto {
  @ApiProperty({
    description: 'ID del empleado al que se le registra la incidencia',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  @IsString()
  employeeId: string;

  @ApiProperty({
    description: 'ID del concepto de nómina (Bono, Deducción, etc.)',
    example: 'uuid',
  })
  @IsString()
  conceptId: string;

  @ApiProperty({
    description: 'Fecha en que ocurrió o se registra la incidencia',
    example: '2024-08-10',
  })
  @IsDateString()
  date: string;

  @ApiPropertyOptional({
    description: 'Cantidad vinculada a la incidencia (horas, días)',
    example: 4,
  })
  @IsNumber()
  @IsOptional()
  quantity?: number;

  @ApiPropertyOptional({
    description:
      'Monto monetario de la incidencia (sobrescribe cálculo automático si aplica)',
    example: 25.5,
  })
  @IsNumber()
  @IsOptional()
  amount?: number;

  @ApiPropertyOptional({
    description: 'Detalles o justificación de la incidencia',
    example: 'Horas extras por cierre de proyecto.',
  })
  @IsString()
  @IsOptional()
  notes?: string;
}

export class UpdateIncidentDto {
  @ApiPropertyOptional({
    description: 'Cantidad vinculada (ajuste)',
    example: 5,
  })
  @IsNumber()
  @IsOptional()
  quantity?: number;

  @ApiPropertyOptional({
    description: 'Monto monetario (ajuste)',
    example: 30.0,
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

  @ApiPropertyOptional({
    description: 'Estado de procesamiento de la incidencia',
    enum: IncidentStatus,
  })
  @IsEnum(IncidentStatus)
  @IsOptional()
  status?: IncidentStatus;
}
