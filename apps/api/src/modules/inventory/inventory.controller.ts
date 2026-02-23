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
import { AuditInterceptor } from '../audit/audit.interceptor';
import { Audit } from '../audit/audit.decorator';
import { InventoryService } from './inventory.service';
import { CreateInventoryMoveDto } from './dto/create-move.dto';
import { RejectMoveDto } from './dto/reject-move.dto';
import { CreateWarehouseDto } from './dto/create-warehouse.dto';
import { UpdateWarehouseDto } from './dto/update-warehouse.dto';
import { JwtAuthGuard } from '../../modules/auth/jwt-auth.guard';
import { FindMovesDto } from './dto/find-moves.dto';

import { PermissionsGuard } from '../../common/guards/permissions.guard';
import { RequirePermission } from '../../common/decorators/permissions.decorator';
import { PERMISSIONS } from '@repo/db';

@Controller('inventory')
@UseGuards(JwtAuthGuard, PermissionsGuard)
@UseInterceptors(BranchInterceptor, AuditInterceptor)
export class InventoryController {
  constructor(private readonly inventoryService: InventoryService) {}

  // --- Warehouses ---
  @Get('warehouses')
  @RequirePermission([
    PERMISSIONS.INVENTORY.WAREHOUSES.VIEW,
    PERMISSIONS.OPERATIONS.SALES.CREATE,
    PERMISSIONS.OPERATIONS.PURCHASES.CREATE,
  ])
  findAllWarehouses(@Request() req: any) {
    return this.inventoryService.findAllWarehouses(req.branchId);
  }

  @Post('warehouses')
  @RequirePermission(PERMISSIONS.INVENTORY.WAREHOUSES.CREATE)
  createWarehouse(@Body() dto: CreateWarehouseDto) {
    return this.inventoryService.createWarehouse(dto);
  }

  @Patch('warehouses/:id')
  @RequirePermission(PERMISSIONS.INVENTORY.WAREHOUSES.EDIT)
  updateWarehouse(@Param('id') id: string, @Body() dto: UpdateWarehouseDto) {
    return this.inventoryService.updateWarehouse(id, dto);
  }

  // --- Stock ---
  @Get('stock/:warehouseId')
  @RequirePermission([
    PERMISSIONS.INVENTORY.VIEW,
    PERMISSIONS.OPERATIONS.SALES.CREATE,
    PERMISSIONS.OPERATIONS.PURCHASES.CREATE,
  ])
  getStock(
    @Param('warehouseId') warehouseId: string,
    @Query('search') search?: string,
  ) {
    return this.inventoryService.getStock(warehouseId, search);
  }

  // --- Moves ---
  @Get('moves')
  @RequirePermission(PERMISSIONS.INVENTORY.MOVES.VIEW)
  findAllMoves(@Request() req: any, @Query() query: FindMovesDto) {
    return this.inventoryService.findAllMoves(req.branchId, query);
  }

  @Post('moves')
  @Audit('inventory_moves', 'CREATE', 'Movimiento registrado')
  @RequirePermission(PERMISSIONS.INVENTORY.MOVES.CREATE)
  createMove(@Body() dto: CreateInventoryMoveDto, @Request() req: any) {
    return this.inventoryService.createMove({
      ...dto,
      userId: dto.userId || req.user?.userId,
      branchId: req.branchId,
      source: 'MANUAL', // Movimientos manuales requieren aprobación
    });
  }

  @Patch('moves/:id/approve')
  @Audit('inventory_moves', 'APPROVE', 'Movimiento aprobado')
  @RequirePermission(PERMISSIONS.INVENTORY.MOVES.APPROVE)
  approveMove(@Param('id') id: string, @Request() req: any) {
    return this.inventoryService.approveMove(id, req.user?.userId);
  }

  @Patch('moves/:id/reject')
  @Audit('inventory_moves', 'REJECT', 'Movimiento rechazado')
  @RequirePermission(PERMISSIONS.INVENTORY.MOVES.APPROVE)
  rejectMove(@Param('id') id: string, @Body() dto: RejectMoveDto) {
    return this.inventoryService.rejectMove(id, dto.reason);
  }
}
