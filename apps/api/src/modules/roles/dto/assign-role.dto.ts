import { IsString, IsNotEmpty, IsUUID } from 'class-validator';

export class AssignRoleDto {
  @IsString()
  @IsNotEmpty()
  @IsUUID()
  userId: string;

  @IsString()
  @IsNotEmpty()
  @IsUUID()
  roleId: string;
}
