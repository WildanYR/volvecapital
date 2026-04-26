import { Module } from '@nestjs/common';
import { UtilityModule } from '../utility/utility.module';
import { EmailMessageController } from './email-message.controller';
import { EmailMessageService } from './email-message.service';

import { DatabaseModule } from 'src/database/database.module';

@Module({
  imports: [DatabaseModule, UtilityModule],
  providers: [EmailMessageService],
  controllers: [EmailMessageController],
})
export class EmailMessageModule {}
