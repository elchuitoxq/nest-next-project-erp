import {
  IsString,
  IsOptional,
  IsNumber,
  IsBoolean,
  IsEnum,
} from 'class-validator';
import { Type } from 'class-transformer';

export class CreateProductDto {
  @IsString()
  sku: string;

  @IsString()
  name: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsOptional()
  @IsString() // ID
  categoryId?: string;

  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  cost?: number; // Drizzle expects string for numeric, but frontend sends number usually. We can map it.

  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  price?: number;

  @IsOptional()
  @IsBoolean()
  isExempt?: boolean;

  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  taxRate?: number;

  @IsOptional()
  @IsString()
  type?: string; // PHYSICAL, SERVICE, CONSUMABLE

  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  minStock?: number;

  @IsOptional()
  @IsString()
  currencyId?: string;
}
