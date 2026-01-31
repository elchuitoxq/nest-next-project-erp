import { IsOptional, IsString, IsNumber, Min, IsEnum } from 'class-validator';
import { Type, Transform } from 'class-transformer';
import { InvoiceType } from './create-invoice.dto';

export class FindInvoicesDto {
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  page?: number = 1;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  limit?: number = 25;

  @IsOptional()
  @IsString()
  search?: string;

  @IsOptional()
  @Transform(({ value }) => {
    if (typeof value === 'string') return value.split(',');
    return value;
  })
  @IsEnum(InvoiceType, { each: true })
  type?: InvoiceType[];

  @IsOptional()
  @Transform(({ value }) => {
    if (typeof value === 'string') return value.split(',');
    return value;
  })
  @IsString({ each: true })
  status?: string[];

  @IsOptional()
  @IsString()
  partnerId?: string;
}
