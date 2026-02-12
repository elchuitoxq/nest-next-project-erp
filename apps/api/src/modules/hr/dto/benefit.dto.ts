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
  @ApiProperty()
  @IsString()
  employeeId: string;

  @ApiProperty()
  @IsNumber()
  year: number;

  @ApiProperty()
  @IsNumber()
  month: number;

  @ApiProperty()
  @IsNumber()
  monthlySalary: number;

  @ApiProperty()
  @IsNumber()
  integralSalary: number;

  @ApiPropertyOptional()
  @IsNumber()
  @IsOptional()
  days?: number; // Default 15

  @ApiProperty()
  @IsNumber()
  amount: number;

  @ApiPropertyOptional()
  @IsEnum(BenefitType)
  @IsOptional()
  type?: BenefitType;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  notes?: string;
}

export class UpdateBenefitDto {
  @ApiPropertyOptional()
  @IsNumber()
  @IsOptional()
  amount?: number;

  @ApiPropertyOptional()
  @IsBoolean()
  @IsOptional()
  paid?: boolean;

  @ApiPropertyOptional()
  @IsDateString()
  @IsOptional()
  paymentDate?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  notes?: string;
}
