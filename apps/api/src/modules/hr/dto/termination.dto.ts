import {
  IsString,
  IsNotEmpty,
  IsDateString,
  IsOptional,
  IsNumber,
} from 'class-validator';

export class CalculateTerminationDto {
  @IsString()
  @IsNotEmpty()
  employeeId: string;

  @IsDateString()
  @IsNotEmpty()
  date: string;

  @IsString()
  @IsNotEmpty()
  reason: string; // 'RESIGNATION', 'DISMISSAL_JUSTIFIED', 'DISMISSAL_UNJUSTIFIED'
}

export class ExecuteTerminationDto extends CalculateTerminationDto {
  @IsString()
  @IsOptional()
  notes?: string;
}
