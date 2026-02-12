import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  UseGuards,
  Delete,
} from '@nestjs/common';
import { BenefitsService } from '../services/benefits.service';
import { CreateBenefitDto, UpdateBenefitDto } from '../dto/benefit.dto';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';

@ApiTags('HR - Benefits (Prestaciones)')
@Controller('hr/benefits')
@UseGuards(JwtAuthGuard)
export class BenefitsController {
  constructor(private readonly benefitsService: BenefitsService) {}

  @Get('employee/:employeeId')
  @ApiOperation({ summary: 'Get benefits history for an employee' })
  async getByEmployee(@Param('employeeId') employeeId: string) {
    return this.benefitsService.getBenefitsByEmployee(employeeId);
  }

  @Post()
  @ApiOperation({ summary: 'Create a new benefit record' })
  async create(@Body() createBenefitDto: CreateBenefitDto) {
    return this.benefitsService.createBenefit(createBenefitDto);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a benefit record' })
  async update(
    @Param('id') id: string,
    @Body() updateBenefitDto: UpdateBenefitDto,
  ) {
    return this.benefitsService.updateBenefit(id, updateBenefitDto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a benefit record' })
  async remove(@Param('id') id: string) {
    return this.benefitsService.deleteBenefit(id);
  }
}
