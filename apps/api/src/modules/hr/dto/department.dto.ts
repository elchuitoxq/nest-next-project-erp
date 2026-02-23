import { IsString, IsOptional, IsUUID } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateDepartmentDto {
  @ApiProperty({
    description: 'Nombre del departamento',
    example: 'Administración y Finanzas',
  })
  @IsString({ message: 'Nombre es requerido' })
  name: string;

  @ApiPropertyOptional({
    description: 'ID de un departamento superior (para estructura jerárquica)',
    example: 'uuid',
  })
  @IsOptional()
  @IsUUID('all', { message: 'Departamento padre inválido' })
  parentId?: string;

  @ApiProperty({
    description: 'ID de la sucursal a la que pertenece',
    example: 'uuid',
  })
  @IsUUID('all', { message: 'Sucursal inválida' })
  branchId: string;
}

export class UpdateDepartmentDto {
  @ApiPropertyOptional({
    description: 'Nombre del departamento',
    example: 'Recursos Humanos (Actualizado)',
  })
  @IsOptional()
  @IsString({ message: 'Nombre debe ser texto' })
  name?: string;

  @ApiPropertyOptional({
    description: 'ID del departamento padre',
    example: 'uuid',
  })
  @IsOptional()
  @IsUUID('all', { message: 'Departamento padre inválido' })
  parentId?: string;

  @ApiPropertyOptional({
    description: 'ID de la sucursal',
    example: 'uuid',
  })
  @IsOptional()
  @IsUUID('all', { message: 'Sucursal inválida' })
  branchId?: string;
}
