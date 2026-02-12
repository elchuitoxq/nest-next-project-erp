import { Controller, Post, Body, UseGuards } from '@nestjs/common';
import { TerminationsService } from '../services/terminations.service';
import {
  CalculateTerminationDto,
  ExecuteTerminationDto,
} from '../dto/termination.dto';
import { JwtAuthGuard } from '../../../modules/auth/jwt-auth.guard';

@Controller('hr/terminations')
@UseGuards(JwtAuthGuard)
export class TerminationsController {
  constructor(private readonly terminationsService: TerminationsService) {}

  @Post('calculate')
  calculate(@Body() data: CalculateTerminationDto) {
    return this.terminationsService.calculate(data);
  }

  @Post('execute')
  execute(@Body() data: ExecuteTerminationDto) {
    return this.terminationsService.execute(data);
  }
}
