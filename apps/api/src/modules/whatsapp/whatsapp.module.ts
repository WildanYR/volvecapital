import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { ConfigModule } from '@nestjs/config';
import { WhatsappService } from './whatsapp.service';
import { WhatsappController } from './whatsapp.controller';
import { TaskQueueModule } from '../task-queue/task-queue.module';

@Module({
  imports: [
    HttpModule,
    ConfigModule,
    TaskQueueModule,
  ],
  providers: [WhatsappService],
  controllers: [WhatsappController],
  exports: [WhatsappService],
})
export class WhatsappModule {}
