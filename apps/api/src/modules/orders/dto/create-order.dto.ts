import {
  IsString,
  IsNotEmpty,
  IsNumber,
  IsArray,
  ValidateNested,
  IsOptional,
} from 'class-validator';
import { Type } from 'class-transformer';

class CreateOrderItemDto {
  @IsString()
  @IsNotEmpty()
  productId: string;

  @IsNumber()
  @IsNotEmpty()
  @Type(() => Number)
  quantity: number;

  @IsNumber()
  @IsNotEmpty()
  @Type(() => Number)
  price: number;
}

export class CreateOrderDto {
  @IsString()
  @IsNotEmpty()
  partnerId: string;

  @IsString()
  @IsOptional()
  branchId?: string;

  @IsString()
  @IsOptional()
  warehouseId?: string;

  @IsNumber()
  @IsOptional()
  @Type(() => Number)
  exchangeRate?: number;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateOrderItemDto)
  items: CreateOrderItemDto[];
}
