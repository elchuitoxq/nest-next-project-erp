import {
  IsString,
  IsNotEmpty,
  IsUUID,
  IsNumber,
  IsArray,
  ValidateNested,
  Min,
  IsOptional,
  IsDateString,
  IsEnum,
  IsBoolean,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export enum InvoiceType {
  SALE = 'SALE',
  PURCHASE = 'PURCHASE',
}

export class CreateInvoiceLineDto {
  @ApiProperty({
    description: 'ID del producto a facturar',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  @IsUUID('all', { message: 'ID de producto inválido' })
  @IsNotEmpty({ message: 'El producto es requerido' })
  productId: string;

  @ApiProperty({
    description: 'Cantidad de unidades',
    example: 5,
  })
  @IsNumber({}, { message: 'La cantidad debe ser un número' })
  @Min(0.01, { message: 'La cantidad debe ser mayor a 0' })
  quantity: number;

  @ApiProperty({
    description: 'Precio unitario en la moneda seleccionada',
    example: 100.0,
  })
  @IsNumber({}, { message: 'El precio debe ser un número' })
  @Min(0, { message: 'El precio no puede ser negativo' })
  price: number;

  @ApiPropertyOptional({
    description: 'ID de la moneda específica para este ítem',
    example: 'uuid',
  })
  @IsOptional()
  @IsUUID('all', { message: 'ID de moneda inválido' })
  currencyId?: string;
}

export class CreateInvoiceDto {
  @ApiProperty({
    description: 'ID del cliente o proveedor',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  @IsUUID('all', { message: 'ID de socio inválido' })
  @IsNotEmpty({ message: 'El socio es requerido' })
  partnerId: string;

  @ApiProperty({
    description: 'ID de la moneda principal de la factura',
    example: '550e8400-e29b-41d4-a716-446655440001',
  })
  @IsString({ message: 'La moneda es requerida' })
  @IsNotEmpty({ message: 'Debe seleccionar una moneda' })
  currencyId: string;

  @ApiProperty({
    description: 'Fecha de emisión de la factura',
    example: '2024-03-20T00:00:00.000Z',
  })
  @IsDateString({}, { message: 'Fecha inválida' })
  @IsNotEmpty({ message: 'La fecha es requerida' })
  date: string;

  @ApiPropertyOptional({
    description: 'Fecha de vencimiento',
    example: '2024-04-20T00:00:00.000Z',
  })
  @IsOptional()
  @IsDateString({}, { message: 'Fecha de vencimiento inválida' })
  dueDate?: string;

  @ApiProperty({
    description: 'Arreglo de líneas de detalle de la factura',
    type: [CreateInvoiceLineDto],
  })
  @IsArray({ message: 'Detalles debe ser un arreglo' })
  @ValidateNested({ each: true })
  @Type(() => CreateInvoiceLineDto)
  @IsNotEmpty({ message: 'Debe agregar al menos un ítem' })
  items: CreateInvoiceLineDto[];

  @ApiPropertyOptional({
    description: 'Notas adicionales u observaciones',
    example: 'Entregar en horario comercial',
  })
  @IsOptional()
  @IsString()
  note?: string;

  @ApiPropertyOptional({
    description: 'Tipo de factura',
    enum: InvoiceType,
    default: InvoiceType.SALE,
  })
  @IsString({ message: 'El tipo debe ser texto' })
  @IsEnum(InvoiceType, { message: 'Tipo de factura inválido' })
  @IsOptional()
  type?: InvoiceType;

  @ApiPropertyOptional({
    description: 'Número de control o número de factura físico',
    example: 'FAC-000123',
  })
  @IsOptional()
  @IsString({ message: 'Número de factura debe ser texto' })
  invoiceNumber?: string;

  @ApiPropertyOptional({
    description: 'ID del pedido origen (si aplica)',
    example: 'uuid',
  })
  @IsOptional()
  @IsUUID('all', { message: 'ID de orden inválido' })
  orderId?: string;

  @ApiPropertyOptional({
    description: 'ID del método de pago predeterminado',
    example: 'uuid',
  })
  @IsUUID('all', { message: 'ID de método de pago inválido' })
  @IsOptional()
  paymentMethodId?: string;

  @ApiPropertyOptional({
    description: 'ID del almacén de donde sale/entra la mercancía',
    example: 'uuid',
  })
  @IsOptional()
  @IsUUID('all', { message: 'ID de almacén inválido' })
  warehouseId?: string;

  @ApiPropertyOptional({
    description: 'Tasa de cambio aplicada',
    example: 36.25,
  })
  @IsOptional()
  @IsNumber({}, { message: 'La tasa de cambio debe ser un número' })
  exchangeRate?: number;

  @ApiPropertyOptional({
    description: 'Estado inicial de la factura',
    default: 'DRAFT',
    example: 'DRAFT',
  })
  @IsOptional()
  @IsString()
  status?: string;

  @ApiPropertyOptional({
    description: 'Indica si se debe aplicar el impuesto IGTF',
    default: false,
    example: true,
  })
  @IsOptional()
  @IsBoolean()
  applyIgtf?: boolean;
}
