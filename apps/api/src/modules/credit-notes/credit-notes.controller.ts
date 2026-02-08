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

@Controller('credit-notes')
@UseGuards(JwtAuthGuard)
export class CreditNotesController {
  constructor(private readonly creditNotesService: CreditNotesService) {}

  @Post()
  create(@Body() body: any, @Req() req: any) {
    return this.creditNotesService.create({
      ...body,
      userId: req.user.userId,
    });
  }

  @Get()
  findAll() {
    return this.creditNotesService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.creditNotesService.findOne(id);
  }
}
