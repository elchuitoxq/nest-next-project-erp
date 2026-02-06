import { Module } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';
import { BCVScraperService } from './bcv-scraper.service';
import { CurrenciesModule } from '../settings/currencies/currencies.module';

import { CronController } from './cron.controller';

@Module({
  imports: [ScheduleModule.forRoot(), CurrenciesModule],
  providers: [BCVScraperService],
  controllers: [CronController],
})
export class CronModule {}
