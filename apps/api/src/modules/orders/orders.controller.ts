import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  UseGuards,
  Request,
  UseInterceptors,
  Query,
} from '@nestjs/common';
import { BranchInterceptor } from '../../common/interceptors/branch.interceptor';
import { OrdersService } from './orders.service';
import { CreateOrderDto } from './dto/create-order.dto';
import { FindOrdersDto } from './dto/find-orders.dto';
import { JwtAuthGuard } from '../../modules/auth/jwt-auth.guard';
import { AuditInterceptor } from '../audit/audit.interceptor';
import { Audit } from '../audit/audit.decorator';

@Controller('orders')
@UseGuards(JwtAuthGuard)
@UseInterceptors(BranchInterceptor, AuditInterceptor) // Inject branch context and audit
export class OrdersController {
  constructor(private readonly ordersService: OrdersService) {}

  @Get()
  findAll(@Request() req: any, @Query() query: FindOrdersDto) {
    return this.ordersService.findAll(req.branchId, query);
  }

  @Get('stats')
  getStats(@Request() req: any, @Query('type') type: string) {
    return this.ordersService.getStats(req.branchId, type || 'SALE');
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.ordersService.findOne(id);
  }

  @Post()
  @Audit('orders', 'CREATE', 'Pedido creado')
  create(@Body() createOrderDto: CreateOrderDto, @Request() req: any) {
    return this.ordersService.create(
      {
        ...createOrderDto,
        branchId: req.branchId, // Force branch from context
      },
      req.user.userId,
    );
  }

  @Post(':id/confirm')
  @Audit('orders', 'UPDATE', 'Pedido confirmado')
  confirm(@Param('id') id: string, @Request() req: any) {
    return this.ordersService.confirm(id, req.user.userId);
  }

  @Post(':id/cancel')
  @Audit('orders', 'UPDATE', 'Pedido cancelado')
  cancel(@Param('id') id: string, @Request() req: any) {
    return this.ordersService.cancel(id, req.user.userId);
  }

  @Post(':id/invoice')
  @Audit('orders', 'UPDATE', 'Factura generada desde pedido')
  generateInvoice(@Param('id') id: string, @Request() req: any) {
    return this.ordersService.generateInvoice(id, req.user.userId);
  }

  @Post(':id/recalculate')
  @Audit('orders', 'UPDATE', 'Pedido recalculado')
  recalculate(@Param('id') id: string, @Request() req: any) {
    return this.ordersService.recalculate(id, req.user.userId);
  }
}
