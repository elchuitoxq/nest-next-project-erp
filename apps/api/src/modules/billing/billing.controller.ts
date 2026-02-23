import {
  Controller,
  Get,
  Post,
  Body,
  UseGuards,
  Param,
  Req,
  Query,
  UseInterceptors,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiHeader,
} from '@nestjs/swagger';
import { BranchInterceptor } from '../../common/interceptors/branch.interceptor';
import { BillingService } from './billing.service';
import { JwtAuthGuard } from '../../modules/auth/jwt-auth.guard';
import { CreateInvoiceDto } from './dto/create-invoice.dto';
import { FindInvoicesDto } from './dto/find-invoices.dto';
import { AuditInterceptor } from '../audit/audit.interceptor';
import { Audit } from '../audit/audit.decorator';

import { PermissionsGuard } from '../../common/guards/permissions.guard';
import { RequirePermission } from '../../common/decorators/permissions.decorator';
import { PERMISSIONS } from '@repo/db';

@ApiTags('Finanzas - Facturación')
@ApiBearerAuth()
@ApiHeader({
  name: 'x-branch-id',
  description: 'ID de la sucursal para filtrar los datos',
  required: false,
})
@Controller('billing')
@UseGuards(JwtAuthGuard, PermissionsGuard)
@UseInterceptors(BranchInterceptor, AuditInterceptor)
export class BillingController {
  constructor(private readonly billingService: BillingService) {}

  @Post('invoices')
  @ApiOperation({
    summary: 'Crear una nueva factura',
    description: 'Registra una factura en estado DRAFT asociada a un socio.',
  })
  @ApiResponse({ status: 201, description: 'Factura creada exitosamente' })
  @ApiResponse({ status: 400, description: 'Datos de entrada inválidos' })
  @Audit('invoices', 'CREATE', 'Factura creada')
  @RequirePermission(PERMISSIONS.FINANCE.INVOICES.CREATE)
  createInvoice(@Body() createInvoiceDto: CreateInvoiceDto, @Req() req: any) {
    return this.billingService.createInvoice({
      ...createInvoiceDto,
      branchId: req.branchId,
      userId: req.user.userId,
    });
  }

  @Get('invoices/stats')
  @ApiOperation({
    summary: 'Obtener estadísticas de facturación',
    description: 'Retorna totales de facturación agrupados por estado.',
  })
  @ApiResponse({ status: 200, description: 'Estadísticas obtenidas' })
  @RequirePermission(PERMISSIONS.FINANCE.INVOICES.VIEW)
  getStats(@Req() req: any, @Query('type') type: string) {
    const isAdmin = req.user.roles?.includes('admin');
    const hasBranchHeader = !!req.headers['x-branch-id'];
    const branchId = isAdmin && !hasBranchHeader ? null : req.branchId;

    return this.billingService.getStats(branchId, type || 'SALE');
  }

  @Get('invoices/:id')
  @ApiOperation({
    summary: 'Obtener detalle de una factura',
    description: 'Retorna la información completa de la factura por UUID.',
  })
  @ApiResponse({ status: 200, description: 'Factura encontrada' })
  @ApiResponse({ status: 404, description: 'Factura no encontrada' })
  @RequirePermission(PERMISSIONS.FINANCE.INVOICES.VIEW)
  findOne(@Param('id') id: string) {
    return this.billingService.findOne(id);
  }

  @Get('invoices/:id/fiscal-json')
  @RequirePermission(PERMISSIONS.FINANCE.INVOICES.VIEW)
  getFiscalJson(@Param('id') id: string) {
    return this.billingService.getFiscalJson(id);
  }

  @Post('invoices/:id') // Using POST as Patch for simplicity or strict PATCH
  @ApiOperation({
    summary: 'Actualizar factura',
    description: 'Permite modificar datos de una factura en estado DRAFT.',
  })
  @ApiResponse({ status: 200, description: 'Factura actualizada' })
  @ApiResponse({
    status: 400,
    description: 'No se puede editar una factura emitida',
  })
  @Audit('invoices', 'UPDATE', 'Factura actualizada')
  @RequirePermission(PERMISSIONS.FINANCE.INVOICES.CREATE)
  updateInvoice(@Param('id') id: string, @Body() body: any, @Req() req: any) {
    return this.billingService.updateInvoice(id, body, req.user.userId);
  }

  @Get('invoices')
  @ApiOperation({
    summary: 'Listar facturas',
    description:
      'Retorna una lista paginada de facturas con filtros opcionales.',
  })
  @ApiResponse({ status: 200, description: 'Lista obtenida correctamente' })
  @RequirePermission(PERMISSIONS.FINANCE.INVOICES.VIEW)
  findAll(@Req() req: any, @Query() query: FindInvoicesDto) {
    const isAdmin = req.user.roles?.includes('admin');
    const hasBranchHeader = !!req.headers['x-branch-id'];
    const branchId = isAdmin && !hasBranchHeader ? null : req.branchId;

    return this.billingService.findAll(branchId, query);
  }

  @Post('invoices/:id/post')
  @ApiOperation({
    summary: 'Emitir factura',
    description:
      'Cambia el estado de DRAFT a POSTED, generando los asientos contables y afectando balances.',
  })
  @ApiResponse({ status: 200, description: 'Factura emitida exitosamente' })
  @Audit('invoices', 'UPDATE', 'Factura emitida')
  @RequirePermission(PERMISSIONS.FINANCE.INVOICES.CREATE)
  postInvoice(@Param('id') id: string, @Req() req: any) {
    return this.billingService.postInvoice(id, req.user.userId);
  }

  @Post('invoices/:id/void')
  @ApiOperation({
    summary: 'Anular factura',
    description:
      'Anula una factura emitida (POSTED), reversando el impacto financiero.',
  })
  @ApiResponse({ status: 200, description: 'Factura anulada' })
  @Audit('invoices', 'UPDATE', 'Factura anulada')
  @RequirePermission(PERMISSIONS.FINANCE.INVOICES.VOID)
  voidInvoice(
    @Param('id') id: string,
    @Body() body: { returnStock?: boolean; warehouseId?: string },
    @Req() req: any,
  ) {
    return this.billingService.voidInvoice(id, req.user.userId, {
      returnStock: !!body.returnStock,
      warehouseId: body.warehouseId,
    });
  }
}
