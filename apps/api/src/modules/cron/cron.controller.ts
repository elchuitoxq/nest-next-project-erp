import { Controller, Get, UseGuards } from '@nestjs/common';
import { BCVScraperService } from './bcv-scraper.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../../common/decorators/access-control.decorators';

@Controller('cron')
@UseGuards(JwtAuthGuard, RolesGuard)
export class CronController {
  constructor(private readonly bcvService: BCVScraperService) {}

  @Get('trigger-bcv')
  @Roles('admin', 'manager')
  async triggerBCV() {
    const result = await this.bcvService.scrapeRates();
    return {
      message: 'BCV Scraper triggered manually',
      details: result,
    };
  }
}
