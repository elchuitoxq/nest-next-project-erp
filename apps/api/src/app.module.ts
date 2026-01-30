import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './modules/auth/auth.module';
import { JwtAuthGuard } from './modules/auth/guards/jwt-auth.guard';
import { RolesGuard } from './modules/auth/guards/roles.guard';
import { CurrenciesModule } from './modules/settings/currencies/currencies.module';
import { PartnersModule } from './modules/partners/partners.module';
import { ProductsModule } from './modules/products/products.module';
import { InventoryModule } from './modules/inventory/inventory.module';
import { BillingModule } from './modules/billing/billing.module';
import { TreasuryModule } from './modules/treasury/treasury.module';
import { LoansModule } from './modules/loans/loans.module';
import { HrModule } from './modules/hr/hr.module';
import { BiModule } from './modules/bi/bi.module';
import { RolesModule } from './modules/roles/roles.module';
import { UsersModule } from './modules/users/users.module';
import { BranchesModule } from './modules/branches/branches.module';
import { OrdersModule } from './modules/orders/orders.module';
import { CreditNotesModule } from './modules/credit-notes/credit-notes.module';
import { CronModule } from './modules/cron/cron.module';
import { AccountingModule } from './modules/accounting/accounting.module';
import { FiscalReportsModule } from './modules/reports/fiscal-reports.module';
import { TaxConceptsModule } from './modules/settings/tax-concepts/tax-concepts.module';
import { BanksModule } from './modules/settings/banks/banks.module';

import * as Joi from 'joi';
import { ConfigModule } from '@nestjs/config';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      validationSchema: Joi.object({
        DATABASE_URL: Joi.string().required(),
        PORT: Joi.number().default(4000),
        JWT_SECRET: Joi.string().required(),
      }),
    }),
    AuthModule,
    CurrenciesModule,
    TaxConceptsModule,
    BanksModule,
    PartnersModule,
    ProductsModule,
    InventoryModule,
    BillingModule,
    TreasuryModule,
    LoansModule,
    HrModule,
    BiModule,
    RolesModule,
    UsersModule,
    BranchesModule,
    OrdersModule,
    CreditNotesModule,
    CronModule,
    AccountingModule,
    FiscalReportsModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    {
      provide: 'APP_GUARD',
      useClass: JwtAuthGuard,
    },
    {
      provide: 'APP_GUARD',
      useClass: RolesGuard,
    },
  ],
})
export class AppModule {}
