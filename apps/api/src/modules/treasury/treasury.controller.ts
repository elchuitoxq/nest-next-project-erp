import {
  Controller,
  Get,
  Post,
  Body,
  UseGuards,
  Param,
  Query,
  Req,
  UseInterceptors,
  Patch,
} from '@nestjs/common';
import { TreasuryService } from './treasury.service';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiHeader,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../../modules/auth/jwt-auth.guard';
import { BranchInterceptor } from '../../common/interceptors/branch.interceptor';
import { AuditInterceptor } from '../audit/audit.interceptor';
import { Audit } from '../audit/audit.decorator';

import { PermissionsGuard } from '../../common/guards/permissions.guard';
import { RequirePermission } from '../../common/decorators/permissions.decorator';
import { PERMISSIONS } from '@repo/db';
import { CreatePaymentDto } from './dto/create-payment.dto';
import {
  CreatePaymentMethodDto,
  UpdatePaymentMethodDto,
} from './dto/create-payment-method.dto';

@ApiTags('Finanzas - Tesorería')
@ApiBearerAuth()
@ApiHeader({
  name: 'x-branch-id',
  description: 'ID de la sucursal para filtrar los datos',
  required: false,
})
@Controller('treasury')
@UseGuards(JwtAuthGuard, PermissionsGuard)
@UseInterceptors(BranchInterceptor, AuditInterceptor)
export class TreasuryController {
  constructor(private readonly treasuryService: TreasuryService) {}

  @Post('payments')
  @ApiOperation({
    summary: 'Registrar un nuevo pago',
    description:
      'Registra un ingreso o egreso de caja. Afecta el saldo de cuentas bancarias y permite distribuciones a múltiples facturas.',
  })
  @ApiResponse({ status: 201, description: 'Pago registrado exitosamente' })
  @ApiResponse({
    status: 400,
    description: 'Error de validación o saldo insuficiente',
  })
  @Audit('payments', 'CREATE', 'Pago registrado')
  @RequirePermission(PERMISSIONS.FINANCE.PAYMENTS.CREATE)
  createPayment(@Body() createPaymentDto: CreatePaymentDto, @Req() req: any) {
    const userId = req.user?.userId;
    // Inject branchId from interceptor
    return this.treasuryService.registerPayment({
      ...createPaymentDto,
      userId,
      branchId: req.branchId,
    });
  }

  @Post('payments/:id/void')
  @ApiOperation({
    summary: 'Anular un pago',
    description:
      'Revierte un pago existente, restaurando saldo de cuentas bancarias, re-abriendo facturas afectadas y eliminando comprobantes fiscales relacionados.',
  })
  @ApiResponse({ status: 200, description: 'Pago anulado exitosamente' })
  @ApiResponse({
    status: 400,
    description:
      'El pago ya fue anulado o no se puede revertir por notas de crédito usadas',
  })
  @Audit('payments', 'DELETE', 'Pago anulado')
  @RequirePermission(PERMISSIONS.FINANCE.PAYMENTS.VOID)
  voidPayment(@Param('id') id: string, @Req() req: any) {
    const userId = req.user?.userId;
    return this.treasuryService.voidPayment(id, req.branchId, userId);
  }

  @Get('methods')
  @ApiOperation({
    summary: 'Listar métodos de pago',
    description: 'Retorna los métodos de pago disponibles para la sucursal.',
  })
  @ApiResponse({ status: 200, description: 'Lista obtenida' })
  @RequirePermission(PERMISSIONS.FINANCE.TREASURY.VIEW)
  getMethods(@Req() req: any) {
    return this.treasuryService.findAllMethods(req.branchId);
  }

  @Post('methods')
  @ApiOperation({
    summary: 'Crear método de pago',
    description: 'Registra un nuevo método de pago (Efectivo, Banco, etc.).',
  })
  @ApiResponse({ status: 201, description: 'Método creado' })
  @RequirePermission(PERMISSIONS.FINANCE.TREASURY.EDIT_ACCOUNT)
  createMethod(
    @Body() createMethodDto: CreatePaymentMethodDto,
    @Req() req: any,
  ) {
    return this.treasuryService.createMethod({
      ...createMethodDto,
      branchId: req.branchId,
    });
  }

  @Patch('methods/:id')
  @ApiOperation({
    summary: 'Actualizar método de pago',
    description: 'Modifica la configuración de un método de pago existente.',
  })
  @ApiResponse({ status: 200, description: 'Método actualizado' })
  @RequirePermission(PERMISSIONS.FINANCE.TREASURY.EDIT_ACCOUNT)
  updateMethod(
    @Param('id') id: string,
    @Body() updateMethodDto: UpdatePaymentMethodDto,
  ) {
    return this.treasuryService.updateMethod(id, updateMethodDto);
  }

  @Post('methods/:id/accounts')
  @RequirePermission(PERMISSIONS.FINANCE.TREASURY.EDIT_ACCOUNT)
  updateMethodAccounts(
    @Param('id') id: string,
    @Body('accountIds') accountIds: string[],
  ) {
    return this.treasuryService.updateMethodAccounts(id, accountIds);
  }

  @Get('payments')
  @ApiOperation({
    summary: 'Listar pagos realizados',
    description: 'Retorna el histórico de pagos de la sucursal.',
  })
  @ApiResponse({ status: 200, description: 'Lista de pagos' })
  @RequirePermission(PERMISSIONS.FINANCE.PAYMENTS.VIEW)
  findAll(@Req() req: any, @Query('bankAccountId') bankAccountId?: string) {
    return this.treasuryService.findAllPayments(req.branchId, bankAccountId);
  }

  @Get('statements/:partnerId')
  @ApiOperation({
    summary: 'Obtener estado de cuenta',
    description:
      'Genera el historial de movimientos (debe/haber) para un cliente o proveedor.',
  })
  @ApiResponse({ status: 200, description: 'Estado de cuenta generado' })
  @RequirePermission([
    PERMISSIONS.FINANCE.TREASURY.VIEW,
    PERMISSIONS.OPERATIONS.PARTNERS.STATEMENT,
  ])
  getStatement(
    @Param('partnerId') partnerId: string,
    @Query('reportingCurrencyId') reportingCurrencyId: string,
    @Req() req: any,
  ) {
    return this.treasuryService.getAccountStatement(
      partnerId,
      req.branchId,
      reportingCurrencyId,
    );
  }

  @Get('daily-close')
  @ApiOperation({
    summary: 'Obtener cierre diario',
    description: 'Genera el resumen de movimientos para una fecha específica.',
  })
  @ApiResponse({ status: 200, description: 'Resumen obtenido' })
  @RequirePermission(PERMISSIONS.FINANCE.TREASURY.DAILY_CLOSE)
  getDailyClose(@Query('date') date: string, @Req() req: any) {
    const targetDate = date || new Date().toISOString();
    return this.treasuryService.getDailyClose(targetDate, req.branchId);
  }

  @Get('available-credit-notes')
  @RequirePermission(PERMISSIONS.FINANCE.TREASURY.VIEW)
  getAvailableCreditNotes(
    @Param('partnerId') partnerId: string,
    @Query('currencyId') currencyId: string,
  ) {
    return this.treasuryService.getAvailableCreditNotes(partnerId, currencyId);
  }
}
