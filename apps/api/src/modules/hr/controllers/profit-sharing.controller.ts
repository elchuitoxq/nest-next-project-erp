import { Controller, Get, Post, Body, Param, UseGuards } from '@nestjs/common';
import { ProfitSharingService } from '../services/profit-sharing.service';
import { CreateProfitSharingDto } from '../dto/profit-sharing.dto';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { ApiTags, ApiOperation } from '@nestjs/swagger';

@ApiTags('HR - Profit Sharing (Utilidades)')
@Controller('hr/profit-sharing')
@UseGuards(JwtAuthGuard)
export class ProfitSharingController {
  constructor(private readonly profitSharingService: ProfitSharingService) {}

  @Get('employee/:employeeId')
  @ApiOperation({ summary: 'Get profit sharing history for an employee' })
  async getByEmployee(@Param('employeeId') employeeId: string) {
    return this.profitSharingService.getByEmployee(employeeId);
  }

  @Post()
  @ApiOperation({ summary: 'Register profit sharing' })
  async create(@Body() createDto: CreateProfitSharingDto) {
    return this.profitSharingService.create(createDto);
  }
}
