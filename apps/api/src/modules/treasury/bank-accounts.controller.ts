import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Put,
  Patch,
  UseGuards,
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
import { BankAccountsService } from './bank-accounts.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { BranchInterceptor } from '../../common/interceptors/branch.interceptor';
import { CreateBankAccountDto } from './dto/create-bank-account.dto';
import { UpdateBankAccountDto } from './dto/update-bank-account.dto';

import { PERMISSIONS } from '@repo/db';
import { PermissionsGuard } from '../../common/guards/permissions.guard';
import { RequirePermission } from '../../common/decorators/permissions.decorator';

@ApiTags('Finanzas - Cuentas Bancarias')
@ApiBearerAuth()
@ApiHeader({
  name: 'x-branch-id',
  description: 'ID de la sucursal',
  required: false,
})
@Controller('treasury/bank-accounts')
@UseGuards(JwtAuthGuard, PermissionsGuard)
@UseInterceptors(BranchInterceptor)
export class BankAccountsController {
  constructor(private readonly service: BankAccountsService) {}

  @Get()
  @ApiOperation({
    summary: 'Listar cuentas bancarias',
    description: 'Retorna todas las cuentas bancarias de la sucursal.',
  })
  @ApiResponse({ status: 200, description: 'Lista obtenida' })
  @RequirePermission(PERMISSIONS.FINANCE.TREASURY.VIEW)
  findAll(@Req() req: any) {
    return this.service.findAll(req.branchId);
  }

  @Get(':id')
  @ApiOperation({
    summary: 'Obtener detalle de cuenta',
    description: 'Retorna la información de una cuenta específica.',
  })
  @ApiResponse({ status: 200, description: 'Cuenta encontrada' })
  @ApiResponse({ status: 404, description: 'Cuenta no encontrada' })
  @RequirePermission(PERMISSIONS.FINANCE.TREASURY.VIEW)
  findOne(@Param('id') id: string, @Req() req: any) {
    return this.service.findOne(id, req.branchId);
  }

  @Post()
  @ApiOperation({
    summary: 'Crear cuenta bancaria',
    description: 'Registra una nueva cuenta bancaria en la sucursal.',
  })
  @ApiResponse({ status: 201, description: 'Cuenta creada' })
  @RequirePermission(PERMISSIONS.FINANCE.TREASURY.CREATE_ACCOUNT)
  create(@Body() data: CreateBankAccountDto, @Req() req: any) {
    return this.service.create({ ...data, branchId: req.branchId });
  }

  @Put(':id')
  @ApiOperation({
    summary: 'Actualizar cuenta bancaria',
    description: 'Modifica los datos de una cuenta existente.',
  })
  @ApiResponse({ status: 200, description: 'Cuenta actualizada' })
  @RequirePermission(PERMISSIONS.FINANCE.TREASURY.EDIT_ACCOUNT)
  update(
    @Param('id') id: string,
    @Body() data: UpdateBankAccountDto,
    @Req() req: any,
  ) {
    return this.service.update(id, data, req.branchId);
  }

  @Patch(':id/toggle')
  @ApiOperation({
    summary: 'Activar/Desactivar cuenta',
    description: 'Cambia el estado de activación de la cuenta.',
  })
  @ApiResponse({ status: 200, description: 'Estado cambiado' })
  @RequirePermission(PERMISSIONS.FINANCE.TREASURY.EDIT_ACCOUNT)
  toggleActive(@Param('id') id: string, @Req() req: any) {
    return this.service.toggleActive(id, req.branchId);
  }
}
