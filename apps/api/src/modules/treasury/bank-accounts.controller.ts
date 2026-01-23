import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Put,
  Patch,
  UseGuards,
  UseInterceptors,
  Req,
} from '@nestjs/common';
import { BankAccountsService } from './bank-accounts.service';
import { bankAccounts } from '@repo/db';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { BranchInterceptor } from '../../common/interceptors/branch.interceptor';

@Controller('treasury/bank-accounts')
@UseGuards(JwtAuthGuard)
@UseInterceptors(BranchInterceptor)
export class BankAccountsController {
  constructor(private readonly service: BankAccountsService) {}

  @Get()
  findAll(@Req() req: any) {
    return this.service.findAll(req.branchId);
  }

  @Get(':id')
  findOne(@Param('id') id: string, @Req() req: any) {
    return this.service.findOne(id, req.branchId);
  }

  @Post()
  create(@Body() data: typeof bankAccounts.$inferInsert, @Req() req: any) {
    return this.service.create({ ...data, branchId: req.branchId });
  }

  @Put(':id')
  update(
    @Param('id') id: string,
    @Body() data: Partial<typeof bankAccounts.$inferInsert>,
    @Req() req: any,
  ) {
    return this.service.update(id, data, req.branchId);
  }

  @Patch(':id/toggle')
  toggleActive(@Param('id') id: string, @Req() req: any) {
    return this.service.toggleActive(id, req.branchId);
  }
}
