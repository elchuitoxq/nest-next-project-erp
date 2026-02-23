import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { Audit } from '../audit/audit.decorator';
import { AuditInterceptor } from '../audit/audit.interceptor';
import { PartnersService } from './partners.service';
import { JwtAuthGuard } from '../../modules/auth/jwt-auth.guard';
import { FindPartnersDto } from './dto/find-partners.dto';
import { RequirePermission } from '../../common/decorators/permissions.decorator';
import { PermissionsGuard } from '../../common/guards/permissions.guard';
import { PERMISSIONS } from '@repo/db';

@Controller('partners')
@UseGuards(JwtAuthGuard, PermissionsGuard)
@UseInterceptors(AuditInterceptor)
export class PartnersController {
  constructor(private readonly partnersService: PartnersService) {}

  @Get()
  @RequirePermission(PERMISSIONS.OPERATIONS.PARTNERS.VIEW)
  findAll(@Query() query: FindPartnersDto) {
    return this.partnersService.findAll(query);
  }

  @Get(':id')
  @RequirePermission(PERMISSIONS.OPERATIONS.PARTNERS.VIEW)
  findOne(@Param('id') id: string) {
    return this.partnersService.findOne(id);
  }

  @Post()
  @Audit('partners', 'CREATE')
  @RequirePermission(PERMISSIONS.OPERATIONS.PARTNERS.CREATE)
  create(@Body() body: any) {
    return this.partnersService.create(body);
  }

  @Put(':id')
  @Audit('partners', 'UPDATE')
  @RequirePermission(PERMISSIONS.OPERATIONS.PARTNERS.EDIT)
  update(@Param('id') id: string, @Body() body: any) {
    return this.partnersService.update(id, body);
  }

  @Delete(':id')
  @Audit('partners', 'DELETE')
  @RequirePermission(PERMISSIONS.OPERATIONS.PARTNERS.DELETE)
  delete(@Param('id') id: string) {
    return this.partnersService.delete(id);
  }
}
