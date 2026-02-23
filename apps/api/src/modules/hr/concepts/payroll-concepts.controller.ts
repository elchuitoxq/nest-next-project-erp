import {
  Controller,
  Get,
  Post,
  Body,
  Delete,
  Param,
  UseGuards,
  Req,
  UseInterceptors,
} from '@nestjs/common';
import { PayrollConceptsService } from './payroll-concepts.service';
import { JwtAuthGuard } from '../../../modules/auth/jwt-auth.guard';
import { BranchInterceptor } from '../../../common/interceptors/branch.interceptor';
import { PermissionsGuard } from '../../../common/guards/permissions.guard';
import { RequirePermission } from '../../../common/decorators/permissions.decorator';
import { PERMISSIONS } from '@repo/db';

@Controller('hr/concepts')
@UseGuards(JwtAuthGuard, PermissionsGuard)
@UseInterceptors(BranchInterceptor)
export class PayrollConceptsController {
  constructor(private readonly service: PayrollConceptsService) {}

  @Get()
  @RequirePermission(PERMISSIONS.HR.SETTINGS.VIEW)
  findAll(@Req() req: any) {
    return this.service.findAll(req.branchId);
  }

  @Post()
  @RequirePermission(PERMISSIONS.HR.SETTINGS.MANAGE)
  create(@Body() body: any, @Req() req: any) {
    return this.service.create({ ...body, branchId: req.branchId });
  }

  @Delete(':id')
  @RequirePermission(PERMISSIONS.HR.SETTINGS.MANAGE)
  delete(@Param('id') id: string) {
    return this.service.delete(id);
  }
}
