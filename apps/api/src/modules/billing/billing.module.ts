import { Module } from '@nestjs/common';
import { BillingService } from './billing.service';
import { BillingController } from './billing.controller';
import { InventoryModule } from '../inventory/inventory.module';
import { CurrenciesModule } from '../settings/currencies/currencies.module';
import { AccountingModule } from '../accounting/accounting.module';
import { AuditModule } from '../audit/audit.module';
import { DocumentsModule } from '../documents/documents.module';

@Module({
  imports: [
    InventoryModule,
    CurrenciesModule,
    AccountingModule,
    AuditModule,
    DocumentsModule,
  ],
  providers: [BillingService],
  controllers: [BillingController],
  exports: [BillingService],
})
export class BillingModule {}
