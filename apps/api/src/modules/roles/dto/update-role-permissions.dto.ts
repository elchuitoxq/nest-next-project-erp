import { IsArray, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class UpdateRolePermissionsDto {
  @ApiProperty({
    description: 'Lista de códigos de permisos a asignar (ej: partners:view)',
    example: ['partners:view', 'partners:edit', 'treasury:view'],
  })
  @IsArray()
  @IsString({ each: true })
  permissionIds: string[]; // Receives codes like 'treasury:view' now
}
