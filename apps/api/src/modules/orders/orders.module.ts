import { Module } from '@nestjs/common';
import { OrdersService } from './orders.service';
import { OrdersController } from './orders.controller';

import { InventoryModule } from '../inventory/inventory.module';
import { BillingModule } from '../billing/billing.module';
import { CurrenciesModule } from '../finance/currencies/currencies.module';

@Module({
  imports: [InventoryModule, BillingModule, CurrenciesModule],
  controllers: [OrdersController],
  providers: [OrdersService],
})
export class OrdersModule {}
