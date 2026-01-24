import { Controller, Get, UseGuards } from '@nestjs/common';
import { PayrollService } from '../services/payroll.service';
import { JwtAuthGuard } from '../../../modules/auth/jwt-auth.guard';

@Controller('hr/payroll')
@UseGuards(JwtAuthGuard)
export class PayrollController {
  constructor(private readonly payrollService: PayrollService) {}

  @Get('calculate')
  calculate() {
    return this.payrollService.calculatePayroll();
  }
}
