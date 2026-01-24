import { IsString, IsOptional, IsNumber, IsUUID } from 'class-validator';

export class CreateJobPositionDto {
  @IsString()
  name: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsUUID()
  currencyId?: string;

  @IsOptional()
  @IsNumber()
  baseSalaryMin?: number;

  @IsOptional()
  @IsNumber()
  baseSalaryMax?: number;
}

export class UpdateJobPositionDto extends CreateJobPositionDto {}
