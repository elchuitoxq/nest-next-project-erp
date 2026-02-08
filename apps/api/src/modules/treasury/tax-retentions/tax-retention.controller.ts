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
  async findAll(
    @Query('type') type: 'IVA' | 'ISLR',
    @Query('page') page: string,
    @Query('limit') limit: string,
    @Query('search') search: string,
    @Req() req: any,
  ) {
    const pageNum = page ? parseInt(page) : 1;
    const limitNum = limit ? parseInt(limit) : 10;

    const { data, meta } = await this.retentionsService.findAllWithPagination(
      type || 'IVA',
      {
        checkBranch: req.branchId,
        page: pageNum,
        limit: limitNum,
        search,
      },
    );

    // Map to match frontend expectations
    // Note: data structure might be slightly different if we change querying strategy,
    // but basic fields used in frontend should match.
    // RetentionsService.findAllWithPagination returns entities with partner loaded.
    const mappedData = data.map((r) => ({
      id: r.id,
      date: r.createdAt,
      reference: r.code,
      amount: r.totalRetained,
      partnerName: r.partner?.name,
      partnerTaxId: r.partner?.taxId,
      type: r.type,
      period: r.period,
      // We might need to fetch invoice number for "Documento Afectado" if not readily available on root
      // findAllWithPagination includes lines.invoice.
      // Let's grab the first invoice number as "related document" for now or list them?
      // User asked for "factura o accion relacionada".
      relatedInvoice:
        r.lines?.[0]?.invoice?.invoiceNumber ||
        r.lines?.[0]?.invoice?.code ||
        'N/A',
      invoiceType: r.lines?.[0]?.invoice?.type || 'N/A',
      conceptName: r.lines?.[0]?.concept?.name || null,
    }));

    return {
      data: mappedData,
      meta,
    };
  }
}
