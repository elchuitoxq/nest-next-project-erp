import { Controller, Get, Param, UseGuards } from '@nestjs/common';
import { DocumentsService } from './documents.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('documents')
@UseGuards(JwtAuthGuard)
export class DocumentsController {
  constructor(private readonly documentsService: DocumentsService) {}

  @Get(':id/flow')
  async getFlow(@Param('id') id: string) {
    return await this.documentsService.getFlow(id);
  }
}
