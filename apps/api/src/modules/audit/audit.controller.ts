import { Controller, Get, Param, UseGuards } from '@nestjs/common';
import { AuditService } from './audit.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@UseGuards(JwtAuthGuard)
@Controller('audit')
export class AuditController {
  constructor(private readonly auditService: AuditService) {}

  @Get(':entityTable/:entityId')
  async getEntityLogs(
    @Param('entityTable') entityTable: string,
    @Param('entityId') entityId: string,
  ) {
    return await this.auditService.getProcessHistory(entityTable, entityId);
  }
}
