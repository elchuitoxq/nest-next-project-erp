import { Module } from '@nestjs/common';
import { FiscalReportsService } from './fiscal-reports.service';
import { FiscalReportsController } from './fiscal-reports.controller';
import { AuthModule } from '../auth/auth.module';
import { AccountingModule } from '../accounting/accounting.module';

@Module({
  imports: [AuthModule, AccountingModule],
  providers: [FiscalReportsService],
  controllers: [FiscalReportsController],
  exports: [FiscalReportsService],
})
export class FiscalReportsModule {}
