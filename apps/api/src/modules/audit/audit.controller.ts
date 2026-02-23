import { Controller, Get, Param, UseGuards } from '@nestjs/common';
import { AuditService } from './audit.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

import { PermissionsGuard } from '../../common/guards/permissions.guard';
import { RequirePermission } from '../../common/decorators/permissions.decorator';
import { PERMISSIONS } from '@repo/db';

@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller('audit')
export class AuditController {
  constructor(private readonly auditService: AuditService) {}

  @Get(':entityTable/:entityId')
  @RequirePermission([
    PERMISSIONS.SETTINGS.VIEW,
    PERMISSIONS.OPERATIONS.SALES.VIEW,
    PERMISSIONS.OPERATIONS.PURCHASES.VIEW,
    PERMISSIONS.INVENTORY.MOVES.VIEW,
  ])
  async getEntityLogs(
    @Param('entityTable') entityTable: string,
    @Param('entityId') entityId: string,
  ) {
    return await this.auditService.getProcessHistory(entityTable, entityId);
  }
}
