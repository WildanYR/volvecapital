import {
  Body,
  Controller,
  HttpCode,
  HttpStatus,
  Post,
  Request,
} from '@nestjs/common';
import { AppRequest } from 'src/types/app-request.type';
import { SendNotificationDto } from './dto/send-notification.dto';
import { TeleNotifierService } from './tele-notifier.service';

@Controller('notifier')
export class TeleNotifierController {
  constructor(private teleNotifierService: TeleNotifierService) {}

  @Post()
  @HttpCode(HttpStatus.NO_CONTENT)
  async sendNotification(
    @Body() sendNotificationDto: SendNotificationDto,
    @Request() request: AppRequest,
  ) {
    await this.teleNotifierService.sendNotification(
      request.tenant_id!,
      sendNotificationDto,
    );
  }
}
