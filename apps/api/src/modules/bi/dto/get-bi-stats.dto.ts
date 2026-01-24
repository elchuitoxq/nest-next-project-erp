import { IsDateString, IsOptional } from 'class-validator';

export class GetBiStatsDto {
  @IsOptional()
  @IsDateString()
  startDate?: string;

  @IsOptional()
  @IsDateString()
  endDate?: string;
}
