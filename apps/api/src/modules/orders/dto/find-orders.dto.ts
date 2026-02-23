import { IsOptional, IsString, IsNumber, Min, IsEnum } from 'class-validator';
import { Type, Transform } from 'class-transformer';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class FindOrdersDto {
  @ApiPropertyOptional({
    description: 'Número de página para paginación',
    default: 1,
    example: 1,
  })
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  page?: number = 1;

  @ApiPropertyOptional({
    description: 'Cantidad de registros por página',
    default: 25,
    example: 10,
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  limit?: number = 25;

  @ApiPropertyOptional({
    description:
      'Término de búsqueda (por código de pedido o nombre de cliente)',
    example: 'PED-2024',
  })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({
    description: 'Filtrar por tipo de pedido (separados por coma)',
    example: 'SALE,PURCHASE',
    type: String,
  })
  @IsOptional()
  @Transform(({ value }) => {
    if (typeof value === 'string') {
      return value
        .split(',')
        .map((v) => v.trim())
        .filter(Boolean);
    }
    return value;
  })
  @IsString({ each: true })
  type?: string[]; // SALE, PURCHASE

  @ApiPropertyOptional({
    description: 'Filtrar por estado del pedido (separados por coma)',
    example: 'DRAFT,CONFIRMED',
    type: String,
  })
  @IsOptional()
  @Transform(({ value }) => {
    if (typeof value === 'string') {
      return value
        .split(',')
        .map((v) => v.trim())
        .filter(Boolean);
    }
    return value;
  })
  @IsString({ each: true })
  status?: string[];

  @ApiPropertyOptional({
    description: 'Filtrar por ID del cliente/proveedor',
    example: 'uuid',
  })
  @IsOptional()
  @IsString()
  partnerId?: string;
}
