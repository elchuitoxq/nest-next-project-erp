import {
  IsString,
  IsNotEmpty,
  IsDateString,
  IsOptional,
  IsNumber,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CalculateTerminationDto {
  @ApiProperty({
    description: 'ID del empleado a liquidar',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  @IsString()
  @IsNotEmpty()
  employeeId: string;

  @ApiProperty({
    description: 'Fecha efectiva del egreso',
    example: '2024-08-31',
  })
  @IsDateString()
  @IsNotEmpty()
  date: string;

  @ApiProperty({
    description: 'Motivo del egreso laboral',
    enum: ['RESIGNATION', 'DISMISSAL_JUSTIFIED', 'DISMISSAL_UNJUSTIFIED'],
    example: 'RESIGNATION',
  })
  @IsString()
  @IsNotEmpty()
  reason: string;
}

export class ExecuteTerminationDto extends CalculateTerminationDto {
  @ApiPropertyOptional({
    description: 'Notas adicionales o detalles del finiquito',
  })
  @IsString()
  @IsOptional()
  notes?: string;
}
