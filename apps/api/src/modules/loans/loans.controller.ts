import { Controller, Get, Post, Body, UseGuards } from '@nestjs/common';
import { LoansService } from './loans.service';
import { JwtAuthGuard } from '../../modules/auth/jwt-auth.guard';

import { PermissionsGuard } from '../../common/guards/permissions.guard';
import { RequirePermission } from '../../common/decorators/permissions.decorator';
import { PERMISSIONS } from '@repo/db';

@Controller('loans')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class LoansController {
  constructor(private readonly loansService: LoansService) {}

  @Post()
  @RequirePermission(PERMISSIONS.FINANCE.TREASURY.EDIT_ACCOUNT) // Using Treasury perm for loan creation
  create(@Body() body: any) {
    return this.loansService.createLoan(body);
  }

  @Get()
  @RequirePermission(PERMISSIONS.FINANCE.TREASURY.VIEW)
  findAll() {
    return this.loansService.findAll();
  }
}
