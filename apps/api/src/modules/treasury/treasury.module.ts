import { Module } from '@nestjs/common';
import { TreasuryService } from './treasury.service';
import { TreasuryController } from './treasury.controller';
import { BankAccountsService } from './bank-accounts.service';
import { BankAccountsController } from './bank-accounts.controller';
import { CurrenciesModule } from '../settings/currencies/currencies.module';
import { RetentionsService } from '../accounting/retentions.service';
import { DocumentsModule } from '../documents/documents.module';
import { AccountingModule } from '../accounting/accounting.module';
import { ConfigModule } from '@nestjs/config'; // Assuming ConfigModule needs to be imported

import { TaxRetentionController } from './tax-retentions/tax-retention.controller';
import { PaymentMethodsController } from './payment-methods.controller';

import { AuditModule } from '../audit/audit.module';

@Module({
  imports: [
    ConfigModule,
    DocumentsModule,
    AccountingModule,
    CurrenciesModule,
    AuditModule,
  ],
  providers: [TreasuryService, BankAccountsService],
  controllers: [
    TreasuryController,
    BankAccountsController,
    TaxRetentionController,
    PaymentMethodsController,
  ],
})
export class TreasuryModule {}
