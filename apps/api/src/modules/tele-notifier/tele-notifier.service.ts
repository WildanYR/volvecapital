import { Injectable } from '@nestjs/common';
import { SendNotificationDto } from './dto/send-notification.dto';

@Injectable()
export class TeleNotifierService {
  async sendNotification(
    tenantId: string,
    sendNotificationDto: SendNotificationDto,
  ): Promise<void> {
    void tenantId;
    void sendNotificationDto;
  }
}
