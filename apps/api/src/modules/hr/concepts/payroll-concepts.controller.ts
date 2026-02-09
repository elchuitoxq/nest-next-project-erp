import {
  Controller,
  Get,
  Post,
  Body,
  Delete,
  Param,
  UseGuards,
  Req,
  UseInterceptors,
} from '@nestjs/common';
import { PayrollConceptsService } from './payroll-concepts.service';
import { JwtAuthGuard } from '../../../modules/auth/jwt-auth.guard';
import { BranchInterceptor } from '../../../common/interceptors/branch.interceptor';

@Controller('hr/concepts')
@UseGuards(JwtAuthGuard)
@UseInterceptors(BranchInterceptor)
export class PayrollConceptsController {
  constructor(private readonly service: PayrollConceptsService) {}

  @Get()
  findAll(@Req() req: any) {
    return this.service.findAll(req.branchId);
  }

  @Post()
  create(@Body() body: any, @Req() req: any) {
    return this.service.create({ ...body, branchId: req.branchId });
  }

  @Delete(':id')
  delete(@Param('id') id: string) {
    return this.service.delete(id);
  }
}
