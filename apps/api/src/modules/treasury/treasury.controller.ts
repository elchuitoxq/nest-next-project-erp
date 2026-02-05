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

  @Post('methods')
  createMethod(@Body() body: any, @Req() req: any) {
    return this.treasuryService.createMethod({
      ...body,
      branchId: req.branchId,
    });
  }

  @Patch('methods/:id')
  updateMethod(@Param('id') id: string, @Body() body: any) {
    return this.treasuryService.updateMethod(id, body);
  }

  @Post('methods/:id/accounts')
  updateMethodAccounts(
    @Param('id') id: string,
    @Body('accountIds') accountIds: string[],
  ) {
    return this.treasuryService.updateMethodAccounts(id, accountIds);
  }

  @Get('payments')
  findAll(@Req() req: any, @Query('bankAccountId') bankAccountId?: string) {
    return this.treasuryService.findAllPayments(req.branchId, bankAccountId);
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

  @Get('available-credit-notes')
  getAvailableCreditNotes(
    @Query('partnerId') partnerId: string,
    @Query('currencyId') currencyId: string,
  ) {
    return this.treasuryService.getAvailableCreditNotes(partnerId, currencyId);
  }
}
