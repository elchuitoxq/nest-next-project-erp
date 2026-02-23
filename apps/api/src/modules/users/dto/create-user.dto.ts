import {
  IsString,
  IsEmail,
  IsNotEmpty,
  IsArray,
  IsOptional,
  MinLength,
  IsUUID,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateUserDto {
  @ApiProperty({
    description: 'Correo electrónico único del usuario',
    example: 'juan.perez@empresa.com',
  })
  @IsEmail({}, { message: 'Email inválido' })
  @IsNotEmpty({ message: 'El email es requerido' })
  email: string;

  @ApiProperty({
    description: 'Contraseña de acceso (mínimo 6 caracteres)',
    example: 'password123',
    minLength: 6,
  })
  @IsString({ message: 'La contraseña debe ser texto' })
  @IsNotEmpty({ message: 'La contraseña es requerida' })
  @MinLength(6, { message: 'La contraseña debe tener al menos 6 caracteres' })
  password: string;

  @ApiProperty({
    description: 'Nombre completo del usuario',
    example: 'Juan Pérez',
  })
  @IsString({ message: 'El nombre debe ser texto' })
  @IsNotEmpty({ message: 'El nombre es requerido' })
  name: string;

  @ApiProperty({
    description: 'Lista de IDs de roles asignados',
    example: ['uuid-rol-admin', 'uuid-rol-ventas'],
  })
  @IsArray({ message: 'Roles debe ser un arreglo' })
  @IsUUID('all', { each: true, message: 'ID de rol inválido' })
  @IsNotEmpty({ message: 'Debe asignar al menos un rol' })
  roleIds: string[];

  @ApiProperty({
    description: 'Lista de IDs de sucursales a las que tiene acceso',
    example: ['uuid-sucursal-principal'],
  })
  @IsArray({ message: 'Sucursales debe ser un arreglo' })
  @IsUUID('all', { each: true, message: 'ID de sucursal inválido' })
  @IsNotEmpty({ message: 'Debe asignar al menos una sucursal' })
  branchIds: string[];
}
