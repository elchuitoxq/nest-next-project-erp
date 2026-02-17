import { Module } from '@nestjs/common';
import { BanksService } from './banks.service';
import { BanksController } from './banks.controller';
import { AccountingModule } from '../../accounting/accounting.module';
import { AuditModule } from '../../audit/audit.module';
import { ConfigModule } from '@nestjs/config';
import { DocumentsModule } from '../../documents/documents.module';

@Module({
  providers: [BanksService],
  controllers: [BanksController],
  imports: [ConfigModule, DocumentsModule, AccountingModule, AuditModule],
  exports: [BanksService],
})
export class BanksModule {}
