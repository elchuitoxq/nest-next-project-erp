import {
  Controller,
  Post,
  Body,
  Get,
  UseGuards,
  Req,
  Param,
} from '@nestjs/common';
import { CreditNotesService } from './credit-notes.service';
import { JwtAuthGuard } from '../../modules/auth/jwt-auth.guard';

import { PermissionsGuard } from '../../common/guards/permissions.guard';
import { RequirePermission } from '../../common/decorators/permissions.decorator';
import { PERMISSIONS } from '@repo/db';

@Controller('credit-notes')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class CreditNotesController {
  constructor(private readonly creditNotesService: CreditNotesService) {}

  @Post()
  @RequirePermission(PERMISSIONS.FINANCE.INVOICES.VOID)
  create(@Body() body: any, @Req() req: any) {
    return this.creditNotesService.create({
      ...body,
      userId: req.user.userId,
    });
  }

  @Get()
  @RequirePermission(PERMISSIONS.FINANCE.INVOICES.VIEW)
  findAll() {
    return this.creditNotesService.findAll();
  }

  @Get(':id')
  @RequirePermission(PERMISSIONS.FINANCE.INVOICES.VIEW)
  findOne(@Param('id') id: string) {
    return this.creditNotesService.findOne(id);
  }
}
