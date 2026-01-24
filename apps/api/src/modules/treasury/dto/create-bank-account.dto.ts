import { IsString, IsNotEmpty, IsOptional, IsEnum, IsUUID } from 'class-validator';

export class CreateBankAccountDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsString()
  @IsOptional()
  accountNumber?: string;

  @IsEnum(['CHECKING', 'SAVINGS', 'WALLET'])
  type: string;

  @IsUUID()
  @IsNotEmpty()
  currencyId: string;
}
