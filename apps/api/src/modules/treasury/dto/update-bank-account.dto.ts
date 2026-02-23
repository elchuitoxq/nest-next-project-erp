import { PartialType, ApiPropertyOptional } from '@nestjs/swagger';
import { CreateBankAccountDto } from './create-bank-account.dto';
import { IsBoolean, IsOptional } from 'class-validator';

export class UpdateBankAccountDto extends PartialType(CreateBankAccountDto) {
  @ApiPropertyOptional({
    description: 'Estado de la cuenta (activa/inactiva)',
    default: true,
  })
  @IsBoolean()
  @IsOptional()
  isActive?: boolean;
}
