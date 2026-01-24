import { Controller, Get, Post, Put, Delete, Body, Param, UseGuards } from '@nestjs/common';
import { JobPositionsService } from '../services/job-positions.service';
import { CreateJobPositionDto, UpdateJobPositionDto } from '../dto/job-position.dto';
import { JwtAuthGuard } from '../../../modules/auth/jwt-auth.guard';

@Controller('hr/positions')
@UseGuards(JwtAuthGuard)
export class JobPositionsController {
  constructor(private readonly positionsService: JobPositionsService) {}

  @Get()
  findAll() {
    return this.positionsService.findAll();
  }

  @Post()
  create(@Body() dto: CreateJobPositionDto) {
    return this.positionsService.create(dto);
  }

  @Put(':id')
  update(@Param('id') id: string, @Body() dto: UpdateJobPositionDto) {
    return this.positionsService.update(id, dto);
  }

  @Delete(':id')
  delete(@Param('id') id: string) {
    return this.positionsService.delete(id);
  }
}
