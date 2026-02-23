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
import { PermissionsGuard } from '../../../common/guards/permissions.guard';
import { RequirePermission } from '../../../common/decorators/permissions.decorator';
import { PERMISSIONS } from '@repo/db';

@ApiTags('Recursos Humanos - Vacaciones')
@Controller('hr/vacations')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class VacationsController {
  constructor(private readonly vacationsService: VacationsService) {}

  @Get('employee/:employeeId')
  @ApiOperation({
    summary: 'Obtener historial de vacaciones',
    description:
      'Retorna todas las solicitudes y períodos de vacaciones de un empleado.',
  })
  @RequirePermission(PERMISSIONS.HR.EMPLOYEES.VIEW)
  async getByEmployee(@Param('employeeId') employeeId: string) {
    return this.vacationsService.getVacationsByEmployee(employeeId);
  }

  @Post()
  @ApiOperation({
    summary: 'Registrar nueva solicitud de vacaciones',
    description:
      'Crea un registro de vacaciones para un empleado en un año específico.',
  })
  @RequirePermission(PERMISSIONS.HR.EMPLOYEES.EDIT)
  async create(@Body() createVacationDto: CreateVacationDto) {
    return this.vacationsService.createVacation(createVacationDto);
  }

  @Patch(':id')
  @ApiOperation({
    summary: 'Actualizar registro de vacaciones',
    description:
      'Modifica el estado o las fechas de un registro de vacaciones existente.',
  })
  @RequirePermission(PERMISSIONS.HR.EMPLOYEES.EDIT)
  async update(
    @Param('id') id: string,
    @Body() updateVacationDto: UpdateVacationDto,
  ) {
    return this.vacationsService.updateVacation(id, updateVacationDto);
  }

  @Delete(':id')
  @ApiOperation({
    summary: 'Eliminar registro de vacaciones',
    description: 'Elimina el registro de vacaciones especificado.',
  })
  @RequirePermission(PERMISSIONS.HR.EMPLOYEES.EDIT)
  async remove(@Param('id') id: string) {
    return this.vacationsService.deleteVacation(id);
  }
}
