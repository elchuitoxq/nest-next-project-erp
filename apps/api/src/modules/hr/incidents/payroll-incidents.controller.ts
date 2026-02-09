import {
  Controller,
  Get,
  Post,
  Body,
  Delete,
  Param,
  UseGuards,
  Req,
} from '@nestjs/common';
import { PayrollIncidentsService } from './payroll-incidents.service';
import { JwtAuthGuard } from '../../../modules/auth/jwt-auth.guard';

@Controller('hr/incidents')
@UseGuards(JwtAuthGuard)
export class PayrollIncidentsController {
  constructor(private readonly service: PayrollIncidentsService) {}

  @Get()
  findAll(@Req() req: any) {
    return this.service.findAll(req.branchId);
  }

  @Post()
  create(@Body() body: any) {
    return this.service.create(body);
  }

  @Delete(':id')
  delete(@Param('id') id: string) {
    return this.service.delete(id);
  }
}
