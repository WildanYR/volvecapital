import {
  Body,
  Controller,
  Get,
  Patch,
  Request,
} from '@nestjs/common';
import { AppRequest } from 'src/types/app-request.type';
import { SettingService } from './setting.service';

@Controller('setting')
export class SettingController {
  constructor(private readonly settingService: SettingService) {}

  @Get()
  findAll(@Request() request: AppRequest) {
    return this.settingService.findAll(request.tenant_id!);
  }

  @Patch()
  update(
    @Request() request: AppRequest,
    @Body() body: { key: string; value: string },
  ) {
    return this.settingService.update(request.tenant_id!, body.key, body.value);
  }

  @Patch('bulk')
  updateBulk(
    @Request() request: AppRequest,
    @Body() body: Record<string, string>,
  ) {
    return this.settingService.updateBulk(request.tenant_id!, body);
  }
}
