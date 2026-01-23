import { Module } from '@nestjs/common';
import { BiService } from './bi.service';
import { BiController } from './bi.controller';
import { CurrenciesModule } from '../finance/currencies/currencies.module';

@Module({
  imports: [CurrenciesModule],
  providers: [BiService],
  controllers: [BiController],
})
export class BiModule {}
