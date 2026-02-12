import { IsString, IsOptional, IsNumber } from 'class-validator';

export class UpdatePayrollSettingDto {
  @IsNumber({}, { message: 'El valor debe ser un número' })
  value: number;

  @IsOptional()
  @IsString({ message: 'El tipo debe ser texto' })
  type?: string;
}
