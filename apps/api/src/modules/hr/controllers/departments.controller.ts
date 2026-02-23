import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  UseGuards,
  Query,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiHeader,
} from '@nestjs/swagger';
import { DepartmentsService } from '../services/departments.service';
import {
  CreateDepartmentDto,
  UpdateDepartmentDto,
} from '../dto/department.dto';
import { JwtAuthGuard } from '../../../modules/auth/jwt-auth.guard';

import { PermissionsGuard } from '../../../common/guards/permissions.guard';
import { RequirePermission } from '../../../common/decorators/permissions.decorator';
import { PERMISSIONS } from '@repo/db';

@ApiTags('Recursos Humanos - Departamentos')
@ApiBearerAuth()
@ApiHeader({
  name: 'x-branch-id',
  description: 'ID de la sucursal',
  required: false,
})
@Controller('hr/departments')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class DepartmentsController {
  constructor(private readonly service: DepartmentsService) {}

  @Get()
  @ApiOperation({
    summary: 'Listar departamentos',
    description: 'Retorna todos los departamentos de la empresa o sucursal.',
  })
  @ApiResponse({ status: 200, description: 'Lista obtenida' })
  @RequirePermission(PERMISSIONS.HR.SETTINGS.VIEW)
  findAll(@Query('branchId') branchId?: string) {
    return this.service.findAll(branchId);
  }

  @Get(':id')
  @ApiOperation({
    summary: 'Obtener detalle de departamento',
    description: 'Retorna la información de un departamento específico.',
  })
  @ApiResponse({ status: 200, description: 'Departamento encontrado' })
  @ApiResponse({ status: 404, description: 'Departamento no encontrado' })
  @RequirePermission(PERMISSIONS.HR.SETTINGS.VIEW)
  findOne(@Param('id') id: string) {
    return this.service.findOne(id);
  }

  @Post()
  @ApiOperation({
    summary: 'Crear departamento',
    description:
      'Registra un nuevo departamento en la estructura organizacional.',
  })
  @ApiResponse({ status: 201, description: 'Departamento creado' })
  @RequirePermission(PERMISSIONS.HR.SETTINGS.MANAGE)
  create(@Body() dto: CreateDepartmentDto) {
    return this.service.create(dto);
  }

  @Put(':id')
  @ApiOperation({
    summary: 'Actualizar departamento',
    description: 'Modifica los datos de un departamento existente.',
  })
  @ApiResponse({ status: 200, description: 'Departamento actualizado' })
  @RequirePermission(PERMISSIONS.HR.SETTINGS.MANAGE)
  update(@Param('id') id: string, @Body() dto: UpdateDepartmentDto) {
    return this.service.update(id, dto);
  }

  @Delete(':id')
  @ApiOperation({
    summary: 'Eliminar departamento',
    description: 'Elimina un departamento del sistema.',
  })
  @ApiResponse({ status: 200, description: 'Departamento eliminado' })
  @RequirePermission(PERMISSIONS.HR.SETTINGS.MANAGE)
  delete(@Param('id') id: string) {
    return this.service.delete(id);
  }
}
