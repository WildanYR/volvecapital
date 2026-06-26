import { Module } from '@nestjs/common';
import { UtilityModule } from '../utility/utility.module';
import { AccountingModule } from '../accounting/accounting.module';
import { VoucherController } from './voucher.controller';
import { VoucherService } from './voucher.service';

@Module({
  imports: [UtilityModule, AccountingModule],
  controllers: [VoucherController],
  providers: [VoucherService],
  exports: [VoucherService],
})
export class VoucherModule {}
