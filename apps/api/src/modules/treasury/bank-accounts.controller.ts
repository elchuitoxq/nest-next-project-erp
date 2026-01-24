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
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { BranchInterceptor } from '../../common/interceptors/branch.interceptor';
import { CreateBankAccountDto } from './dto/create-bank-account.dto';
import { UpdateBankAccountDto } from './dto/update-bank-account.dto';

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
  create(@Body() data: CreateBankAccountDto, @Req() req: any) {
    return this.service.create({ ...data, branchId: req.branchId });
  }

  @Put(':id')
  update(
    @Param('id') id: string,
    @Body() data: UpdateBankAccountDto,
    @Req() req: any,
  ) {
    return this.service.update(id, data, req.branchId);
  }

  @Patch(':id/toggle')
  toggleActive(@Param('id') id: string, @Req() req: any) {
    return this.service.toggleActive(id, req.branchId);
  }
}

