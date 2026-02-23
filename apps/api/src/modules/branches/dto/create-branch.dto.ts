import { IsString, IsOptional, IsBoolean } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateBranchDto {
  @ApiProperty({
    description: 'Nombre de la sucursal',
    example: 'Sucursal Centro',
  })
  @IsString()
  name: string;

  @ApiPropertyOptional({
    description: 'Dirección física de la sucursal',
    example: 'Av. Bolívar, Edif. Total, Piso 1',
  })
  @IsString()
  @IsOptional()
  address?: string;

  @ApiPropertyOptional({
    description: 'Identificación fiscal (RIF/NIT)',
    example: 'J-12345678-0',
  })
  @IsString()
  @IsOptional()
  taxId?: string;

  @ApiPropertyOptional({
    description: 'Teléfono de contacto',
    example: '+58 212 555 5555',
  })
  @IsString()
  @IsOptional()
  phone?: string;

  @ApiPropertyOptional({
    description: 'Correo electrónico de la sucursal',
    example: 'centro@totalerp.com',
  })
  @IsString()
  @IsOptional()
  email?: string;

  @ApiPropertyOptional({
    description: 'Estado de actividad de la sucursal',
    default: true,
  })
  @IsBoolean()
  @IsOptional()
  isActive?: boolean;
}
