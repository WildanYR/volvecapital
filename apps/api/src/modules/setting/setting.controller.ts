import {
  Body,
  Controller,
  Get,
  Patch,
  Request,
} from '@nestjs/common';
import { AppRequest } from 'src/types/app-request.type';
import { RequirePermissions } from 'src/guards/permissions.decorator';
import { SettingService } from './setting.service';

@Controller('setting')
export class SettingController {
  constructor(private readonly settingService: SettingService) {}

  @Get()
  findAll(@Request() request: AppRequest) {
    const user = request.user!;
    if (user.role === 'DASHBOARD_USER') {
      const perms = user.permissions || [];
      if (!perms.some(p => ['setting.view', 'landing.view', 'content.view'].includes(p))) {
        throw new import('@nestjs/common').ForbiddenException('Insufficient permissions');
      }
    }
    return this.settingService.findAll(request.tenant_id!);
  }

  @Patch()
  update(
    @Request() request: AppRequest,
    @Body() body: { key: string; value: string },
  ) {
    const user = request.user!;
    if (user.role === 'DASHBOARD_USER') {
      const perms = user.permissions || [];
      if (!perms.some(p => ['setting.edit', 'landing.edit', 'content.edit'].includes(p))) {
        throw new import('@nestjs/common').ForbiddenException('Insufficient permissions');
      }
    }
    return this.settingService.update(request.tenant_id!, body.key, body.value);
  }

  @Patch('bulk')
  updateBulk(
    @Request() request: AppRequest,
    @Body() body: Record<string, string>,
  ) {
    const user = request.user!;
    if (user.role === 'DASHBOARD_USER') {
      const perms = user.permissions || [];
      if (!perms.some(p => ['setting.edit', 'landing.edit', 'content.edit'].includes(p))) {
        throw new import('@nestjs/common').ForbiddenException('Insufficient permissions');
      }
    }
    return this.settingService.updateBulk(request.tenant_id!, body);
  }
}
