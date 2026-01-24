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

@Controller('settings/currencies')
@UseGuards(JwtAuthGuard)
@UseInterceptors(BranchInterceptor)
export class CurrenciesController {
  constructor(private readonly currenciesService: CurrenciesService) {}

  @Get()
  findAll() {
    return this.currenciesService.findAll();
  }

  @Post()
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
