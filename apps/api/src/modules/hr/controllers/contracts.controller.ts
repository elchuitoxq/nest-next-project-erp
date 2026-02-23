import {
  Controller,
  Get,
  Post,
  Put,
  Body,
  Param,
  UseGuards,
  Patch,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiHeader,
} from '@nestjs/swagger';
import { ContractsService } from '../services/contracts.service';
import { CreateContractDto, UpdateContractDto } from '../dto/contract.dto';
import { JwtAuthGuard } from '../../../modules/auth/jwt-auth.guard';

import { PermissionsGuard } from '../../../common/guards/permissions.guard';
import { RequirePermission } from '../../../common/decorators/permissions.decorator';
import { PERMISSIONS } from '@repo/db';

@ApiTags('Recursos Humanos - Contratos')
@ApiBearerAuth()
@ApiHeader({
  name: 'x-branch-id',
  description: 'ID de la sucursal',
  required: false,
})
@Controller('hr/contracts')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class ContractsController {
  constructor(private readonly service: ContractsService) {}

  @Get('employee/:employeeId')
  @ApiOperation({
    summary: 'Listar contratos de un empleado',
    description: 'Retorna el histórico de contratos de un empleado específico.',
  })
  @ApiResponse({ status: 200, description: 'Lista obtenida' })
  @RequirePermission(PERMISSIONS.HR.EMPLOYEES.VIEW)
  findByEmployee(@Param('employeeId') employeeId: string) {
    return this.service.findByEmployee(employeeId);
  }

  @Post()
  @ApiOperation({
    summary: 'Registrar nuevo contrato',
    description: 'Crea una nueva relación contractual para un empleado.',
  })
  @ApiResponse({ status: 201, description: 'Contrato creado' })
  @RequirePermission(PERMISSIONS.HR.EMPLOYEES.EDIT)
  create(@Body() dto: CreateContractDto) {
    return this.service.create(dto);
  }

  @Put(':id')
  @ApiOperation({
    summary: 'Actualizar contrato',
    description: 'Modifica los términos de un contrato existente.',
  })
  @ApiResponse({ status: 200, description: 'Contrato actualizado' })
  @RequirePermission(PERMISSIONS.HR.EMPLOYEES.EDIT)
  update(@Param('id') id: string, @Body() dto: UpdateContractDto) {
    return this.service.update(id, dto);
  }

  @Patch(':id/terminate')
  @ApiOperation({
    summary: 'Finalizar contrato',
    description: 'Marca un contrato como finalizado en la fecha indicada.',
  })
  @ApiResponse({ status: 200, description: 'Contrato finalizado' })
  @RequirePermission(PERMISSIONS.HR.EMPLOYEES.EDIT)
  terminate(@Param('id') id: string, @Body('endDate') endDate: string) {
    return this.service.terminate(id, endDate);
  }
}
