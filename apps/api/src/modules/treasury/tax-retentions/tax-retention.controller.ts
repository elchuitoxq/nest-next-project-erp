import {
  Controller,
  Get,
  Query,
  Res,
  Param,
  UseGuards,
  UseInterceptors,
  Req,
} from '@nestjs/common';
import { TreasuryService } from '../treasury.service';
import { RetentionsService } from '../../accounting/retentions.service';
import { JwtAuthGuard } from '../../../modules/auth/jwt-auth.guard';
import { BranchInterceptor } from '../../../common/interceptors/branch.interceptor';
import { Response } from 'express';

@Controller('treasury/retentions')
@UseGuards(JwtAuthGuard)
@UseInterceptors(BranchInterceptor)
export class TaxRetentionController {
  constructor(
    private readonly treasuryService: TreasuryService,
    private readonly retentionsService: RetentionsService,
  ) {}

  @Get()
  async findAll(@Query('type') type: 'IVA' | 'ISLR', @Req() req: any) {
    const retentions = await this.retentionsService.findAll(
      type || 'IVA',
      req.branchId,
    );

    // Map to match frontend expectations
    return retentions.map((r) => ({
      id: r.id,
      date: r.createdAt,
      reference: r.code,
      amount: r.totalRetained,
      partnerName: r.partner?.name,
      partnerTaxId: r.partner?.taxId,
      type: r.type,
      period: r.period,
    }));
  }

  @Get(':id/pdf')
  async downloadPdf(@Param('id') id: string, @Res() res: Response) {
    const doc = await this.retentionsService.generatePDF(id);

    res.set({
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename=retencion-${id}.pdf`,
    });

    doc.pipe(res);
  }

  @Get(':id/xml')
  async downloadXml(@Param('id') id: string, @Res() res: Response) {
    const retention = await this.retentionsService.findOne(id);
    if (!retention) {
      return res.status(404).send('Retención no encontrada');
    }

    const xml = this.retentionsService.generateXML(retention, retention.lines);

    res.set({
      'Content-Type': 'application/xml',
      'Content-Disposition': `attachment; filename=retencion-${retention.code}.xml`,
    });

    res.send(xml);
  }

  @Get('export/txt')
  async exportTxt(@Query('period') period: string, @Res() res: Response, @Req() req: any) {
    const retentions = await this.retentionsService.findAll('IVA', req.branchId);
    
    // Filter by period if provided
    const filtered = period 
      ? retentions.filter(r => r.period === period)
      : retentions;

    // We need the lines for the TXT
    const fullRetentions = await Promise.all(
      filtered.map(r => this.retentionsService.findOne(r.id))
    );

    const txt = this.retentionsService.generateConsolidatedTxt(fullRetentions);

    res.set({
      'Content-Type': 'text/plain',
      'Content-Disposition': `attachment; filename=retenciones_${period || 'todas'}.txt`,
    });

    res.send(txt);
  }
}
