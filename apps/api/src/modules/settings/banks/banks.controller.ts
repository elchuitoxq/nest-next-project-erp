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

@Controller('settings/banks')
@UseGuards(JwtAuthGuard)
@UseInterceptors(AuditInterceptor)
export class BanksController {
  constructor(private readonly banksService: BanksService) {}

  @Get()
  findAll() {
    return this.banksService.findAll();
  }

  @Post()
  @Audit('banks', 'CREATE')
  create(@Body() data: { name: string; code: string }) {
    return this.banksService.create(data);
  }

  @Put(':id')
  @Audit('banks', 'UPDATE')
  update(
    @Param('id') id: string,
    @Body() data: { name?: string; code?: string },
  ) {
    return this.banksService.update(id, data);
  }

  @Patch(':id/toggle')
  @Audit('banks', 'UPDATE')
  toggleActive(@Param('id') id: string) {
    return this.banksService.toggleActive(id);
  }
}
