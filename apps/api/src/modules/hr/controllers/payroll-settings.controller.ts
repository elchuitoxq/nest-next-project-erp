import { Controller, Get, Patch, Body, UseGuards } from '@nestjs/common';
import { PayrollSettingsService } from '../services/payroll-settings.service';
import { UpdatePayrollSettingsBatchDto } from '../dto/payroll-settings.dto';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { PermissionsGuard } from '../../../common/guards/permissions.guard';
import { RequirePermission } from '../../../common/decorators/permissions.decorator';
import { PERMISSIONS } from '@repo/db';

@ApiTags('HR - Payroll Settings')
@Controller('hr/settings')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class PayrollSettingsController {
  constructor(
    private readonly payrollSettingsService: PayrollSettingsService,
  ) {}

  @Get()
  @ApiOperation({ summary: 'Get all payroll settings' })
  @RequirePermission(PERMISSIONS.HR.SETTINGS.VIEW)
  async findAll() {
    return this.payrollSettingsService.findAll();
  }

  @Patch()
  @ApiOperation({ summary: 'Update payroll settings in batch' })
  @RequirePermission(PERMISSIONS.HR.SETTINGS.MANAGE)
  async updateBatch(@Body() batchDto: UpdatePayrollSettingsBatchDto) {
    return this.payrollSettingsService.updateBatch(batchDto.settings);
  }

  @Get('concepts')
  @ApiOperation({ summary: 'Get all payroll concept types' })
  @RequirePermission(PERMISSIONS.HR.SETTINGS.VIEW)
  async getConceptTypes() {
    return this.payrollSettingsService.getConceptTypes();
  }
}
