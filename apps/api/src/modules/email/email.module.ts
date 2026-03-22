import { Module } from '@nestjs/common';
import { UtilityModule } from '../utility/utility.module';
import { EmailController } from './email.controller';
import { EmailService } from './email.service';

@Module({
  imports: [UtilityModule],
  providers: [EmailService],
  controllers: [EmailController],
})
export class EmailModule {}
