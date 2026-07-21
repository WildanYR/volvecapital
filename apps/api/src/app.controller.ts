import { Controller, Get, Param, Res, NotFoundException } from '@nestjs/common';
import { Response } from 'express';
import { AppService } from './app.service';
import { PublicRoute } from './guards/public-route.decorator';
import { PublicService } from './modules/public/public.service';

@Controller()
export class AppController {
  constructor(
    private readonly appService: AppService,
    private readonly publicService: PublicService,
  ) {}

  @PublicRoute()
  @Get()
  getHello(): string {
    return this.appService.getHello();
  }

  @PublicRoute()
  @Get('l/:code')
  async redirectShortUrl(@Param('code') code: string, @Res() res: Response) {
    try {
      const { target_url } = await this.publicService.getShortUrl(code);
      if (target_url) {
        return res.redirect(target_url);
      }
      throw new NotFoundException();
    } catch (e) {
      // Just send plain text Not Found to mimic standard behavior
      res.status(404).send('Not Found');
    }
  }
}
