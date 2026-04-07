import { Module } from '@nestjs/common';
import { TeleNotifierController } from './tele-notifier.controller';
import { TeleNotifierService } from './tele-notifier.service';

@Module({
  providers: [TeleNotifierService],
  controllers: [TeleNotifierController],
  exports: [TeleNotifierService],
})
export class TeleNotifierModule {}
