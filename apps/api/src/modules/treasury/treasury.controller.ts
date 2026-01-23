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
} from '@nestjs/common';
import { TreasuryService } from './treasury.service';
import { JwtAuthGuard } from '../../modules/auth/jwt-auth.guard';
import { BranchInterceptor } from '../../common/interceptors/branch.interceptor';

@Controller('treasury')
@UseGuards(JwtAuthGuard)
@UseInterceptors(BranchInterceptor)
export class TreasuryController {
  constructor(private readonly treasuryService: TreasuryService) {}

  @Post('payments')
  createPayment(@Body() body: any, @Req() req: any) {
    const userId = req.user?.userId;
    // Inject branchId from interceptor
    return this.treasuryService.registerPayment({
      ...body,
      userId,
      branchId: req.branchId,
    });
  }

  @Get('methods')
  getMethods(@Req() req: any) {
    return this.treasuryService.findAllMethods(req.branchId);
  }

  @Get('payments')
  findAll(@Req() req: any) {
    return this.treasuryService.findAllPayments(req.branchId);
  }

  @Get('statements/:partnerId')
  getStatement(@Param('partnerId') partnerId: string, @Req() req: any) {
    return this.treasuryService.getAccountStatement(partnerId, req.branchId);
  }

  @Get('daily-close')
  getDailyClose(@Query('date') date: string, @Req() req: any) {
    const targetDate = date || new Date().toISOString();
    return this.treasuryService.getDailyClose(targetDate, req.branchId);
  }
}
