import {
  IsString,
  IsOptional,
  IsArray,
  ValidateNested,
  IsNumber,
  IsEnum,
} from 'class-validator';
import { Type } from 'class-transformer';

export class InventoryMoveLineDto {
  @IsString()
  productId: string;

  @IsNumber()
  @Type(() => Number)
  quantity: number;

  @IsNumber()
  @IsOptional()
  @Type(() => Number)
  cost?: number;
}

export class CreateInventoryMoveDto {
  @IsEnum(['IN', 'OUT', 'TRANSFER', 'ADJUST'])
  type: 'IN' | 'OUT' | 'TRANSFER' | 'ADJUST';

  @IsString()
  @IsOptional()
  fromWarehouseId?: string;

  @IsString()
  @IsOptional()
  toWarehouseId?: string;

  @IsString()
  @IsOptional()
  note?: string;

  @IsString()
  @IsOptional()
  userId?: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => InventoryMoveLineDto)
  lines: InventoryMoveLineDto[];
}
