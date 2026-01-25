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

  @IsString()
  @IsOptional()
  currencyId?: string;

  @IsNumber()
  @IsOptional()
  maxQuantity?: number;
}

export class CreateOrderDto {
  @IsString()
  @IsNotEmpty({ message: 'El cliente es requerido' })
  partnerId: string;

  @IsString()
  @IsOptional()
  branchId?: string;

  @IsString()
  @IsNotEmpty({ message: 'El almacén es requerido' })
  warehouseId: string;

  @IsNumber()
  @IsOptional()
  @Type(() => Number)
  exchangeRate?: number;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateOrderItemDto)
  items: CreateOrderItemDto[];

  @IsString()
  @IsOptional()
  type?: 'SALE' | 'PURCHASE';

  @IsString()
  @IsNotEmpty({ message: 'La moneda es requerida' })
  currencyId: string;
}
