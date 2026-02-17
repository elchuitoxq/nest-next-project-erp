import { Module } from '@nestjs/common';
import { PartnersService } from './partners.service';
import { PartnersController } from './partners.controller';
import { AuditModule } from '../audit/audit.module';

@Module({
  providers: [PartnersService],
  controllers: [PartnersController],
  imports: [AuditModule],
})
export class PartnersModule {}
