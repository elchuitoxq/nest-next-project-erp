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
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiHeader,
} from '@nestjs/swagger';
import { Response } from 'express';
import { PayrollService } from '../services/payroll.service';
import { PayrollPdfService } from '../services/payroll-pdf.service';
import { PayrollExportService } from '../services/payroll-export.service';
import { JwtAuthGuard } from '../../../modules/auth/jwt-auth.guard';
import { BranchInterceptor } from '../../../common/interceptors/branch.interceptor';
import { BankFileGeneratorService } from '../services/bank-file-generator.service';

import { ComplianceReportsService } from '../services/compliance-reports.service';

import { PermissionsGuard } from '../../../common/guards/permissions.guard';
import { RequirePermission } from '../../../common/decorators/permissions.decorator';
import { PERMISSIONS } from '@repo/db';

@ApiTags('Recursos Humanos - Nómina')
@ApiBearerAuth()
@ApiHeader({
  name: 'x-branch-id',
  description: 'ID de la sucursal',
  required: false,
})
@Controller('hr/payroll')
@UseGuards(JwtAuthGuard, PermissionsGuard)
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
  @ApiOperation({
    summary: 'Listar corridas de nómina',
    description: 'Retorna el historial de procesos de nómina ejecutados.',
  })
  @ApiResponse({ status: 200, description: 'Lista obtenida' })
  @RequirePermission(PERMISSIONS.HR.PAYROLL.VIEW)
  findAll(@Req() req: any) {
    const isAdmin = req.user.roles?.includes('admin');
    const hasBranchHeader = !!req.headers['x-branch-id'];
    const branchId = isAdmin && !hasBranchHeader ? null : req.branchId;

    return this.payrollService.findAll(branchId);
  }

  @Get(':id')
  @ApiOperation({
    summary: 'Obtener detalle de corrida de nómina',
    description:
      'Retorna los cálculos detallados por empleado para una corrida específica.',
  })
  @ApiResponse({ status: 200, description: 'Detalle obtenido' })
  findOne(@Param('id') id: string) {
    return this.payrollService.findOne(id);
  }

  @Post('generate')
  @ApiOperation({
    summary: 'Generar nueva nómina',
    description:
      'Calcula automáticamente asignaciones y deducciones para el período especificado.',
  })
  @ApiResponse({ status: 201, description: 'Nómina generada' })
  @RequirePermission(PERMISSIONS.HR.PAYROLL.PROCESS)
  generate(@Body() body: any, @Req() req: any) {
    return this.payrollService.generate({
      ...body,
      branchId: req.branchId,
    });
  }

  @Post(':id/pay')
  @ApiOperation({
    summary: 'Procesar pago de nómina',
    description: 'Registra el egreso bancario y marca la nómina como pagada.',
  })
  @ApiResponse({ status: 200, description: 'Pago procesado' })
  @RequirePermission(PERMISSIONS.HR.PAYROLL.PROCESS)
  processPayment(
    @Param('id') id: string,
    @Body() body: { bankAccountId: string },
  ) {
    return this.payrollService.processPayment(id, body);
  }

  @Patch(':id/status')
  @RequirePermission(PERMISSIONS.HR.PAYROLL.PROCESS)
  updateStatus(@Param('id') id: string, @Body('status') status: string) {
    return this.payrollService.updateStatus(id, status);
  }

  // --- Payslip endpoints ---

  @Get(':runId/payslip/:itemId')
  @ApiOperation({
    summary: 'Obtener datos de recibo de pago',
    description:
      'Retorna la información estructurada para generar el PDF del recibo.',
  })
  @ApiResponse({ status: 200, description: 'Datos del recibo' })
  @RequirePermission(PERMISSIONS.HR.PAYROLL.VIEW)
  getPayslipData(
    @Param('runId') runId: string,
    @Param('itemId') itemId: string,
  ) {
    return this.pdfService.getPayslipData(runId, itemId);
  }

  @Get(':runId/payslips')
  @RequirePermission(PERMISSIONS.HR.PAYROLL.VIEW)
  getBatchPayslipData(@Param('runId') runId: string) {
    return this.pdfService.getBatchPayslipData(runId);
  }

  // --- Export endpoints ---

  @Get(':runId/export/txt')
  @ApiOperation({
    summary: 'Exportar TXT para banco',
    description:
      'Genera el archivo plano para carga masiva en plataforma bancaria.',
  })
  @ApiResponse({ status: 200, description: 'Archivo generado' })
  @Header('Content-Type', 'text/plain; charset=utf-8')
  @RequirePermission(PERMISSIONS.HR.PAYROLL.VIEW)
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
  @RequirePermission(PERMISSIONS.HR.PAYROLL.VIEW)
  async exportFaovTxt(@Param('runId') runId: string, @Res() res: Response) {
    const txt = await this.complianceService.generateFaovTxt(runId);
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="faov-${runId}.csv"`,
    );
    res.send(txt);
  }

  @Get(':runId/export/excel')
  @RequirePermission(PERMISSIONS.HR.PAYROLL.VIEW)
  getExcelData(@Param('runId') runId: string) {
    return this.exportService.getExcelData(runId);
  }

  @Get(':runId/export/excel-download')
  @Header(
    'Content-Type',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  )
  @RequirePermission(PERMISSIONS.HR.PAYROLL.VIEW)
  async downloadExcel(@Param('runId') runId: string, @Res() res: Response) {
    const buffer = await this.exportService.generateExcelFile(runId);
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="nomina-${runId}.xlsx"`,
    );
    res.send(buffer);
  }
}
