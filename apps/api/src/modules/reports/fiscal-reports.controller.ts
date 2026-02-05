import {
  Controller,
  Get,
  Query,
  Res,
  UseGuards,
  UseInterceptors,
  Req,
} from '@nestjs/common';
import { FiscalReportsService } from './fiscal-reports.service';
import { Response } from 'express';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { BranchInterceptor } from '../../common/interceptors/branch.interceptor';

import { RetentionsService } from '../accounting/retentions.service';

@Controller('reports/fiscal')
@UseGuards(JwtAuthGuard)
@UseInterceptors(BranchInterceptor)
export class FiscalReportsController {
  constructor(
    private readonly fiscalReportsService: FiscalReportsService,
    private readonly retentionsService: RetentionsService,
  ) {}

  @Get('retenciones-txt')
  async getRetencionesTxt(
    @Query('month') month: string,
    @Query('year') year: string,
    @Query('fortnight') fortnight: 'first' | 'second',
    @Query('direction') direction: 'SALE' | 'PURCHASE',
    @Req() req: any,
    @Res() res: Response,
  ) {
    // 1. Calculate Dates (Reusing Logic - TODO: Refactor to util)
    const m = Number(month).toString().padStart(2, '0');
    const y = year;
    const nextM =
      Number(month) === 12
        ? '01'
        : (Number(month) + 1).toString().padStart(2, '0');
    const nextY = Number(month) === 12 ? (Number(year) + 1).toString() : year;

    let startIso = `${y}-${m}-01`;
    let endIso = `${nextY}-${nextM}-01`;

    if (fortnight === 'first') {
      endIso = `${y}-${m}-16`;
    } else if (fortnight === 'second') {
      startIso = `${y}-${m}-16`;
    }

    const startDate = new Date(startIso);
    const endDate = new Date(endIso);

    // 2. Fetch Data
    const retentions = await this.retentionsService.findByDateRange(
      startDate,
      endDate,
      'IVA',
      req.branchId,
      direction,
    );

    // 3. Generate TXT
    const txtContent =
      this.retentionsService.generateConsolidatedTxt(retentions);

    // 4. Send File
    res.set({
      'Content-Type': 'text/plain',
      'Content-Disposition': `attachment; filename="IVA_${year}${month}_${fortnight || 'full'}.txt"`,
    });
    res.send(txtContent);
  }

  @Get('summary')
  async getFiscalSummary(
    @Query('month') month: string,
    @Query('year') year: string,
    @Query('fortnight') fortnight: 'first' | 'second',
    @Req() req: any,
  ) {
    return await this.fiscalReportsService.getFiscalSummary(
      month,
      year,
      req.branchId,
      fortnight,
    );
  }

  @Get('libro-ventas')
  async getLibroVentas(
    @Query('month') month: string,
    @Query('year') year: string,
    @Query('fortnight') fortnight: 'first' | 'second',
    @Req() req: any,
  ) {
    return await this.fiscalReportsService.getLibroVentas(
      month,
      year,
      req.branchId,
      fortnight,
    );
  }

  @Get('libro-compras')
  async getLibroCompras(
    @Query('month') month: string,
    @Query('year') year: string,
    @Query('fortnight') fortnight: 'first' | 'second',
    @Req() req: any,
  ) {
    return await this.fiscalReportsService.getLibroCompras(
      month,
      year,
      req.branchId,
      fortnight,
    );
  }
}
