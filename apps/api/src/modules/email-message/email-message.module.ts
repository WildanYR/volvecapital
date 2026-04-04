import { Module } from '@nestjs/common';
import { UtilityModule } from '../utility/utility.module';
import { EmailMessageController } from './email-message.controller';
import { EmailMessageService } from './email-message.service';

@Module({
  imports: [UtilityModule],
  providers: [EmailMessageService],
  controllers: [EmailMessageController],
})
export class EmailMessageModule {}
