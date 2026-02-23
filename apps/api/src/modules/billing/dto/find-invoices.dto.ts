import { IsOptional, IsString, IsNumber, Min, IsEnum } from 'class-validator';
import { Type, Transform } from 'class-transformer';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { InvoiceType } from './create-invoice.dto';

export class FindInvoicesDto {
  @ApiPropertyOptional({
    description: 'Número de página',
    default: 1,
    example: 1,
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  page?: number = 1;

  @ApiPropertyOptional({
    description: 'Registros por página',
    default: 25,
    example: 10,
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  limit?: number = 25;

  @ApiPropertyOptional({
    description: 'Búsqueda por número de factura o nombre de socio',
    example: 'FAC-001',
  })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({
    description: 'Filtrar por tipo (SALE, PURCHASE)',
    example: 'SALE',
    type: String,
  })
  @IsOptional()
  @Transform(({ value }) => {
    if (typeof value === 'string') return value.split(',');
    return value;
  })
  @IsEnum(InvoiceType, { each: true })
  type?: InvoiceType[];

  @ApiPropertyOptional({
    description: 'Filtrar por estado (DRAFT, POSTED, VOIDED)',
    example: 'DRAFT',
    type: String,
  })
  @IsOptional()
  @Transform(({ value }) => {
    if (typeof value === 'string') return value.split(',');
    return value;
  })
  @IsString({ each: true })
  status?: string[];

  @ApiPropertyOptional({
    description: 'Filtrar por ID de socio',
    example: 'uuid',
  })
  @IsOptional()
  @IsString()
  partnerId?: string;
}
