import {
  IsString,
  IsNotEmpty,
  IsNumber,
  IsArray,
  ValidateNested,
  IsOptional,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

class CreateOrderItemDto {
  @ApiProperty({
    description: 'ID del producto',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  @IsString()
  @IsNotEmpty()
  productId: string;

  @ApiProperty({
    description: 'Cantidad de unidades',
    example: 10,
  })
  @IsNumber()
  @IsNotEmpty()
  @Type(() => Number)
  quantity: number;

  @ApiProperty({
    description: 'Precio unitario en la moneda seleccionada',
    example: 25.5,
  })
  @IsNumber()
  @IsNotEmpty()
  @Type(() => Number)
  price: number;

  @ApiPropertyOptional({
    description: 'ID de la moneda (si difiere de la del pedido)',
    example: 'uuid',
  })
  @IsString()
  @IsOptional()
  currencyId?: string;

  @ApiPropertyOptional({
    description: 'ID del lote (opcional)',
    example: 'BATCH-001',
  })
  @IsString()
  @IsOptional()
  batchId?: string;

  @ApiPropertyOptional({
    description: 'Cantidad máxima disponible (referencial)',
    example: 100,
  })
  @IsNumber()
  @IsOptional()
  maxQuantity?: number;
}

export class CreateOrderDto {
  @ApiProperty({
    description: 'ID de la entidad legal o comercial (Cliente/Proveedor)',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  @IsString()
  @IsNotEmpty({ message: 'El cliente es requerido' })
  partnerId: string;

  @ApiPropertyOptional({
    description: 'ID de la sucursal (se toma automáticamente si no se provee)',
    example: 'uuid',
  })
  @IsString()
  @IsOptional()
  branchId?: string;

  @ApiProperty({
    description: 'ID del almacén asociado al pedido',
    example: '550e8400-e29b-41d4-a716-446655440001',
  })
  @IsString()
  @IsNotEmpty({ message: 'El almacén es requerido' })
  warehouseId: string;

  @ApiPropertyOptional({
    description: 'Tasa de cambio personalizada para el pedido',
    example: 36.5,
  })
  @IsNumber()
  @IsOptional()
  @Type(() => Number)
  exchangeRate?: number;

  @ApiProperty({
    description: 'Lista de productos incluidos en el pedido',
    type: [CreateOrderItemDto],
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateOrderItemDto)
  items: CreateOrderItemDto[];

  @ApiPropertyOptional({
    description: 'Tipo de pedido',
    enum: ['SALE', 'PURCHASE'],
    default: 'SALE',
  })
  @IsString()
  @IsOptional()
  type?: 'SALE' | 'PURCHASE';

  @ApiProperty({
    description: 'ID de la moneda principal del pedido',
    example: '550e8400-e29b-41d4-a716-446655440002',
  })
  @IsString()
  @IsNotEmpty({ message: 'La moneda es requerida' })
  currencyId: string;
}
