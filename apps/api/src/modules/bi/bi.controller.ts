import {
  Controller,
  Get,
  UseGuards,
  Request,
  UseInterceptors,
} from '@nestjs/common';
import { BiService } from './bi.service';
import { JwtAuthGuard } from '../../modules/auth/jwt-auth.guard';
import { BranchInterceptor } from '../../common/interceptors/branch.interceptor';

@Controller('bi')
@UseGuards(JwtAuthGuard)
@UseInterceptors(BranchInterceptor)
export class BiController {
  constructor(private readonly biService: BiService) {}

  @Get('kpis')
  getKpis(@Request() req: any) {
    return this.biService.getKpisFull(req.branchId);
  }

  @Get('chart')
  getChart(@Request() req: any) {
    return this.biService.getSalesChart(req.branchId);
  }
}
