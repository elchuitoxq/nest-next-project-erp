import { Module } from '@nestjs/common';
import { JobPositionsService } from './services/job-positions.service';
import { EmployeesService } from './services/employees.service';
import { JobPositionsController } from './controllers/job-positions.controller';
import { EmployeesController } from './controllers/employees.controller';
import { PayrollService } from './services/payroll.service';
import { PayrollController } from './controllers/payroll.controller';
import { CurrenciesModule } from '../../modules/settings/currencies/currencies.module';
import { TreasuryModule } from '../treasury/treasury.module';
import { PayrollConceptsController } from './concepts/payroll-concepts.controller';
import { PayrollConceptsService } from './concepts/payroll-concepts.service';
import { PayrollIncidentsController } from './controllers/payroll-incidents.controller';
import { PayrollIncidentsService } from './services/payroll-incidents.service';
import { PayrollPdfService } from './services/payroll-pdf.service';
import { PayrollExportService } from './services/payroll-export.service';
import { DepartmentsController } from './controllers/departments.controller';
import { DepartmentsService } from './services/departments.service';
import { ContractsController } from './controllers/contracts.controller';
import { ContractsService } from './services/contracts.service';
import { BenefitsController } from './controllers/benefits.controller';
import { BenefitsService } from './services/benefits.service';
import { VacationsController } from './controllers/vacations.controller';
import { VacationsService } from './services/vacations.service';
import { ProfitSharingController } from './controllers/profit-sharing.controller';
import { ProfitSharingService } from './services/profit-sharing.service';
import { PayrollSettingsController } from './controllers/payroll-settings.controller';
import { PayrollSettingsService } from './services/payroll-settings.service';
import { TerminationsController } from './controllers/terminations.controller';
import { TerminationsService } from './services/terminations.service';

import { ComplianceReportsService } from './services/compliance-reports.service';
import { BankFileGeneratorService } from './services/bank-file-generator.service';

import { AccountingModule } from '../accounting/accounting.module';

@Module({
  imports: [CurrenciesModule, TreasuryModule, AccountingModule],
  controllers: [
    JobPositionsController,
    EmployeesController,
    PayrollController,
    PayrollConceptsController,
    PayrollIncidentsController,
    PayrollSettingsController,
    DepartmentsController,
    ContractsController,
    BenefitsController,
    VacationsController,
    ProfitSharingController,
    ProfitSharingController,
    PayrollSettingsController,
    TerminationsController,
  ],
  providers: [
    JobPositionsService,
    EmployeesService,
    PayrollService,
    PayrollConceptsService,
    PayrollIncidentsService,
    PayrollSettingsService,
    PayrollPdfService,
    PayrollExportService,
    DepartmentsService,
    ContractsService,
    BenefitsService,
    VacationsService,
    ProfitSharingService,
    ProfitSharingService,
    PayrollSettingsService,
    ComplianceReportsService,
    BankFileGeneratorService,
    TerminationsService,
  ],
  exports: [EmployeesService],
})
export class HrModule {}
