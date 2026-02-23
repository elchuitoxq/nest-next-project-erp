import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsEnum,
  IsUUID,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateBankAccountDto {
  @ApiProperty({
    description: 'Nombre descriptivo de la cuenta',
    example: 'Cuenta Corriente Banesco VES',
  })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiPropertyOptional({
    description: 'Número de cuenta bancaria',
    example: '01340000000000000000',
  })
  @IsString()
  @IsOptional()
  accountNumber?: string;

  @ApiProperty({
    description: 'Tipo de cuenta',
    enum: ['CHECKING', 'SAVINGS', 'WALLET'],
    example: 'CHECKING',
  })
  @IsEnum(['CHECKING', 'SAVINGS', 'WALLET'])
  type: string;

  @ApiProperty({
    description: 'ID de la moneda de la cuenta',
    example: 'uuid',
  })
  @IsUUID()
  @IsNotEmpty()
  currencyId: string;
}
