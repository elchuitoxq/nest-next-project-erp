import { IsString, IsOptional, IsBoolean } from 'class-validator';

export class CreateWarehouseDto {
  @IsString()
  name: string;

  @IsString()
  @IsOptional()
  address?: string;

  @IsOptional()
  @IsString()
  branchId?: string; // Optional if we want to link it to a branch logic

  @IsBoolean()
  @IsOptional()
  isActive?: boolean;
}
