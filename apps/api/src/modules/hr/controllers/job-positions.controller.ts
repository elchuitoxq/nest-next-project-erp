import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  UseGuards,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiHeader,
} from '@nestjs/swagger';
import { JobPositionsService } from '../services/job-positions.service';
import {
  CreateJobPositionDto,
  UpdateJobPositionDto,
} from '../dto/job-position.dto';
import { JwtAuthGuard } from '../../../modules/auth/jwt-auth.guard';

import { PermissionsGuard } from '../../../common/guards/permissions.guard';
import { RequirePermission } from '../../../common/decorators/permissions.decorator';
import { PERMISSIONS } from '@repo/db';

@ApiTags('Recursos Humanos - Cargos')
@ApiBearerAuth()
@ApiHeader({
  name: 'x-branch-id',
  description: 'ID de la sucursal',
  required: false,
})
@Controller('hr/positions')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class JobPositionsController {
  constructor(private readonly positionsService: JobPositionsService) {}

  @Get()
  @ApiOperation({
    summary: 'Listar cargos',
    description: 'Retorna todos los cargos configurados en la empresa.',
  })
  @ApiResponse({ status: 200, description: 'Lista obtenida' })
  @RequirePermission(PERMISSIONS.HR.SETTINGS.VIEW)
  findAll() {
    return this.positionsService.findAll();
  }

  @Post()
  @ApiOperation({
    summary: 'Crear nuevo cargo',
    description: 'Registra un cargo en el sistema con su rango salarial.',
  })
  @ApiResponse({ status: 201, description: 'Cargo creado' })
  @RequirePermission(PERMISSIONS.HR.SETTINGS.MANAGE)
  create(@Body() dto: CreateJobPositionDto) {
    return this.positionsService.create(dto);
  }

  @Put(':id')
  @ApiOperation({
    summary: 'Actualizar cargo',
    description: 'Modifica los datos de un cargo existente.',
  })
  @ApiResponse({ status: 200, description: 'Cargo actualizado' })
  @RequirePermission(PERMISSIONS.HR.SETTINGS.MANAGE)
  update(@Param('id') id: string, @Body() dto: UpdateJobPositionDto) {
    return this.positionsService.update(id, dto);
  }

  @Delete(':id')
  @ApiOperation({
    summary: 'Eliminar cargo',
    description: 'Elimina un cargo del sistema.',
  })
  @ApiResponse({ status: 200, description: 'Cargo eliminado' })
  @RequirePermission(PERMISSIONS.HR.SETTINGS.MANAGE)
  delete(@Param('id') id: string) {
    return this.positionsService.delete(id);
  }
}
