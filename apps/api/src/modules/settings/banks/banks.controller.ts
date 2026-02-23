import {
  Controller,
  Get,
  Post,
  Body,
  Put,
  Param,
  Patch,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { Audit } from '../../audit/audit.decorator';
import { AuditInterceptor } from '../../audit/audit.interceptor';
import { BanksService } from './banks.service';
import { JwtAuthGuard } from '../../../modules/auth/jwt-auth.guard';

import { PermissionsGuard } from '../../../common/guards/permissions.guard';
import { RequirePermission } from '../../../common/decorators/permissions.decorator';
import { PERMISSIONS } from '@repo/db';

@Controller('settings/banks')
@UseGuards(JwtAuthGuard, PermissionsGuard)
@UseInterceptors(AuditInterceptor)
export class BanksController {
  constructor(private readonly banksService: BanksService) {}

  @Get()
  @RequirePermission(PERMISSIONS.SETTINGS.BANKS.VIEW)
  findAll() {
    return this.banksService.findAll();
  }

  @Post()
  @Audit('banks', 'CREATE')
  @RequirePermission(PERMISSIONS.SETTINGS.BANKS.MANAGE)
  create(@Body() data: { name: string; code: string }) {
    return this.banksService.create(data);
  }

  @Put(':id')
  @Audit('banks', 'UPDATE')
  @RequirePermission(PERMISSIONS.SETTINGS.BANKS.MANAGE)
  update(
    @Param('id') id: string,
    @Body() data: { name?: string; code?: string },
  ) {
    return this.banksService.update(id, data);
  }

  @Patch(':id/toggle')
  @Audit('banks', 'UPDATE')
  @RequirePermission(PERMISSIONS.SETTINGS.BANKS.MANAGE)
  toggleActive(@Param('id') id: string) {
    return this.banksService.toggleActive(id);
  }
}
