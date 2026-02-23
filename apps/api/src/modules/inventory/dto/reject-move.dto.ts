import { IsNotEmpty, IsString, MaxLength } from 'class-validator';

export class RejectMoveDto {
  @IsString()
  @IsNotEmpty({ message: 'El motivo de rechazo es requerido' })
  @MaxLength(500, { message: 'El motivo no puede superar 500 caracteres' })
  reason: string;
}
