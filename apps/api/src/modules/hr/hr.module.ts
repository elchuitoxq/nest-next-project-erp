import { Module } from '@nestjs/common';
import { JobPositionsService } from './services/job-positions.service';
import { EmployeesService } from './services/employees.service';
import { JobPositionsController } from './controllers/job-positions.controller';
import { EmployeesController } from './controllers/employees.controller';
import { PayrollService } from './services/payroll.service';
import { PayrollController } from './controllers/payroll.controller';
import { CurrenciesModule } from '../../modules/settings/currencies/currencies.module';
import { TreasuryModule } from '../treasury/treasury.module';

@Module({
  imports: [CurrenciesModule, TreasuryModule],
  controllers: [
    JobPositionsController, 
    EmployeesController, 
    PayrollController
  ],
  providers: [
    JobPositionsService, 
    EmployeesService, 
    PayrollService
  ],
  exports: [EmployeesService]
})
export class HrModule {}
