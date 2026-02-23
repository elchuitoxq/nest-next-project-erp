import {
  Controller,
  Get,
  Post,
  Body,
  UseGuards,
  UseInterceptors,
  Req,
} from '@nestjs/common';
import { CurrenciesService } from './currencies.service';
import { JwtAuthGuard } from '../../../modules/auth/jwt-auth.guard';
import { BranchInterceptor } from '../../../common/interceptors/branch.interceptor';
import { PermissionsGuard } from '../../../common/guards/permissions.guard';
import { RequirePermission } from '../../../common/decorators/permissions.decorator';
import { PERMISSIONS } from '@repo/db';

@Controller('settings/currencies')
@UseGuards(JwtAuthGuard, PermissionsGuard)
@UseInterceptors(BranchInterceptor)
export class CurrenciesController {
  constructor(private readonly currenciesService: CurrenciesService) {}

  @Get()
  findAll() {
    return this.currenciesService.findAll();
  }

  @Post()
  @RequirePermission(PERMISSIONS.SETTINGS.CURRENCIES.MANAGE)
  create(@Body() body: any) {
    // Remove branchId from creation
    const { branchId, ...data } = body;
    return this.currenciesService.create(data);
  }

  @Get('rates/latest')
  getLatestRates() {
    return this.currenciesService.getLatestRates();
  }

  @Post('rates')
  @RequirePermission(PERMISSIONS.SETTINGS.CURRENCIES.MANAGE)
  addRate(
    @Body() body: { currencyId: string; rate: string; source?: string },
    @Req() req: any,
  ) {
    return this.currenciesService.addRate(
      body.currencyId,
      body.rate,
      body.source,
    );
  }
}
