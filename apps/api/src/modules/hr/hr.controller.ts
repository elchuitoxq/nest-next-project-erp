import { Controller, Get, Post, Body, Param, UseGuards } from '@nestjs/common';
import { HrService } from './hr.service';
import { JwtAuthGuard } from '../../modules/auth/jwt-auth.guard';

@Controller('hr')
@UseGuards(JwtAuthGuard)
export class HrController {
  constructor(private readonly hrService: HrService) {}

  @Get('employees')
  getEmployees() {
    return this.hrService.findAllEmployees();
  }

  @Post('payroll')
  createPayroll(@Body() body: any) {
    return this.hrService.createPayrollRun(body);
  }

  @Get('payroll')
  getPayrolls() {
    return this.hrService.findAllRuns();
  }

  @Get('payroll/:id')
  getPayrollDetails(@Param('id') id: string) {
    return this.hrService.getRunDetails(id);
  }
}
