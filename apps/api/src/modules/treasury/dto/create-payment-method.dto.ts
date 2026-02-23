import {
  IsString,
  IsNotEmpty,
  IsUUID,
  IsOptional,
  IsBoolean,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreatePaymentMethodDto {
  @ApiProperty({
    description: 'Nombre del método de pago',
    example: 'Transferencia Banesco',
  })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({
    description: 'Código único para el método de pago',
    example: 'BANESCO_USD',
  })
  @IsString()
  @IsNotEmpty()
  code: string;

  @ApiPropertyOptional({
    description: 'ID de la moneda asociada (fija)',
    example: 'uuid',
  })
  @IsOptional()
  @IsUUID()
  currencyId?: string;

  @ApiProperty({
    description:
      'Indica si es un método de pago digital (Transferencia, Pago Móvil)',
    default: true,
  })
  @IsBoolean()
  isDigital: boolean;
}

export class UpdatePaymentMethodDto {
  @ApiPropertyOptional({
    description: 'Nombre del método de pago',
    example: 'Transferencia Banesco Editada',
  })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiPropertyOptional({
    description: 'Código único para el método de pago',
    example: 'BANESCO_USD_V2',
  })
  @IsOptional()
  @IsString()
  code?: string;

  @ApiPropertyOptional({
    description: 'ID de la moneda asociada',
    example: 'uuid',
  })
  @IsOptional()
  @IsUUID()
  currencyId?: string;

  @ApiPropertyOptional({
    description: 'Indica si es un método de pago digital',
  })
  @IsOptional()
  @IsBoolean()
  isDigital?: boolean;
}
