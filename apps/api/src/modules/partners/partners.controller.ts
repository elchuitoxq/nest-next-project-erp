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
} from '@nestjs/common';
import { PartnersService } from './partners.service';
import { JwtAuthGuard } from '../../modules/auth/jwt-auth.guard';

@Controller('partners')
@UseGuards(JwtAuthGuard)
export class PartnersController {
  constructor(private readonly partnersService: PartnersService) {}

  @Get()
  findAll(@Query('search') search?: string, @Query('type') type?: string) {
    return this.partnersService.findAll(search, type);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.partnersService.findOne(id);
  }

  @Post()
  create(@Body() body: any) {
    return this.partnersService.create(body);
  }

  @Put(':id')
  update(@Param('id') id: string, @Body() body: any) {
    return this.partnersService.update(id, body);
  }

  @Delete(':id')
  delete(@Param('id') id: string) {
    return this.partnersService.delete(id);
  }
}
