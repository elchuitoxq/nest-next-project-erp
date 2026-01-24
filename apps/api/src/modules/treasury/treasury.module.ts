import { Module } from '@nestjs/common';
import { TreasuryService } from './treasury.service';
import { TreasuryController } from './treasury.controller';
import { BankAccountsService } from './bank-accounts.service';
import { BankAccountsController } from './bank-accounts.controller';
import { CurrenciesModule } from '../settings/currencies/currencies.module';

import { TaxRetentionController } from './tax-retentions/tax-retention.controller';
import { PaymentMethodsController } from './payment-methods.controller';

@Module({
  imports: [CurrenciesModule],
  providers: [TreasuryService, BankAccountsService],
  controllers: [
    TreasuryController,
    BankAccountsController,
    TaxRetentionController,
    PaymentMethodsController,
  ],
})
export class TreasuryModule {}
