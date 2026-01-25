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

@Controller('reports/fiscal')
@UseGuards(JwtAuthGuard)
@UseInterceptors(BranchInterceptor)
export class FiscalReportsController {
  constructor(private readonly fiscalReportsService: FiscalReportsService) {}

  @Get('libro-ventas')
  async getLibroVentas(
    @Query('month') month: string,
    @Query('year') year: string,
    @Req() req: any,
  ) {
    return await this.fiscalReportsService.getLibroVentas(
      month,
      year,
      req.branchId,
    );
  }

  @Get('libro-compras')
  async getLibroCompras(
    @Query('month') month: string,
    @Query('year') year: string,
    @Req() req: any,
  ) {
    return await this.fiscalReportsService.getLibroCompras(
      month,
      year,
      req.branchId,
    );
  }
}
