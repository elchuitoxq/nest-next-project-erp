import { Module } from '@nestjs/common';
import { FiscalReportsService } from './fiscal-reports.service';
import { FiscalReportsController } from './fiscal-reports.controller';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [AuthModule],
  providers: [FiscalReportsService],
  controllers: [FiscalReportsController],
  exports: [FiscalReportsService],
})
export class FiscalReportsModule {}

