import { Module } from '@nestjs/common';
import { RetentionsService } from './retentions.service';
import { AccountingService } from './accounting.service';

@Module({
  providers: [RetentionsService, AccountingService],
  exports: [RetentionsService, AccountingService],
})
export class AccountingModule {}
