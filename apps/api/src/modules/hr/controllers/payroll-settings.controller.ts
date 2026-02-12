import { Controller, Get, Patch, Body, UseGuards } from '@nestjs/common';
import { PayrollSettingsService } from '../services/payroll-settings.service';
import { UpdatePayrollSettingsBatchDto } from '../dto/payroll-settings.dto';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { ApiTags, ApiOperation } from '@nestjs/swagger';

@ApiTags('HR - Payroll Settings')
@Controller('hr/settings')
@UseGuards(JwtAuthGuard)
export class PayrollSettingsController {
  constructor(
    private readonly payrollSettingsService: PayrollSettingsService,
  ) {}

  @Get()
  @ApiOperation({ summary: 'Get all payroll settings' })
  async findAll() {
    return this.payrollSettingsService.findAll();
  }

  @Patch()
  @ApiOperation({ summary: 'Update payroll settings in batch' })
  async updateBatch(@Body() batchDto: UpdatePayrollSettingsBatchDto) {
    return this.payrollSettingsService.updateBatch(batchDto.settings);
  }

  @Get('concepts')
  @ApiOperation({ summary: 'Get all payroll concept types' })
  async getConceptTypes() {
    return this.payrollSettingsService.getConceptTypes();
  }
}
