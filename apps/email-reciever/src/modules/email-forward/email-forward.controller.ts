import { CacheInterceptor } from '@nestjs/cache-manager';
import { Body, Controller, Get, HttpCode, HttpStatus, Post, Query, UseInterceptors } from '@nestjs/common';
import { RecieveEmailDto } from './dto/recieve-email.dto';
import { EmailForwardService } from './email-forward.service';

@Controller('email-forward')
export class EmailForwardController {
  constructor(private readonly emailForwardService: EmailForwardService) {}

  @Post()
  @HttpCode(HttpStatus.NO_CONTENT)
  async recieveEmail(@Body() recieveEmailDto: RecieveEmailDto) {
    await this.emailForwardService.recieveEmail(recieveEmailDto);
  }

  @UseInterceptors(CacheInterceptor)
  @Get('/subject')
  async getEmailSubject(@Query('tenant') tenant: string) {
    if (!tenant) {
      return { subjects: [] };
    }
    return await this.emailForwardService.getEmailSubject(tenant);
  }
}
