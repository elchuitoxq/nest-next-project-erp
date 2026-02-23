import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { BranchesService } from './branches.service';
import { CreateBranchDto } from './dto/create-branch.dto';
import { UpdateBranchDto } from './dto/update-branch.dto';

import { JwtAuthGuard } from '../../modules/auth/jwt-auth.guard';
import { PermissionsGuard } from '../../common/guards/permissions.guard';
import { RequirePermission } from '../../common/decorators/permissions.decorator';
import { PERMISSIONS } from '@repo/db';

@ApiTags('Configuración - Sucursales')
@ApiBearerAuth()
@Controller('branches')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class BranchesController {
  constructor(private readonly branchesService: BranchesService) {}

  @Post()
  @ApiOperation({
    summary: 'Crear nueva sucursal',
    description: 'Registra una nueva sede o sucursal operativa en el sistema.',
  })
  @ApiResponse({ status: 201, description: 'Sucursal creada' })
  @RequirePermission(PERMISSIONS.SETTINGS.BRANCHES.MANAGE)
  create(@Body() createBranchDto: CreateBranchDto) {
    return this.branchesService.create(createBranchDto);
  }

  @Get()
  @ApiOperation({
    summary: 'Listar sucursales',
    description:
      'Retorna todas las sucursales configuradas, permitiendo ver las sedes disponibles.',
  })
  @ApiResponse({ status: 200, description: 'Lista obtenida' })
  @RequirePermission([
    PERMISSIONS.SETTINGS.BRANCHES.VIEW,
    PERMISSIONS.INVENTORY.WAREHOUSES.VIEW,
  ])
  findAll() {
    return this.branchesService.findAll();
  }

  @Get(':id')
  @ApiOperation({
    summary: 'Obtener detalle de sucursal',
    description: 'Retorna la información detallada de una sucursal específica.',
  })
  @ApiResponse({ status: 200, description: 'Sucursal encontrada' })
  @ApiResponse({ status: 404, description: 'Sucursal no encontrada' })
  @RequirePermission(PERMISSIONS.SETTINGS.BRANCHES.VIEW)
  findOne(@Param('id') id: string) {
    return this.branchesService.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({
    summary: 'Actualizar sucursal',
    description:
      'Modifica los datos de contacto o estado de una sucursal existente.',
  })
  @ApiResponse({ status: 200, description: 'Sucursal actualizada' })
  @RequirePermission(PERMISSIONS.SETTINGS.BRANCHES.MANAGE)
  update(@Param('id') id: string, @Body() updateBranchDto: UpdateBranchDto) {
    return this.branchesService.update(id, updateBranchDto);
  }

  @Delete(':id')
  @ApiOperation({
    summary: 'Eliminar sucursal',
    description: 'Elimina una sucursal del sistema.',
  })
  @ApiResponse({ status: 200, description: 'Sucursal eliminada' })
  @RequirePermission(PERMISSIONS.SETTINGS.BRANCHES.MANAGE)
  remove(@Param('id') id: string) {
    return this.branchesService.remove(id);
  }
}
