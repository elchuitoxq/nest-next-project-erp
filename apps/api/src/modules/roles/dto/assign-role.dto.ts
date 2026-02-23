import { IsString, IsNotEmpty, IsUUID } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class AssignRoleDto {
  @ApiProperty({
    description: 'ID del usuario al que se le asignará el rol',
    example: 'uuid-usuario',
  })
  @IsString()
  @IsNotEmpty()
  @IsUUID()
  userId: string;

  @ApiProperty({
    description: 'ID del rol a asignar',
    example: 'uuid-rol',
  })
  @IsString()
  @IsNotEmpty()
  @IsUUID()
  roleId: string;
}
