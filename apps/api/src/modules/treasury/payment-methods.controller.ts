import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  UseGuards,
  UseInterceptors,
  Req,
} from '@nestjs/common';
import { TreasuryService } from './treasury.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { BranchInterceptor } from '../../common/interceptors/branch.interceptor';

@Controller('treasury/methods')
@UseGuards(JwtAuthGuard)
@UseInterceptors(BranchInterceptor)
export class PaymentMethodsController {
  constructor(private readonly treasuryService: TreasuryService) {}

  @Get()
  async findAll(@Req() req: any) {
    return await this.treasuryService.findAllMethods(req.branchId);
  }

  @Post(':id/accounts')
  async updateAccounts(
    @Param('id') id: string,
    @Body('accountIds') accountIds: string[],
  ) {
    return await this.treasuryService.updateMethodAccounts(id, accountIds);
  }
}
