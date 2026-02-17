import { Module } from '@nestjs/common';
import { ProductsService } from './products.service';
import { ProductsController } from './products.controller';
import { AuditModule } from '../audit/audit.module';

@Module({
  providers: [ProductsService],
  controllers: [ProductsController],
  imports: [AuditModule],
})
export class ProductsModule {}
