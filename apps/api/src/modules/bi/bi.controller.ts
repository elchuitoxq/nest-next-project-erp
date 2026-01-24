import {
  Controller,
  Get,
  UseGuards,
  Request,
  UseInterceptors,
  Query,
  ValidationPipe,
  UsePipes,
} from '@nestjs/common';
import { BiService } from './bi.service';
import { JwtAuthGuard } from '../../modules/auth/jwt-auth.guard';
import { BranchInterceptor } from '../../common/interceptors/branch.interceptor';
import { GetBiStatsDto } from './dto/get-bi-stats.dto';

@Controller('bi')
@UseGuards(JwtAuthGuard)
@UseInterceptors(BranchInterceptor)
export class BiController {
  constructor(private readonly biService: BiService) {}

  @Get('kpis')
  @UsePipes(new ValidationPipe({ transform: true }))
  getKpis(@Request() req: any, @Query() query: GetBiStatsDto) {
    return this.biService.getKpis(
      req.branchId,
      query.startDate,
      query.endDate,
    );
  }

  @Get('chart')
  @UsePipes(new ValidationPipe({ transform: true }))
  getChart(@Request() req: any, @Query() query: GetBiStatsDto) {
    return this.biService.getFinancialChart(
      req.branchId,
      query.startDate,
      query.endDate,
    );
  }

  @Get('activity')
  getActivity(@Request() req: any) {
    return this.biService.getRecentActivity(req.branchId);
  }
}
