import { IsString, IsOptional, IsNumber, IsUUID } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateJobPositionDto {
  @ApiProperty({
    description: 'Nombre del cargo o posición',
    example: 'Analista de Sistemas Senior',
  })
  @IsString()
  name: string;

  @ApiPropertyOptional({
    description: 'Descripción detallada de las funciones del cargo',
    example: 'Encargado del mantenimiento y desarrollo de módulos ERP.',
  })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({
    description: 'ID de la moneda base para el rango salarial',
    example: 'uuid',
  })
  @IsOptional()
  @IsUUID()
  currencyId?: string;

  @ApiPropertyOptional({
    description: 'Sueldo mínimo para este cargo',
    example: 800.0,
  })
  @IsOptional()
  @IsNumber()
  baseSalaryMin?: number;

  @ApiPropertyOptional({
    description: 'Sueldo máximo para este cargo',
    example: 1500.0,
  })
  @IsOptional()
  @IsNumber()
  baseSalaryMax?: number;
}

export class UpdateJobPositionDto extends CreateJobPositionDto {}
