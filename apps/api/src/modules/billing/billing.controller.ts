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
import { BranchInterceptor } from '../../common/interceptors/branch.interceptor';
import { BillingService } from './billing.service';
import { JwtAuthGuard } from '../../modules/auth/jwt-auth.guard';
import { CreateInvoiceDto } from './dto/create-invoice.dto';
import { FindInvoicesDto } from './dto/find-invoices.dto';
import { AuditInterceptor } from '../audit/audit.interceptor';
import { Audit } from '../audit/audit.decorator';

@Controller('billing')
@UseGuards(JwtAuthGuard)
@UseInterceptors(BranchInterceptor, AuditInterceptor)
export class BillingController {
  constructor(private readonly billingService: BillingService) {}

  @Post('invoices')
  @Audit('invoices', 'CREATE', 'Factura creada')
  createInvoice(@Body() createInvoiceDto: CreateInvoiceDto, @Req() req: any) {
    return this.billingService.createInvoice({
      ...createInvoiceDto,
      branchId: req.branchId,
      userId: req.user.userId,
    });
  }

  @Get('invoices/stats')
  getStats(@Req() req: any, @Query('type') type: string) {
    return this.billingService.getStats(req.branchId, type || 'SALE');
  }

  @Get('invoices/:id')
  findOne(@Param('id') id: string) {
    return this.billingService.findOne(id);
  }

  @Get('invoices/:id/fiscal-json')
  getFiscalJson(@Param('id') id: string) {
    return this.billingService.getFiscalJson(id);
  }

  @Post('invoices/:id') // Using POST as Patch for simplicity or strict PATCH
  @Audit('invoices', 'UPDATE', 'Factura actualizada')
  updateInvoice(@Param('id') id: string, @Body() body: any, @Req() req: any) {
    return this.billingService.updateInvoice(id, body, req.user.userId);
  }

  @Get('invoices')
  findAll(@Req() req: any, @Query() query: FindInvoicesDto) {
    return this.billingService.findAll(req.branchId, query);
  }

  @Post('invoices/:id/post')
  @Audit('invoices', 'UPDATE', 'Factura emitida')
  postInvoice(@Param('id') id: string, @Req() req: any) {
    return this.billingService.postInvoice(id, req.user.userId);
  }

  @Post('invoices/:id/void')
  @Audit('invoices', 'UPDATE', 'Factura anulada')
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
