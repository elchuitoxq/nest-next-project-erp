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
import { BenefitsService } from '../services/benefits.service';
import { CreateBenefitDto, UpdateBenefitDto } from '../dto/benefit.dto';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';

import { PermissionsGuard } from '../../../common/guards/permissions.guard';
import { RequirePermission } from '../../../common/decorators/permissions.decorator';
import { PERMISSIONS } from '@repo/db';

@ApiTags('Recursos Humanos - Prestaciones Sociales')
@Controller('hr/benefits')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class BenefitsController {
  constructor(private readonly benefitsService: BenefitsService) {}

  @Get('employee/:employeeId')
  @ApiOperation({
    summary: 'Obtener historial de prestaciones',
    description:
      'Retorna el acumulado de prestaciones sociales y anticipos de un empleado.',
  })
  @RequirePermission(PERMISSIONS.HR.EMPLOYEES.VIEW)
  async getByEmployee(@Param('employeeId') employeeId: string) {
    return this.benefitsService.getBenefitsByEmployee(employeeId);
  }

  @Post()
  @ApiOperation({
    summary: 'Registrar nueva prestación o anticipo',
    description:
      'Crea un registro de prestación social, anticipo o liquidación.',
  })
  @RequirePermission(PERMISSIONS.HR.EMPLOYEES.MANAGE_SALARY)
  async create(@Body() createBenefitDto: CreateBenefitDto) {
    return this.benefitsService.createBenefit(createBenefitDto);
  }

  @Patch(':id')
  @ApiOperation({
    summary: 'Actualizar registro de prestación',
    description: 'Modifica el monto, estado de pago o notas de una prestación.',
  })
  @RequirePermission(PERMISSIONS.HR.EMPLOYEES.MANAGE_SALARY)
  async update(
    @Param('id') id: string,
    @Body() updateBenefitDto: UpdateBenefitDto,
  ) {
    return this.benefitsService.updateBenefit(id, updateBenefitDto);
  }

  @Delete(':id')
  @ApiOperation({
    summary: 'Eliminar registro de prestación',
    description: 'Elimina el registro de prestación especificado.',
  })
  @RequirePermission(PERMISSIONS.HR.EMPLOYEES.MANAGE_SALARY)
  async remove(@Param('id') id: string) {
    return this.benefitsService.deleteBenefit(id);
  }
}
