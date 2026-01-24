import { Module } from '@nestjs/common';
import { BillingService } from './billing.service';
import { BillingController } from './billing.controller';
import { InventoryModule } from '../inventory/inventory.module';
import { CurrenciesModule } from '../settings/currencies/currencies.module';

@Module({
  imports: [InventoryModule, CurrenciesModule],
  providers: [BillingService],
  controllers: [BillingController],
  exports: [BillingService],
})
export class BillingModule {}
