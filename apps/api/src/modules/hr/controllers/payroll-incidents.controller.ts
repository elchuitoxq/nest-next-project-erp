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

import { PermissionsGuard } from '../../../common/guards/permissions.guard';
import { RequirePermission } from '../../../common/decorators/permissions.decorator';
import { PERMISSIONS } from '@repo/db';

@ApiTags('Recursos Humanos - Incidencias de Nómina')
@Controller('hr/incidents')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class PayrollIncidentsController {
  constructor(private readonly incidentsService: PayrollIncidentsService) {}

  @Get()
  @ApiOperation({
    summary: 'Listar incidencias',
    description:
      'Retorna las novedades de nómina, opcionalmente filtradas por empleado.',
  })
  @ApiQuery({ name: 'employeeId', required: false })
  @RequirePermission(PERMISSIONS.HR.INCIDENTS.VIEW)
  async findAll(@Query('employeeId') employeeId?: string) {
    return this.incidentsService.findAll(employeeId);
  }

  @Post()
  @ApiOperation({
    summary: 'Registrar nueva incidencia',
    description:
      'Crea un nuevo registro de novedad (bono, falta, etc.) para un empleado.',
  })
  @RequirePermission(PERMISSIONS.HR.INCIDENTS.CREATE)
  async create(@Body() createDto: CreateIncidentDto) {
    return this.incidentsService.create(createDto);
  }

  @Patch(':id')
  @ApiOperation({
    summary: 'Actualizar incidencia',
    description: 'Modifica los datos o el estado de una incidencia existente.',
  })
  @RequirePermission(PERMISSIONS.HR.INCIDENTS.APPROVE)
  async update(@Param('id') id: string, @Body() updateDto: UpdateIncidentDto) {
    return this.incidentsService.update(id, updateDto);
  }

  @Delete(':id')
  @ApiOperation({
    summary: 'Eliminar incidencia',
    description: 'Elimina el registro de la incidencia especificada.',
  })
  @RequirePermission(PERMISSIONS.HR.INCIDENTS.APPROVE)
  async delete(@Param('id') id: string) {
    return this.incidentsService.delete(id);
  }
}
