import { Module } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';
import { BCVScraperService } from './bcv-scraper.service';
import { CurrenciesModule } from '../settings/currencies/currencies.module';

@Module({
  imports: [ScheduleModule.forRoot(), CurrenciesModule],
  providers: [BCVScraperService],
})
export class CronModule {}
