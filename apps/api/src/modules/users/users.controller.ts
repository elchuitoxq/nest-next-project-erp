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
  ApiHeader,
} from '@nestjs/swagger';
import { UsersService } from './users.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PermissionsGuard } from '../../common/guards/permissions.guard';
import { RequirePermission } from '../../common/decorators/permissions.decorator';
import { PERMISSIONS } from '@repo/db';

@ApiTags('Configuración - Usuarios')
@ApiBearerAuth()
@ApiHeader({
  name: 'x-branch-id',
  description: 'ID de la sucursal activa',
  required: false,
})
@Controller('users')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Post()
  @ApiOperation({
    summary: 'Registrar nuevo usuario',
    description: 'Crea un usuario y le asigna roles y acceso a sucursales.',
  })
  @ApiResponse({ status: 201, description: 'Usuario creado exitosamente' })
  @RequirePermission(PERMISSIONS.SETTINGS.USERS.CREATE)
  create(@Body() createUserDto: CreateUserDto) {
    return this.usersService.create(createUserDto);
  }

  @Get()
  @ApiOperation({
    summary: 'Listar usuarios',
    description: 'Retorna la lista de todos los usuarios registrados.',
  })
  @ApiResponse({ status: 200, description: 'Lista obtenida' })
  @RequirePermission(PERMISSIONS.SETTINGS.USERS.VIEW)
  findAll() {
    return this.usersService.findAll();
  }

  @Get(':id')
  @ApiOperation({
    summary: 'Obtener detalle de usuario',
    description: 'Retorna la información de un usuario específico.',
  })
  @ApiResponse({ status: 200, description: 'Usuario encontrado' })
  @ApiResponse({ status: 404, description: 'Usuario no encontrado' })
  @RequirePermission(PERMISSIONS.SETTINGS.USERS.VIEW)
  findOne(@Param('id') id: string) {
    return this.usersService.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({
    summary: 'Actualizar usuario',
    description:
      'Modifica los datos, roles o sucursales de un usuario existente.',
  })
  @ApiResponse({ status: 200, description: 'Usuario actualizado' })
  @RequirePermission(PERMISSIONS.SETTINGS.USERS.EDIT)
  update(@Param('id') id: string, @Body() updateUserDto: UpdateUserDto) {
    return this.usersService.update(id, updateUserDto);
  }

  @Delete(':id')
  @ApiOperation({
    summary: 'Eliminar usuario',
    description: 'Elimina un usuario del sistema.',
  })
  @ApiResponse({ status: 200, description: 'Usuario eliminado' })
  @RequirePermission(PERMISSIONS.SETTINGS.USERS.DELETE)
  remove(@Param('id') id: string) {
    return this.usersService.remove(id);
  }
}
