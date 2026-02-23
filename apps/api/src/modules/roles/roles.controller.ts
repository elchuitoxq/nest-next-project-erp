import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Delete,
  UseGuards,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiHeader,
} from '@nestjs/swagger';
import { RolesService } from './roles.service';
import { CreateRoleDto } from './dto/create-role.dto';
import { AssignRoleDto } from './dto/assign-role.dto';
import { UpdateRolePermissionsDto } from './dto/update-role-permissions.dto';
import { JwtAuthGuard } from '../../modules/auth/jwt-auth.guard';
import { PermissionsGuard } from '../../common/guards/permissions.guard';
import { RequirePermission } from '../../common/decorators/permissions.decorator';
import { PERMISSIONS } from '@repo/db';

@ApiTags('Configuración - Roles y Permisos')
@ApiBearerAuth()
@ApiHeader({
  name: 'x-branch-id',
  description: 'ID de la sucursal activa',
  required: false,
})
@Controller('roles')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class RolesController {
  constructor(private readonly rolesService: RolesService) {}

  @Post()
  @ApiOperation({
    summary: 'Crear nuevo rol',
    description:
      'Registra un nuevo rol en el sistema (ej: Vendedor, Administrador).',
  })
  @ApiResponse({ status: 201, description: 'Rol creado' })
  @RequirePermission(PERMISSIONS.SETTINGS.ROLES.MANAGE)
  create(@Body() createRoleDto: CreateRoleDto) {
    return this.rolesService.create(createRoleDto);
  }

  @Get()
  @ApiOperation({
    summary: 'Listar roles',
    description: 'Retorna la lista de todos los roles configurados.',
  })
  @ApiResponse({ status: 200, description: 'Lista obtenida' })
  @RequirePermission(PERMISSIONS.SETTINGS.ROLES.VIEW)
  findAll() {
    return this.rolesService.findAll();
  }

  @Get('permissions')
  @ApiOperation({
    summary: 'Listar todos los permisos disponibles',
    description:
      'Retorna el catálogo completo de permisos que pueden asignarse a los roles.',
  })
  @ApiResponse({ status: 200, description: 'Catálogo de permisos obtenido' })
  @RequirePermission(PERMISSIONS.SETTINGS.ROLES.VIEW)
  getAllPermissions() {
    return this.rolesService.getAllPermissions();
  }

  @Post(':id/permissions')
  @ApiOperation({
    summary: 'Actualizar permisos de un rol',
    description: 'Sincroniza los permisos asignados a un rol específico.',
  })
  @ApiResponse({ status: 200, description: 'Permisos actualizados' })
  @RequirePermission(PERMISSIONS.SETTINGS.ROLES.MANAGE)
  updatePermissions(
    @Param('id') id: string,
    @Body() body: UpdateRolePermissionsDto,
  ) {
    return this.rolesService.updatePermissions(id, body.permissionIds);
  }

  @Post('assign')
  @ApiOperation({
    summary: 'Asignar rol a usuario',
    description: 'Otorga un rol específico a un usuario del sistema.',
  })
  @ApiResponse({ status: 200, description: 'Rol asignado' })
  @RequirePermission(PERMISSIONS.SETTINGS.ROLES.MANAGE)
  assignRole(@Body() assignRoleDto: AssignRoleDto) {
    return this.rolesService.assignRole(assignRoleDto);
  }

  @Delete(':id')
  @ApiOperation({
    summary: 'Eliminar rol',
    description: 'Elimina un rol del sistema si no tiene usuarios asociados.',
  })
  @ApiResponse({ status: 200, description: 'Rol eliminado' })
  @RequirePermission(PERMISSIONS.SETTINGS.ROLES.MANAGE)
  remove(@Param('id') id: string) {
    return this.rolesService.remove(id);
  }
}
