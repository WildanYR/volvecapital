import { Module } from '@nestjs/common';
import { UtilityModule } from '../utility/utility.module';
import { WhatsappModule } from '../whatsapp/whatsapp.module';
import { VoucherController } from './voucher.controller';
import { VoucherService } from './voucher.service';

@Module({
  imports: [UtilityModule, WhatsappModule],
  controllers: [VoucherController],
  providers: [VoucherService],
  exports: [VoucherService],
})
export class VoucherModule {}
