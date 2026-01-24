import { PartialType } from '@nestjs/mapped-types';
import { CreateBankAccountDto } from './create-bank-account.dto';
import { IsBoolean, IsOptional } from 'class-validator';

export class UpdateBankAccountDto extends PartialType(CreateBankAccountDto) {
  @IsBoolean()
  @IsOptional()
  isActive?: boolean;
}
