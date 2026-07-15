import { Module } from '@nestjs/common';
import { UtilityModule } from '../utility/utility.module';
import { AccountingModule } from '../accounting/accounting.module';
import { WhatsappModule } from '../whatsapp/whatsapp.module';
import { VoucherController } from './voucher.controller';
import { VoucherService } from './voucher.service';

@Module({
  imports: [UtilityModule, AccountingModule, WhatsappModule],
  controllers: [VoucherController],
  providers: [VoucherService],
  exports: [VoucherService],
})
export class VoucherModule {}
