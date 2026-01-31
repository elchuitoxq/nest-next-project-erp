import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  UseGuards,
  Request,
  Patch,
  UseInterceptors,
  Query,
} from '@nestjs/common';
import { BranchInterceptor } from '../../common/interceptors/branch.interceptor';
import { InventoryService } from './inventory.service';
import { CreateInventoryMoveDto } from './dto/create-move.dto';
import { CreateWarehouseDto } from './dto/create-warehouse.dto';
import { JwtAuthGuard } from '../../modules/auth/jwt-auth.guard';
import { FindMovesDto } from './dto/find-moves.dto';

@Controller('inventory')
@UseGuards(JwtAuthGuard)
@UseInterceptors(BranchInterceptor)
export class InventoryController {
  constructor(private readonly inventoryService: InventoryService) {}

  // --- Warehouses ---
  @Get('warehouses')
  findAllWarehouses(@Request() req: any) {
    return this.inventoryService.findAllWarehouses(req.branchId);
  }

  @Post('warehouses')
  createWarehouse(@Body() dto: CreateWarehouseDto) {
    return this.inventoryService.createWarehouse(dto);
  }

  @Patch('warehouses/:id')
  updateWarehouse(@Param('id') id: string, @Body() dto: any) {
    return this.inventoryService.updateWarehouse(id, dto);
  }

  // --- Stock ---
  @Get('stock/:warehouseId')
  getStock(
    @Param('warehouseId') warehouseId: string,
    @Query('search') search?: string,
  ) {
    return this.inventoryService.getStock(warehouseId, search);
  }

  // --- Moves ---
  @Get('moves')
  findAllMoves(@Request() req: any, @Query() query: FindMovesDto) {
    return this.inventoryService.findAllMoves(req.branchId, query);
  }

  @Post('moves')
  createMove(@Body() dto: CreateInventoryMoveDto, @Request() req: any) {
    return this.inventoryService.createMove({
      ...dto,
      userId: dto.userId || req.user?.userId,
      branchId: req.branchId,
    });
  }
}
