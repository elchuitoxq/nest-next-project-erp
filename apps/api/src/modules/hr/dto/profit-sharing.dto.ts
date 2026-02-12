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
  @ApiProperty()
  @IsString()
  employeeId: string;

  @ApiProperty()
  @IsNumber()
  year: number;

  @ApiProperty()
  @IsNumber()
  daysToPay: number;

  @ApiProperty()
  @IsNumber()
  amount: number;

  @ApiPropertyOptional()
  @IsDateString()
  @IsOptional()
  paymentDate?: string;

  @ApiPropertyOptional()
  @IsEnum(ProfitSharingStatus)
  @IsOptional()
  status?: ProfitSharingStatus;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  notes?: string;
}

export class UpdateProfitSharingDto {
  @ApiPropertyOptional()
  @IsEnum(ProfitSharingStatus)
  @IsOptional()
  status?: ProfitSharingStatus;

  @ApiPropertyOptional()
  @IsDateString()
  @IsOptional()
  paymentDate?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  notes?: string;
}
