import { IsString, IsOptional, IsUUID } from 'class-validator';

export class CreateDepartmentDto {
  @IsString({ message: 'Nombre es requerido' })
  name: string;

  @IsOptional()
  @IsUUID('all', { message: 'Departamento padre inválido' })
  parentId?: string;

  @IsUUID('all', { message: 'Sucursal inválida' })
  branchId: string;
}

export class UpdateDepartmentDto {
  @IsOptional()
  @IsString({ message: 'Nombre debe ser texto' })
  name?: string;

  @IsOptional()
  @IsUUID('all', { message: 'Departamento padre inválido' })
  parentId?: string;

  @IsOptional()
  @IsUUID('all', { message: 'Sucursal inválida' })
  branchId?: string;
}
