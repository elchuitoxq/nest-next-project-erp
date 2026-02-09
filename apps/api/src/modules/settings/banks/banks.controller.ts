import {
  Controller,
  Get,
  Post,
  Body,
  Put,
  Param,
  Patch,
  UseGuards,
} from '@nestjs/common';
import { BanksService } from './banks.service';
import { JwtAuthGuard } from '../../../modules/auth/jwt-auth.guard';

@Controller('settings/banks')
@UseGuards(JwtAuthGuard)
export class BanksController {
  constructor(private readonly banksService: BanksService) {}

  @Get()
  findAll() {
    return this.banksService.findAll();
  }

  @Post()
  create(@Body() data: { name: string; code: string }) {
    return this.banksService.create(data);
  }

  @Put(':id')
  update(
    @Param('id') id: string,
    @Body() data: { name?: string; code?: string },
  ) {
    return this.banksService.update(id, data);
  }

  @Patch(':id/toggle')
  toggleActive(@Param('id') id: string) {
    return this.banksService.toggleActive(id);
  }
}
