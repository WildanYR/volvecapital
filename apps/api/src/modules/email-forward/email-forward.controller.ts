import { CacheInterceptor } from '@nestjs/cache-manager';
import { Body, Controller, Get, HttpCode, HttpStatus, Post, UseInterceptors } from '@nestjs/common';
import { PublicRoute } from 'src/guards/public-route.decorator';
import { RecieveEmailDto } from './dto/recieve-email.dto';
import { EmailForwardService } from './email-forward.service';

@Controller('email-forward')
export class EmailForwardController {
  constructor(private readonly emailForwardService: EmailForwardService) {}

  @PublicRoute()
  @Post()
  @HttpCode(HttpStatus.NO_CONTENT)
  recieveEmail(@Body() recieveEmailDto: RecieveEmailDto) {
    this.emailForwardService.recieveEmail(recieveEmailDto);
  }

  @PublicRoute()
  @UseInterceptors(CacheInterceptor)
  @Get('/subject')
  async getEmailSubject() {
    return await this.emailForwardService.getEmailSubject();
  }
}
