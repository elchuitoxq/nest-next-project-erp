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

@Controller('settings/tax-concepts')
@UseGuards(JwtAuthGuard)
export class TaxConceptsController {
  constructor(private readonly taxConceptsService: TaxConceptsService) {}

  @Get()
  findAll() {
    return this.taxConceptsService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.taxConceptsService.findOne(id);
  }

  @Post()
  create(@Body() data: any) {
    return this.taxConceptsService.create(data);
  }

  @Put(':id')
  update(@Param('id') id: string, @Body() data: any) {
    return this.taxConceptsService.update(id, data);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.taxConceptsService.remove(id);
  }
}
