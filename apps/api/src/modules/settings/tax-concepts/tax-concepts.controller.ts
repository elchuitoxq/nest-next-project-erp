import {
  Controller,
  Get,
  Post,
  Body,
  Put,
  Param,
  Delete,
  UseGuards,
} from '@nestjs/common';
import { TaxConceptsService } from './tax-concepts.service';
import { JwtAuthGuard } from '../../auth/jwt-auth.guard';
import { PermissionsGuard } from '../../../common/guards/permissions.guard';
import { RequirePermission } from '../../../common/decorators/permissions.decorator';
import { PERMISSIONS } from '@repo/db';

@Controller('settings/tax-concepts')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class TaxConceptsController {
  constructor(private readonly taxConceptsService: TaxConceptsService) {}

  @Get()
  @RequirePermission(PERMISSIONS.SETTINGS.TAXES.VIEW)
  findAll() {
    return this.taxConceptsService.findAll();
  }

  @Get(':id')
  @RequirePermission(PERMISSIONS.SETTINGS.TAXES.VIEW)
  findOne(@Param('id') id: string) {
    return this.taxConceptsService.findOne(id);
  }

  @Post()
  @RequirePermission(PERMISSIONS.SETTINGS.TAXES.MANAGE)
  create(@Body() data: any) {
    return this.taxConceptsService.create(data);
  }

  @Put(':id')
  @RequirePermission(PERMISSIONS.SETTINGS.TAXES.MANAGE)
  update(@Param('id') id: string, @Body() data: any) {
    return this.taxConceptsService.update(id, data);
  }

  @Delete(':id')
  @RequirePermission(PERMISSIONS.SETTINGS.TAXES.MANAGE)
  remove(@Param('id') id: string) {
    return this.taxConceptsService.remove(id);
  }
}
