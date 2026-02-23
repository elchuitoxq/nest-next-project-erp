import { Controller, Get, UseGuards } from '@nestjs/common';
import { BCVScraperService } from './bcv-scraper.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PermissionsGuard } from '../../common/guards/permissions.guard';
import { RequirePermission } from '../../common/decorators/permissions.decorator';
import { PERMISSIONS } from '@repo/db';

@Controller('cron')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class CronController {
  constructor(private readonly bcvService: BCVScraperService) {}

  @Get('trigger-bcv')
  @RequirePermission(PERMISSIONS.SETTINGS.VIEW)
  async triggerBCV() {
    const result = await this.bcvService.scrapeRates();
    return {
      message: 'BCV Scraper triggered manually',
      details: result,
    };
  }
}
