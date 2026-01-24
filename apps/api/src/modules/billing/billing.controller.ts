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

@Controller('billing')
@UseGuards(JwtAuthGuard)
@UseInterceptors(BranchInterceptor)
export class BillingController {
  constructor(private readonly billingService: BillingService) {}

  @Post('invoices')
  createInvoice(@Body() createInvoiceDto: CreateInvoiceDto, @Req() req: any) {
    return this.billingService.createInvoice({
      ...createInvoiceDto,
      branchId: req.branchId,
      userId: req.user.userId,
    });
  }

  @Post('invoices/:id') // Using POST as Patch for simplicity or strict PATCH
  updateInvoice(@Param('id') id: string, @Body() body: any, @Req() req: any) {
    return this.billingService.updateInvoice(id, body, req.user.userId);
  }

  @Get('invoices')
  findAll(@Req() req: any, @Query('type') type?: string) {
    return this.billingService.findAll(req.branchId, type);
  }

  @Get('fiscal-book')
  getFiscalBook(
    @Query('month') month: string,
    @Query('year') year: string,
    @Query('type') type: string,
    @Req() req: any,
  ) {
    return this.billingService.getFiscalBook(
      Number(month || new Date().getMonth() + 1),
      Number(year || new Date().getFullYear()),
      req.branchId,
      type,
    );
  }

  @Post('invoices/:id/post')
  postInvoice(@Param('id') id: string, @Req() req: any) {
    return this.billingService.postInvoice(id, req.user.userId);
  }

  @Post('invoices/:id/void')
  voidInvoice(
    @Param('id') id: string,
    @Body() body: { returnStock: boolean; warehouseId?: string },
    @Req() req: any,
  ) {
    return this.billingService.voidInvoice(id, req.user.userId, body);
  }
}
