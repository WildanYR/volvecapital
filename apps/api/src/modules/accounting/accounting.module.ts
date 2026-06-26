import { Module } from '@nestjs/common';
import { DatabaseModule } from 'src/database/database.module';
import { AccountingController } from './accounting.controller';
import { AccountingService } from './accounting.service';
import { AmortizationService } from './amortization.service';

@Module({
  imports: [DatabaseModule],
  controllers: [AccountingController],
  providers: [AccountingService, AmortizationService],
  exports: [AccountingService],
})
export class AccountingModule {}
