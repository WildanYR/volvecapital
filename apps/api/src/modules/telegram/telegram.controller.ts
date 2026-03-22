import {
  Body,
  Controller,
  ForbiddenException,
  Param,
  Post,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import TelegramBot from 'node-telegram-bot-api';
import { PublicRoute } from 'src/guards/public-route.decorator';
import { TelegramService } from './telegram.service';

@Controller('telegram')
export class TelegramController {
  constructor(
    private configService: ConfigService,
    private telegramService: TelegramService,
  ) {}

  @PublicRoute()
  @Post(':token')
  telegramWebhook(
    @Param('token') token: string,
    @Body() update: TelegramBot.Update,
  ) {
    const expectedToken = this.configService.get<string>('telegram.token');
    if (token !== expectedToken) {
      throw new ForbiddenException('Invalid token');
    }
    this.telegramService.processUpdate(update);
    return { status: 'ok' };
  }
}
