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
import { JwtAuthGuard } from '../../../modules/auth/jwt-auth.guard';
import { BranchInterceptor } from '../../../common/interceptors/branch.interceptor';
import { Response } from 'express';

@Controller('treasury/retentions')
@UseGuards(JwtAuthGuard)
@UseInterceptors(BranchInterceptor)
export class TaxRetentionController {
  constructor(private readonly treasuryService: TreasuryService) {}

  @Get()
  async findAll(@Query('type') type: 'IVA' | 'ISLR', @Req() req: any) {
    return await this.treasuryService.findAllRetentions(
      type || 'IVA',
      req.branchId,
    );
  }

  @Get(':id/pdf')
  async downloadPdf(@Param('id') id: string, @Res() res: Response) {
    const buffer = await this.treasuryService.generateRetentionPdf(id);

    res.set({
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename=retencion-${id}.pdf`,
      'Content-Length': buffer.length,
    });

    res.end(buffer);
  }
}
