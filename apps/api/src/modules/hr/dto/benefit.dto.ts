import {
  IsString,
  IsNumber,
  IsEnum,
  IsOptional,
  IsBoolean,
  IsDateString,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export enum BenefitType {
  REGULAR = 'REGULAR',
  ANTICIPO = 'ANTICIPO',
  LIQUIDACION = 'LIQUIDACION',
}

export class CreateBenefitDto {
  @ApiProperty({
    description: 'ID del empleado beneficiario',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  @IsString()
  employeeId: string;

  @ApiProperty({
    description: 'Año de cálculo de la prestación',
    example: 2024,
  })
  @IsNumber()
  year: number;

  @ApiProperty({
    description: 'Mes de cálculo de la prestación',
    example: 7,
  })
  @IsNumber()
  month: number;

  @ApiProperty({
    description: 'Sueldo mensual base usado para el cálculo',
    example: 500.0,
  })
  @IsNumber()
  monthlySalary: number;

  @ApiProperty({
    description: 'Sueldo integral (incluye bonos, vacaciones, etc.)',
    example: 650.0,
  })
  @IsNumber()
  integralSalary: number;

  @ApiPropertyOptional({
    description:
      'Días acumulados para el período (normalmente 15 por trimestre)',
    example: 15,
    default: 15,
  })
  @IsNumber()
  @IsOptional()
  days?: number;

  @ApiProperty({
    description: 'Monto total de la prestación acumulada',
    example: 325.0,
  })
  @IsNumber()
  amount: number;

  @ApiPropertyOptional({
    description: 'Tipo de prestación social',
    enum: BenefitType,
    example: BenefitType.REGULAR,
  })
  @IsEnum(BenefitType)
  @IsOptional()
  type?: BenefitType;

  @ApiPropertyOptional({
    description: 'Notas o detalles adicionales del cálculo',
    example: 'Ajuste por incremento salarial retroactivo.',
  })
  @IsString()
  @IsOptional()
  notes?: string;
}

export class UpdateBenefitDto {
  @ApiPropertyOptional({
    description: 'Monto ajustado de la prestación',
    example: 350.0,
  })
  @IsNumber()
  @IsOptional()
  amount?: number;

  @ApiPropertyOptional({
    description: 'Indica si la prestación ya ha sido pagada al empleado',
    example: true,
  })
  @IsBoolean()
  @IsOptional()
  paid?: boolean;

  @ApiPropertyOptional({
    description: 'Fecha en que se hizo efectiva la liquidación o anticipo',
    example: '2024-07-31',
  })
  @IsDateString()
  @IsOptional()
  paymentDate?: string;

  @ApiPropertyOptional({
    description: 'Notas adicionales sobre el ajuste o pago',
  })
  @IsString()
  @IsOptional()
  notes?: string;
}
