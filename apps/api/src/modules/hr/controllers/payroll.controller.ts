import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Patch,
  Res,
  UseGuards,
  Req,
  UseInterceptors,
  Header,
} from '@nestjs/common';
import { Response } from 'express';
import { PayrollService } from '../services/payroll.service';
import { PayrollPdfService } from '../services/payroll-pdf.service';
import { PayrollExportService } from '../services/payroll-export.service';
import { JwtAuthGuard } from '../../../modules/auth/jwt-auth.guard';
import { BranchInterceptor } from '../../../common/interceptors/branch.interceptor';
import { BankFileGeneratorService } from '../services/bank-file-generator.service';

import { ComplianceReportsService } from '../services/compliance-reports.service';

@Controller('hr/payroll')
@UseGuards(JwtAuthGuard)
@UseInterceptors(BranchInterceptor)
export class PayrollController {
  constructor(
    private readonly payrollService: PayrollService,
    private readonly pdfService: PayrollPdfService,
    private readonly exportService: PayrollExportService,
    private readonly bankFileService: BankFileGeneratorService,
    private readonly complianceService: ComplianceReportsService,
  ) {}

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

  @Post(':id/pay')
  processPayment(
    @Param('id') id: string,
    @Body() body: { bankAccountId: string },
  ) {
    return this.payrollService.processPayment(id, body);
  }

  @Patch(':id/status')
  updateStatus(@Param('id') id: string, @Body('status') status: string) {
    return this.payrollService.updateStatus(id, status);
  }

  // --- Payslip endpoints ---

  @Get(':runId/payslip/:itemId')
  getPayslipData(
    @Param('runId') runId: string,
    @Param('itemId') itemId: string,
  ) {
    return this.pdfService.getPayslipData(runId, itemId);
  }

  @Get(':runId/payslips')
  getBatchPayslipData(@Param('runId') runId: string) {
    return this.pdfService.getBatchPayslipData(runId);
  }

  // --- Export endpoints ---

  @Get(':runId/export/txt')
  @Header('Content-Type', 'text/plain; charset=utf-8')
  async exportBankTxt(@Param('runId') runId: string, @Res() res: Response) {
    const txt = await this.bankFileService.generateStandardTxt(runId);
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="nomina-${runId}.txt"`,
    );
    res.send(txt);
  }

  @Get(':runId/export/faov')
  @Header('Content-Type', 'text/plain; charset=utf-8')
  async exportFaovTxt(@Param('runId') runId: string, @Res() res: Response) {
    const txt = await this.complianceService.generateFaovTxt(runId);
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="faov-${runId}.csv"`,
    );
    res.send(txt);
  }

  @Get(':runId/export/excel')
  getExcelData(@Param('runId') runId: string) {
    return this.exportService.getExcelData(runId);
  }

  @Get(':runId/export/excel-download')
  @Header(
    'Content-Type',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  )
  async downloadExcel(@Param('runId') runId: string, @Res() res: Response) {
    const buffer = await this.exportService.generateExcelFile(runId);
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="nomina-${runId}.xlsx"`,
    );
    res.send(buffer);
  }
}
