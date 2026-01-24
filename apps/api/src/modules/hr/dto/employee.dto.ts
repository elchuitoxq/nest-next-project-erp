import { IsString, IsOptional, IsNumber, IsUUID, IsEmail } from 'class-validator';

export class CreateEmployeeDto {
  @IsString()
  firstName: string;

  @IsString()
  lastName: string;

  @IsString()
  identityCard: string;

  @IsOptional()
  @IsEmail()
  email?: string;

  @IsOptional()
  @IsString()
  phone?: string;

  @IsUUID()
  positionId: string;

  @IsOptional()
  @IsUUID()
  salaryCurrencyId?: string;

  @IsNumber()
  baseSalary: number;

  @IsOptional()
  @IsString()
  payFrequency?: string; // BIWEEKLY, WEEKLY

  @IsOptional()
  @IsString()
  bankName?: string;

  @IsOptional()
  @IsString()
  accountNumber?: string;

  @IsOptional()
  @IsString()
  accountType?: string;
}

export class UpdateEmployeeDto extends CreateEmployeeDto {}
