import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Patch,
  UseGuards,
  Req,
  UseInterceptors,
} from '@nestjs/common';
import { PayrollService } from '../services/payroll.service';
import { JwtAuthGuard } from '../../../modules/auth/jwt-auth.guard';
import { BranchInterceptor } from '../../../common/interceptors/branch.interceptor';

@Controller('hr/payroll')
@UseGuards(JwtAuthGuard)
@UseInterceptors(BranchInterceptor)
export class PayrollController {
  constructor(private readonly payrollService: PayrollService) {}

  @Get()
  findAll(@Req() req: any) {
    return this.payrollService.findAll(req.branchId);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.payrollService.findOne(id);
  }

  @Post('generate')
  generate(@Body() body: any, @Req() req: any) {
    return this.payrollService.generate({
      ...body,
      branchId: req.branchId,
    });
  }

  @Patch(':id/status')
  updateStatus(@Param('id') id: string, @Body('status') status: string) {
    return this.payrollService.updateStatus(id, status);
  }
}
