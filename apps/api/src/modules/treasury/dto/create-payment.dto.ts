import {
  IsString,
  IsNotEmpty,
  IsUUID,
  IsNumber,
  IsOptional,
  IsArray,
  ValidateNested,
  IsEnum,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class PaymentAllocationDto {
  @ApiProperty({
    description: 'ID de la factura a la que se aplica el pago',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  @IsUUID()
  @IsNotEmpty()
  invoiceId: string;

  @ApiProperty({
    description: 'Monto a aplicar a esta factura',
    example: 50.0,
  })
  @IsNumber()
  @IsNotEmpty()
  amount: number;
}

export class CreatePaymentDto {
  @ApiPropertyOptional({
    description: 'ID de la factura (para pagos simples)',
    example: 'uuid',
  })
  @IsOptional()
  @IsUUID()
  invoiceId?: string;

  @ApiProperty({
    description: 'ID del cliente o proveedor',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  @IsUUID()
  @IsNotEmpty()
  partnerId: string;

  @ApiProperty({
    description: 'ID del método de pago',
    example: '550e8400-e29b-41d4-a716-446655440001',
  })
  @IsUUID()
  @IsNotEmpty()
  methodId: string;

  @ApiProperty({
    description: 'ID de la moneda del pago',
    example: '550e8400-e29b-41d4-a716-446655440002',
  })
  @IsUUID()
  @IsNotEmpty()
  currencyId: string;

  @ApiProperty({
    description: 'Monto total del pago',
    example: '150.00',
  })
  @IsString()
  @IsNotEmpty()
  amount: string;

  @ApiPropertyOptional({
    description: 'Referencia bancaria o número de comprobante',
    example: 'TRANS-123456',
  })
  @IsOptional()
  @IsString()
  reference?: string;

  @ApiPropertyOptional({
    description: 'Metadatos adicionales del pago',
    example: { bank: 'Banesco', holder: 'Juan Perez' },
  })
  @IsOptional()
  metadata?: any;

  @ApiPropertyOptional({
    description: 'Desglose de aplicación del pago a múltiples facturas',
    type: [PaymentAllocationDto],
  })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => PaymentAllocationDto)
  allocations?: PaymentAllocationDto[];

  @ApiPropertyOptional({
    description: 'ID de la cuenta bancaria de destino (si aplica)',
    example: 'uuid',
  })
  @IsOptional()
  @IsUUID()
  bankAccountId?: string;

  @ApiPropertyOptional({
    description: 'Tasa de cambio aplicada al pago',
    example: '36.25',
  })
  @IsOptional()
  @IsString()
  exchangeRate?: string;

  @ApiPropertyOptional({
    description: 'Tipo de flujo de caja',
    enum: ['INCOME', 'EXPENSE'],
    example: 'INCOME',
  })
  @IsOptional()
  @IsEnum(['INCOME', 'EXPENSE'])
  type?: 'INCOME' | 'EXPENSE';
}
