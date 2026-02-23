import {
  IsString,
  IsNumber,
  IsOptional,
  IsDateString,
  IsEnum,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export enum ProfitSharingStatus {
  PENDING = 'PENDING',
  PAID = 'PAID',
}

export class CreateProfitSharingDto {
  @ApiProperty({
    description: 'ID del empleado beneficiario',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  @IsString()
  employeeId: string;

  @ApiProperty({
    description: 'Año fiscal correspondiente al reparto de utilidades',
    example: 2024,
  })
  @IsNumber()
  year: number;

  @ApiProperty({
    description: 'Cantidad de días a pagar según ley o contrato',
    example: 60,
  })
  @IsNumber()
  daysToPay: number;

  @ApiProperty({
    description: 'Monto total a pagar por utilidades',
    example: 1500.5,
  })
  @IsNumber()
  amount: number;

  @ApiPropertyOptional({
    description: 'Fecha en que se hizo efectivo el pago',
    example: '2024-12-15',
  })
  @IsDateString()
  @IsOptional()
  paymentDate?: string;

  @ApiPropertyOptional({
    description: 'Estado del pago de utilidades',
    enum: ProfitSharingStatus,
    example: ProfitSharingStatus.PENDING,
  })
  @IsEnum(ProfitSharingStatus)
  @IsOptional()
  status?: ProfitSharingStatus;

  @ApiPropertyOptional({
    description: 'Notas o aclaratorias sobre el cálculo',
  })
  @IsString()
  @IsOptional()
  notes?: string;
}

export class UpdateProfitSharingDto {
  @ApiPropertyOptional({
    description: 'Nuevo estado de la utilidad',
    enum: ProfitSharingStatus,
  })
  @IsEnum(ProfitSharingStatus)
  @IsOptional()
  status?: ProfitSharingStatus;

  @ApiPropertyOptional({
    description: 'Fecha de pago (ajuste)',
    example: '2024-12-15',
  })
  @IsDateString()
  @IsOptional()
  paymentDate?: string;

  @ApiPropertyOptional({
    description: 'Notas adicionales',
  })
  @IsString()
  @IsOptional()
  notes?: string;
}
