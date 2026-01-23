import {
  IsString,
  IsEmail,
  IsNotEmpty,
  IsArray,
  IsOptional,
  MinLength,
  IsUUID,
} from 'class-validator';

export class CreateUserDto {
  @IsEmail({}, { message: 'Email inválido' })
  @IsNotEmpty({ message: 'El email es requerido' })
  email: string;

  @IsString({ message: 'La contraseña debe ser texto' })
  @IsNotEmpty({ message: 'La contraseña es requerida' })
  @MinLength(6, { message: 'La contraseña debe tener al menos 6 caracteres' })
  password: string;

  @IsString({ message: 'El nombre debe ser texto' })
  @IsNotEmpty({ message: 'El nombre es requerido' })
  name: string;

  @IsArray({ message: 'Roles debe ser un arreglo' })
  @IsUUID(4, { each: true, message: 'ID de rol inválido' })
  @IsNotEmpty({ message: 'Debe asignar al menos un rol' })
  roleIds: string[];

  @IsArray({ message: 'Sucursales debe ser un arreglo' })
  @IsUUID(4, { each: true, message: 'ID de sucursal inválido' })
  @IsNotEmpty({ message: 'Debe asignar al menos una sucursal' })
  branchIds: string[];
}
