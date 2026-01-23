import { Controller, Get, Post, Body, UseGuards } from '@nestjs/common';
import { LoansService } from './loans.service';
import { JwtAuthGuard } from '../../modules/auth/jwt-auth.guard';

@Controller('loans')
@UseGuards(JwtAuthGuard)
export class LoansController {
  constructor(private readonly loansService: LoansService) {}

  @Post()
  create(@Body() body: any) {
    return this.loansService.createLoan(body);
  }

  @Get()
  findAll() {
    return this.loansService.findAll();
  }
}
