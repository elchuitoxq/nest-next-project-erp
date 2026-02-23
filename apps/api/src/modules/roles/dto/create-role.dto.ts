import { IsString, IsNotEmpty, IsOptional } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateRoleDto {
  @ApiProperty({
    description: 'Nombre único del rol',
    example: 'Vendedor Senior',
  })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiPropertyOptional({
    description: 'Descripción de las responsabilidades del rol',
    example: 'Acceso a ventas, reportes básicos y gestión de clientes.',
  })
  @IsString()
  @IsOptional()
  description?: string;
}
