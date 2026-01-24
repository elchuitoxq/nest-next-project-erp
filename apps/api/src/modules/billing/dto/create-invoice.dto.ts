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
} from 'class-validator';
import { Type } from 'class-transformer';

export enum InvoiceType {
  SALE = 'SALE',
  PURCHASE = 'PURCHASE',
}

export class CreateInvoiceLineDto {
  @IsUUID('all', { message: 'ID de producto inválido' })
  @IsNotEmpty({ message: 'El producto es requerido' })
  productId: string;

  @IsNumber({}, { message: 'La cantidad debe ser un número' })
  @Min(0.01, { message: 'La cantidad debe ser mayor a 0' })
  quantity: number;

  @IsNumber({}, { message: 'El precio debe ser un número' })
  @Min(0, { message: 'El precio no puede ser negativo' })
  price: number;

  @IsOptional()
  @IsUUID('all', { message: 'ID de moneda inválido' })
  currencyId?: string;
}

export class CreateInvoiceDto {
  @IsUUID('all', { message: 'ID de socio inválido' })
  @IsNotEmpty({ message: 'El socio es requerido' })
  partnerId: string;

  @IsString({ message: 'La moneda es requerida' })
  @IsNotEmpty({ message: 'Debe seleccionar una moneda' })
  currencyId: string;

  @IsDateString({}, { message: 'Fecha inválida' })
  @IsNotEmpty({ message: 'La fecha es requerida' })
  date: string;

  @IsOptional()
  @IsDateString({}, { message: 'Fecha de vencimiento inválida' })
  dueDate?: string;

  @IsArray({ message: 'Detalles debe ser un arreglo' })
  @ValidateNested({ each: true })
  @Type(() => CreateInvoiceLineDto)
  @IsNotEmpty({ message: 'Debe agregar al menos un ítem' })
  items: CreateInvoiceLineDto[];

  @IsOptional()
  @IsString()
  note?: string;

  @IsString({ message: 'El tipo debe ser texto' })
  @IsEnum(InvoiceType, { message: 'Tipo de factura inválido' })
  @IsOptional()
  type?: InvoiceType;

  @IsOptional()
  @IsString({ message: 'Número de factura debe ser texto' })
  invoiceNumber?: string;

  @IsOptional()
  @IsUUID('all', { message: 'ID de orden inválido' })
  orderId?: string;

  @IsUUID('all', { message: 'ID de método de pago inválido' })
  @IsOptional()
  paymentMethodId?: string;

  @IsOptional()
  @IsUUID('all', { message: 'ID de almacén inválido' })
  warehouseId?: string;

  @IsOptional()
  @IsNumber({}, { message: 'La tasa de cambio debe ser un número' })
  exchangeRate?: number;

  @IsOptional()
  @IsString()
  status?: string;
}
