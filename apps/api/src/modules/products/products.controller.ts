import {
  Controller,
  Get,
  Post,
  Patch,
  Body,
  Param,
  Delete,
  Query,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { Audit } from '../../modules/audit/audit.decorator';
import { AuditInterceptor } from '../../modules/audit/audit.interceptor';
import { ProductsService } from './products.service';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { JwtAuthGuard } from '../../modules/auth/jwt-auth.guard';
import { PermissionsGuard } from '../../common/guards/permissions.guard';
import { RequirePermission } from '../../common/decorators/permissions.decorator';
import { PERMISSIONS } from '@repo/db';

@Controller('products')
@UseGuards(JwtAuthGuard, PermissionsGuard)
@UseInterceptors(AuditInterceptor)
export class ProductsController {
  constructor(private readonly productsService: ProductsService) {}

  @Post()
  @Audit('products', 'CREATE')
  @RequirePermission(PERMISSIONS.INVENTORY.PRODUCTS.CREATE)
  create(@Body() createProductDto: CreateProductDto) {
    return this.productsService.create(createProductDto);
  }

  @Get()
  @RequirePermission([
    PERMISSIONS.INVENTORY.PRODUCTS.VIEW,
    PERMISSIONS.INVENTORY.MOVES.CREATE, // Needed to select products when creating a move
    PERMISSIONS.INVENTORY.MOVES.APPROVE, // Needed to review move lines
  ])
  findAll(
    @Query('search') search?: string,
    @Query('branchId') branchId?: string,
  ) {
    return this.productsService.findAll(search, branchId);
  }

  @Get(':id')
  @RequirePermission(PERMISSIONS.INVENTORY.PRODUCTS.VIEW)
  findOne(@Param('id') id: string) {
    return this.productsService.findOne(id);
  }

  @Patch(':id')
  @Audit('products', 'UPDATE')
  @RequirePermission(PERMISSIONS.INVENTORY.PRODUCTS.EDIT)
  update(@Param('id') id: string, @Body() updateProductDto: UpdateProductDto) {
    return this.productsService.update(id, updateProductDto);
  }
}
