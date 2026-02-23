import {
  Controller,
  Get,
  Post,
  Put,
  Body,
  Param,
  UseGuards,
  Query,
  UseInterceptors,
  Req,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiHeader,
} from '@nestjs/swagger';
import { EmployeesService } from '../services/employees.service';
import { CreateEmployeeDto, UpdateEmployeeDto } from '../dto/employee.dto';
import { JwtAuthGuard } from '../../../modules/auth/jwt-auth.guard';

import { PermissionsGuard } from '../../../common/guards/permissions.guard';
import { RequirePermission } from '../../../common/decorators/permissions.decorator';
import { PERMISSIONS } from '@repo/db';
import { BranchInterceptor } from '../../../common/interceptors/branch.interceptor';
import { AuditInterceptor } from '../../audit/audit.interceptor';
import { Audit } from '../../audit/audit.decorator';

@ApiTags('Recursos Humanos - Empleados')
@ApiBearerAuth()
@ApiHeader({
  name: 'x-branch-id',
  description: 'ID de la sucursal',
  required: false,
})
@Controller('hr/employees')
@UseGuards(JwtAuthGuard, PermissionsGuard)
@UseInterceptors(BranchInterceptor, AuditInterceptor)
export class EmployeesController {
  constructor(private readonly employeesService: EmployeesService) {}

  @Get()
  @ApiOperation({
    summary: 'Listar empleados',
    description: 'Retorna la lista de empleados de la sucursal.',
  })
  @ApiResponse({ status: 200, description: 'Lista obtenida' })
  @RequirePermission(PERMISSIONS.HR.EMPLOYEES.VIEW)
  findAll(@Req() req: any, @Query('status') status?: string) {
    return this.employeesService.findAll(undefined, status);
  }

  @Get(':id')
  @ApiOperation({
    summary: 'Obtener detalle de empleado',
    description: 'Retorna la ficha completa de un empleado por ID.',
  })
  @ApiResponse({ status: 200, description: 'Empleado encontrado' })
  @ApiResponse({ status: 404, description: 'Empleado no encontrado' })
  @RequirePermission(PERMISSIONS.HR.EMPLOYEES.VIEW)
  findOne(@Param('id') id: string) {
    return this.employeesService.findOne(id);
  }

  @Post()
  @ApiOperation({
    summary: 'Registrar nuevo empleado',
    description: 'Crea un nuevo registro de empleado en el sistema.',
  })
  @ApiResponse({ status: 201, description: 'Empleado creado' })
  @ApiResponse({ status: 400, description: 'Datos inválidos' })
  @Audit('employees', 'CREATE', 'Empleado creado')
  @RequirePermission(PERMISSIONS.HR.EMPLOYEES.CREATE)
  create(@Body() createEmployeeDto: CreateEmployeeDto, @Req() req: any) {
    return this.employeesService.create(createEmployeeDto);
  }

  @Put(':id')
  @RequirePermission(PERMISSIONS.HR.EMPLOYEES.EDIT)
  update(@Param('id') id: string, @Body() dto: UpdateEmployeeDto) {
    return this.employeesService.update(id, dto);
  }
}
