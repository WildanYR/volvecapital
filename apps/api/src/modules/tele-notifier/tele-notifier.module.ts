import { Module } from '@nestjs/common';
import { TelegramModule } from '../telegram/telegram.module';
import { TeleNotifierController } from './tele-notifier.controller';
import { TeleNotifierService } from './tele-notifier.service';

@Module({
  imports: [TelegramModule],
  providers: [TeleNotifierService],
  controllers: [TeleNotifierController],
  exports: [TeleNotifierService],
})
export class TeleNotifierModule {}
