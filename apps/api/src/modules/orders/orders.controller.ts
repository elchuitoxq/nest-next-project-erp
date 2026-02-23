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
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiHeader,
} from '@nestjs/swagger';
import { BranchInterceptor } from '../../common/interceptors/branch.interceptor';
import { OrdersService } from './orders.service';
import { CreateOrderDto } from './dto/create-order.dto';
import { FindOrdersDto } from './dto/find-orders.dto';
import { JwtAuthGuard } from '../../modules/auth/jwt-auth.guard';
import { AuditInterceptor } from '../audit/audit.interceptor';
import { Audit } from '../audit/audit.decorator';
import { PermissionsGuard } from '../../common/guards/permissions.guard';
import { RequirePermission } from '../../common/decorators/permissions.decorator';
import { PERMISSIONS } from '@repo/db';

@ApiTags('Operaciones - Pedidos (Ventas/Compras)')
@ApiBearerAuth()
@ApiHeader({
  name: 'x-branch-id',
  description: 'ID de la sucursal para filtrar los datos',
  required: false,
})
@Controller('orders')
@UseGuards(JwtAuthGuard, PermissionsGuard)
@UseInterceptors(BranchInterceptor, AuditInterceptor)
export class OrdersController {
  constructor(private readonly ordersService: OrdersService) {}

  @Get()
  @ApiOperation({
    summary: 'Listar pedidos',
    description:
      'Retorna una lista paginada de pedidos filtrados por tipo (venta/compra), estado y cliente. El acceso está restringido por permisos de sucursal.',
  })
  @ApiResponse({
    status: 200,
    description: 'Lista de pedidos obtenida correctamente',
  })
  @ApiResponse({ status: 401, description: 'No autorizado' })
  @ApiResponse({ status: 403, description: 'Permisos insuficientes' })
  @RequirePermission([
    PERMISSIONS.OPERATIONS.SALES.VIEW,
    PERMISSIONS.OPERATIONS.PURCHASES.VIEW,
  ])
  findAll(@Request() req: any, @Query() query: FindOrdersDto) {
    const user = req.user;
    const hasSalesView = user.permissions.includes(
      PERMISSIONS.OPERATIONS.SALES.VIEW,
    );
    const hasPurchasesView = user.permissions.includes(
      PERMISSIONS.OPERATIONS.PURCHASES.VIEW,
    );

    // Filter types based on permissions
    const allowedTypes: string[] = [];
    if (hasSalesView) allowedTypes.push('SALE');
    if (hasPurchasesView) allowedTypes.push('PURCHASE');

    // If query.type is provided, intersect with allowed types
    if (query.type) {
      if (typeof query.type === 'string') {
        const typeStr = query.type as string; // Assert string for single value
        if (!allowedTypes.includes(typeStr)) {
          // If requested type is not allowed, return empty or throw.
          // Let's filter to empty by passing impossible type or empty array handling in service
          // Logic: if intersection is empty, user can't see what they asked for.
          // The service probably expects array or string.
          // Let's just override query.type with intersection.
          const requested = [typeStr];
          const intersection = requested.filter((t) =>
            allowedTypes.includes(t),
          );
          if (intersection.length === 0)
            return { data: [], meta: { total: 0, page: 1, lastPage: 0 } }; // Return empty result
          query.type = intersection;
        }
      } else if (Array.isArray(query.type)) {
        const intersection = query.type.filter((t) => allowedTypes.includes(t));
        if (intersection.length === 0)
          return { data: [], meta: { total: 0, page: 1, lastPage: 0 } };
        query.type = intersection;
      }
    } else {
      // If no type specified, default to all ALLOWED types
      query.type = allowedTypes;
    }

    const isAdmin = req.user.roles?.includes('admin');
    const hasBranchHeader = !!req.headers['x-branch-id'];
    const branchId = isAdmin && !hasBranchHeader ? null : req.branchId;

    return this.ordersService.findAll(branchId, query, req.user);
  }

  @Get('stats')
  @ApiOperation({
    summary: 'Obtener estadísticas de pedidos',
    description:
      'Retorna el conteo de pedidos agrupados por estado para el tipo especificado.',
  })
  @ApiResponse({ status: 200, description: 'Estadísticas obtenidas' })
  getStats(@Request() req: any, @Query('type') type: string) {
    const isAdmin = req.user.roles?.includes('admin');
    const hasBranchHeader = !!req.headers['x-branch-id'];
    const branchId = isAdmin && !hasBranchHeader ? null : req.branchId;

    return this.ordersService.getStats(branchId, type || 'SALE');
  }

  @Get(':id')
  @ApiOperation({
    summary: 'Obtener detalle de un pedido',
    description:
      'Retorna la información completa de un pedido incluyendo ítems.',
  })
  @ApiResponse({ status: 200, description: 'Pedido encontrado' })
  @ApiResponse({ status: 404, description: 'Pedido no encontrado' })
  findOne(@Param('id') id: string) {
    return this.ordersService.findOne(id);
  }

  @Post()
  @ApiOperation({
    summary: 'Crear un nuevo pedido',
    description:
      'Registra un pedido de venta o compra. Valida stock para ventas.',
  })
  @ApiResponse({ status: 201, description: 'Pedido creado exitosamente' })
  @ApiResponse({ status: 400, description: 'Datos de entrada inválidos' })
  @Audit('orders', 'CREATE', 'Pedido creado')
  @RequirePermission([
    PERMISSIONS.OPERATIONS.SALES.CREATE,
    PERMISSIONS.OPERATIONS.PURCHASES.CREATE,
  ])
  create(@Body() createOrderDto: CreateOrderDto, @Request() req: any) {
    const type = createOrderDto.type || 'SALE'; // Default to SALE if info missing, though DTO usually requires it or logic defaults
    const requiredPermission =
      type === 'PURCHASE'
        ? PERMISSIONS.OPERATIONS.PURCHASES.CREATE
        : PERMISSIONS.OPERATIONS.SALES.CREATE;

    if (!req.user.permissions.includes(requiredPermission)) {
      throw new ForbiddenException(
        `No tienes permisos para crear pedidos de tipo ${type}`,
      );
    }

    return this.ordersService.create(
      {
        ...createOrderDto,
        branchId: req.branchId, // Force branch from context
      },
      req.user.userId,
    );
  }

  @Post(':id/confirm')
  @ApiOperation({
    summary: 'Confirmar pedido',
    description: 'Cambia el estado del pedido a CONFIRMADO.',
  })
  @ApiResponse({ status: 200, description: 'Pedido confirmado' })
  @ApiResponse({ status: 404, description: 'Pedido no encontrado' })
  @Audit('orders', 'UPDATE', 'Pedido confirmado')
  @RequirePermission([
    PERMISSIONS.OPERATIONS.SALES.APPROVE,
    PERMISSIONS.OPERATIONS.PURCHASES.APPROVE,
  ])
  async confirm(@Param('id') id: string, @Request() req: any) {
    // Check order type before confirming
    const order = await this.ordersService.findOne(id);
    if (!order) throw new NotFoundException('Pedido no encontrado');

    const requiredPermission =
      order.type === 'PURCHASE'
        ? PERMISSIONS.OPERATIONS.PURCHASES.APPROVE
        : PERMISSIONS.OPERATIONS.SALES.APPROVE;

    if (!req.user.permissions.includes(requiredPermission)) {
      throw new ForbiddenException(
        `No tienes permisos para aprobar pedidos de tipo ${order.type}`,
      );
    }
    return this.ordersService.confirm(id, req.user.userId);
  }

  @Post(':id/cancel')
  @ApiOperation({
    summary: 'Cancelar pedido',
    description: 'Cambia el estado del pedido a CANCELADO.',
  })
  @ApiResponse({ status: 200, description: 'Pedido cancelado' })
  @ApiResponse({ status: 404, description: 'Pedido no encontrado' })
  @Audit('orders', 'UPDATE', 'Pedido cancelado')
  @RequirePermission([
    PERMISSIONS.OPERATIONS.SALES.CANCEL,
    PERMISSIONS.OPERATIONS.PURCHASES.CANCEL, // Assuming this exists or using SALES.CANCEL for now if not defined?
    // Wait, PURCHASES.CANCEL exists in permissions.ts
  ])
  async cancel(@Param('id') id: string, @Request() req: any) {
    const order = await this.ordersService.findOne(id);
    if (!order) throw new NotFoundException('Pedido no encontrado');

    const requiredPermission =
      order.type === 'PURCHASE'
        ? PERMISSIONS.OPERATIONS.PURCHASES.CANCEL
        : PERMISSIONS.OPERATIONS.SALES.CANCEL;

    if (!req.user.permissions.includes(requiredPermission)) {
      throw new ForbiddenException(
        `No tienes permisos para cancelar pedidos de tipo ${order.type}`,
      );
    }
    return this.ordersService.cancel(id, req.user.userId);
  }

  @Post(':id/invoice')
  @ApiOperation({
    summary: 'Generar factura desde pedido',
    description:
      'Crea una factura en estado DRAFT basada en los ítems y montos del pedido.',
  })
  @ApiResponse({ status: 201, description: 'Factura generada exitosamente' })
  @ApiResponse({ status: 404, description: 'Pedido no encontrado' })
  @Audit('orders', 'UPDATE', 'Factura generada desde pedido')
  @RequirePermission([
    PERMISSIONS.FINANCE.INVOICES.CREATE,
    PERMISSIONS.OPERATIONS.SALES.APPROVE,
    PERMISSIONS.OPERATIONS.PURCHASES.APPROVE,
  ])
  async generateInvoice(@Param('id') id: string, @Request() req: any) {
    const order = await this.ordersService.findOne(id);
    if (!order) throw new NotFoundException('Pedido no encontrado');

    // If user has finance permission, allow.
    // If not, check if they have the specific approval permission for this order type.
    const hasFinance = req.user.permissions.includes(
      PERMISSIONS.FINANCE.INVOICES.CREATE,
    );

    if (!hasFinance) {
      const requiredPermission =
        order.type === 'PURCHASE'
          ? PERMISSIONS.OPERATIONS.PURCHASES.APPROVE
          : PERMISSIONS.OPERATIONS.SALES.APPROVE;

      if (!req.user.permissions.includes(requiredPermission)) {
        throw new ForbiddenException(
          `No tienes permisos para generar facturas de pedidos de tipo ${order.type}`,
        );
      }
    }

    return this.ordersService.generateInvoice(id, req.user.userId);
  }

  @Post(':id/recalculate')
  @ApiOperation({
    summary: 'Recalcular pedido',
    description: 'Recalcula los totales del pedido basados en la tasa actual.',
  })
  @ApiResponse({ status: 200, description: 'Pedido recalculado' })
  @ApiResponse({ status: 404, description: 'Pedido no encontrado' })
  @Audit('orders', 'UPDATE', 'Pedido recalculado')
  @RequirePermission([
    PERMISSIONS.OPERATIONS.SALES.CREATE,
    PERMISSIONS.OPERATIONS.PURCHASES.CREATE,
  ])
  async recalculate(@Param('id') id: string, @Request() req: any) {
    const order = await this.ordersService.findOne(id);
    if (!order) throw new NotFoundException('Pedido no encontrado');

    const requiredPermission =
      order.type === 'PURCHASE'
        ? PERMISSIONS.OPERATIONS.PURCHASES.CREATE
        : PERMISSIONS.OPERATIONS.SALES.CREATE;

    if (!req.user.permissions.includes(requiredPermission)) {
      throw new ForbiddenException(
        `No tienes permisos para recalcular pedidos de tipo ${order.type}`,
      );
    }
    return this.ordersService.recalculate(id, req.user.userId);
  }
}
