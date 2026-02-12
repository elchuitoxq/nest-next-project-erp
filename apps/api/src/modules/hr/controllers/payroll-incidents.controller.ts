import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  UseGuards,
} from '@nestjs/common';
import { PayrollIncidentsService } from '../services/payroll-incidents.service';
import {
  CreateIncidentDto,
  UpdateIncidentDto,
} from '../dto/payroll-incident.dto';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { ApiTags, ApiOperation, ApiQuery } from '@nestjs/swagger';

@ApiTags('HR - Payroll Incidents (Novedades)')
@Controller('hr/incidents')
@UseGuards(JwtAuthGuard)
export class PayrollIncidentsController {
  constructor(private readonly incidentsService: PayrollIncidentsService) {}

  @Get()
  @ApiOperation({ summary: 'List incidents, optionally filtered by employee' })
  @ApiQuery({ name: 'employeeId', required: false })
  async findAll(@Query('employeeId') employeeId?: string) {
    return this.incidentsService.findAll(employeeId);
  }

  @Post()
  @ApiOperation({ summary: 'Register a new incident' })
  async create(@Body() createDto: CreateIncidentDto) {
    return this.incidentsService.create(createDto);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update incident' })
  async update(@Param('id') id: string, @Body() updateDto: UpdateIncidentDto) {
    return this.incidentsService.update(id, updateDto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete incident' })
  async delete(@Param('id') id: string) {
    return this.incidentsService.delete(id);
  }
}
