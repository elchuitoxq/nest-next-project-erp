import {
  IsString,
  IsNumber,
  IsOptional,
  IsEnum,
  IsBoolean,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export enum PayrollSettingType {
  FIXED_USD = 'FIXED_USD',
  FIXED_VES = 'FIXED_VES',
  PERCENTAGE = 'PERCENTAGE',
}

export class UpdatePayrollSettingDto {
  @ApiProperty()
  @IsString()
  key: string;

  @ApiProperty()
  @IsString()
  label: string;

  @ApiProperty()
  @IsNumber()
  value: number;

  @ApiProperty({ enum: PayrollSettingType })
  @IsEnum(PayrollSettingType)
  type: PayrollSettingType;

  @ApiPropertyOptional()
  @IsBoolean()
  @IsOptional()
  isActive?: boolean;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  branchId?: string;
}

export class UpdatePayrollSettingsBatchDto {
  @ApiProperty({ type: [UpdatePayrollSettingDto] })
  settings: UpdatePayrollSettingDto[];
}
