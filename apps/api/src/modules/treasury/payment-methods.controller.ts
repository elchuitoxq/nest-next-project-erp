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

import { PermissionsGuard } from '../../common/guards/permissions.guard';
import { RequirePermission } from '../../common/decorators/permissions.decorator';
import { PERMISSIONS } from '@repo/db';

@Controller('treasury/methods')
@UseGuards(JwtAuthGuard, PermissionsGuard)
@UseInterceptors(BranchInterceptor)
export class PaymentMethodsController {
  constructor(private readonly treasuryService: TreasuryService) {}

  @Get()
  @RequirePermission(PERMISSIONS.FINANCE.TREASURY.VIEW)
  async findAll(@Req() req: any) {
    return await this.treasuryService.findAllMethods(req.branchId);
  }

  @Post(':id/accounts')
  @RequirePermission(PERMISSIONS.FINANCE.TREASURY.EDIT_ACCOUNT)
  async updateAccounts(
    @Param('id') id: string,
    @Body('accountIds') accountIds: string[],
  ) {
    return await this.treasuryService.updateMethodAccounts(id, accountIds);
  }
}
