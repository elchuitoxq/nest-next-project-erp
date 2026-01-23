import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Delete,
  UseGuards,
} from '@nestjs/common';
import { RolesService } from './roles.service';
import { CreateRoleDto } from './dto/create-role.dto';
import { AssignRoleDto } from './dto/assign-role.dto';
// Assumes AuthGuard is available globally or imported. For now minimal setup.

@Controller('roles')
export class RolesController {
  constructor(private readonly rolesService: RolesService) {}

  @Post()
  create(@Body() createRoleDto: CreateRoleDto) {
    return this.rolesService.create(createRoleDto);
  }

  @Get()
  findAll() {
    return this.rolesService.findAll();
  }

  @Post('assign')
  assignRole(@Body() assignRoleDto: AssignRoleDto) {
    return this.rolesService.assignRole(assignRoleDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.rolesService.remove(id);
  }
}
