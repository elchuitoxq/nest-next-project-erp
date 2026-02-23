import { Controller, Get, Post, Body, Param, UseGuards } from '@nestjs/common';
import { ProfitSharingService } from '../services/profit-sharing.service';
import { CreateProfitSharingDto } from '../dto/profit-sharing.dto';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { ApiTags, ApiOperation } from '@nestjs/swagger';

import { PermissionsGuard } from '../../../common/guards/permissions.guard';
import { RequirePermission } from '../../../common/decorators/permissions.decorator';
import { PERMISSIONS } from '@repo/db';

@ApiTags('Recursos Humanos - Reparto de Utilidades')
@Controller('hr/profit-sharing')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class ProfitSharingController {
  constructor(private readonly profitSharingService: ProfitSharingService) {}

  @Get('employee/:employeeId')
  @ApiOperation({
    summary: 'Obtener historial de utilidades',
    description: 'Retorna el histórico de utilidades pagadas a un empleado.',
  })
  @RequirePermission(PERMISSIONS.HR.EMPLOYEES.VIEW)
  async getByEmployee(@Param('employeeId') employeeId: string) {
    return this.profitSharingService.getByEmployee(employeeId);
  }

  @Post()
  @ApiOperation({
    summary: 'Registrar utilidades',
    description: 'Crea un registro de pago de utilidades para un empleado.',
  })
  @RequirePermission(PERMISSIONS.HR.PAYROLL.PROCESS)
  async create(@Body() createDto: CreateProfitSharingDto) {
    return this.profitSharingService.create(createDto);
  }
}
