import { Module } from '@nestjs/common';
import { TaxConceptsService } from './tax-concepts.service';
import { TaxConceptsController } from './tax-concepts.controller';

@Module({
  providers: [TaxConceptsService],
  controllers: [TaxConceptsController],
  exports: [TaxConceptsService],
})
export class TaxConceptsModule {}
