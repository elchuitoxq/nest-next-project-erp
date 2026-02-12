import {
  Controller,
  Get,
  Post,
  Put,
  Body,
  Param,
  UseGuards,
  Patch,
} from '@nestjs/common';
import { ContractsService } from '../services/contracts.service';
import { CreateContractDto, UpdateContractDto } from '../dto/contract.dto';
import { JwtAuthGuard } from '../../../modules/auth/jwt-auth.guard';

@Controller('hr/contracts')
@UseGuards(JwtAuthGuard)
export class ContractsController {
  constructor(private readonly service: ContractsService) {}

  @Get('employee/:employeeId')
  findByEmployee(@Param('employeeId') employeeId: string) {
    return this.service.findByEmployee(employeeId);
  }

  @Post()
  create(@Body() dto: CreateContractDto) {
    return this.service.create(dto);
  }

  @Put(':id')
  update(@Param('id') id: string, @Body() dto: UpdateContractDto) {
    return this.service.update(id, dto);
  }

  @Patch(':id/terminate')
  terminate(@Param('id') id: string, @Body('endDate') endDate: string) {
    return this.service.terminate(id, endDate);
  }
}
