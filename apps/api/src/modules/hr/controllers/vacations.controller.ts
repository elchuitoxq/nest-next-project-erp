import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  UseGuards,
  Delete,
} from '@nestjs/common';
import { VacationsService } from '../services/vacations.service';
import { CreateVacationDto, UpdateVacationDto } from '../dto/vacation.dto';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';

@ApiTags('HR - Vacations (Vacaciones)')
@Controller('hr/vacations')
@UseGuards(JwtAuthGuard)
export class VacationsController {
  constructor(private readonly vacationsService: VacationsService) {}

  @Get('employee/:employeeId')
  @ApiOperation({ summary: 'Get vacations history for an employee' })
  async getByEmployee(@Param('employeeId') employeeId: string) {
    return this.vacationsService.getVacationsByEmployee(employeeId);
  }

  @Post()
  @ApiOperation({ summary: 'Create a new vacation record' })
  async create(@Body() createVacationDto: CreateVacationDto) {
    return this.vacationsService.createVacation(createVacationDto);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a vacation record' })
  async update(
    @Param('id') id: string,
    @Body() updateVacationDto: UpdateVacationDto,
  ) {
    return this.vacationsService.updateVacation(id, updateVacationDto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a vacation record' })
  async remove(@Param('id') id: string) {
    return this.vacationsService.deleteVacation(id);
  }
}
