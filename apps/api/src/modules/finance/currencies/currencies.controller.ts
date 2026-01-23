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

@Controller('finance/currencies')
@UseGuards(JwtAuthGuard)
@UseInterceptors(BranchInterceptor)
export class CurrenciesController {
  constructor(private readonly currenciesService: CurrenciesService) {}

  @Get()
  findAll(@Req() req: any) {
    return this.currenciesService.findAll(req.branchId);
  }

  @Post()
  create(@Body() body: any, @Req() req: any) {
    return this.currenciesService.create({ ...body, branchId: req.branchId });
  }

  @Get('rates/latest')
  getLatestRates(@Req() req: any) {
    return this.currenciesService.getLatestRates(req.branchId);
  }

  @Post('rates')
  addRate(
    @Body() body: { currencyId: string; rate: string; source?: string },
    @Req() req: any,
  ) {
    return this.currenciesService.addRate(
      body.currencyId,
      body.rate,
      req.branchId,
      body.source,
    );
  }
}
