import { Controller, Post, Body, UseGuards } from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiHeader,
} from '@nestjs/swagger';
import { TerminationsService } from '../services/terminations.service';
import {
  CalculateTerminationDto,
  ExecuteTerminationDto,
} from '../dto/termination.dto';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { PermissionsGuard } from '../../../common/guards/permissions.guard';
import { RequirePermission } from '../../../common/decorators/permissions.decorator';
import { PERMISSIONS } from '@repo/db';

@ApiTags('Recursos Humanos - Egresos y Liquidaciones')
@ApiBearerAuth()
@ApiHeader({
  name: 'x-branch-id',
  description: 'ID de la sucursal',
  required: false,
})
@Controller('hr/terminations')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class TerminationsController {
  constructor(private readonly terminationsService: TerminationsService) {}

  @Post('calculate')
  @ApiOperation({
    summary: 'Calcular liquidación',
    description: 'Calcula los conceptos de liquidación sin ejecutar el egreso.',
  })
  @ApiResponse({ status: 200, description: 'Cálculo realizado' })
  @RequirePermission(PERMISSIONS.HR.PAYROLL.PROCESS)
  calculate(@Body() data: CalculateTerminationDto) {
    return this.terminationsService.calculate(data);
  }

  @Post('execute')
  @ApiOperation({
    summary: 'Ejecutar egreso laboral',
    description: 'Procesa la liquidación y marca al empleado como inactivo.',
  })
  @ApiResponse({ status: 201, description: 'Egreso ejecutado' })
  @RequirePermission(PERMISSIONS.HR.PAYROLL.PROCESS)
  execute(@Body() data: ExecuteTerminationDto) {
    return this.terminationsService.execute(data);
  }
}
