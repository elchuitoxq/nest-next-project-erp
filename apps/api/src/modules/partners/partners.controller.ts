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

@Controller('partners')
@UseGuards(JwtAuthGuard)
@UseInterceptors(AuditInterceptor)
export class PartnersController {
  constructor(private readonly partnersService: PartnersService) {}

  @Get()
  findAll(@Query() query: FindPartnersDto) {
    return this.partnersService.findAll(query);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.partnersService.findOne(id);
  }

  @Post()
  @Audit('partners', 'CREATE')
  create(@Body() body: any) {
    return this.partnersService.create(body);
  }

  @Put(':id')
  @Audit('partners', 'UPDATE')
  update(@Param('id') id: string, @Body() body: any) {
    return this.partnersService.update(id, body);
  }

  @Delete(':id')
  @Audit('partners', 'DELETE')
  delete(@Param('id') id: string) {
    return this.partnersService.delete(id);
  }
}
