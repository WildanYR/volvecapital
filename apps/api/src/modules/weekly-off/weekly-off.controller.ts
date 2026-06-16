import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Req,
} from '@nestjs/common';
import { RequirePermissions } from 'src/guards/permissions.decorator';
import { RolesCheck } from 'src/guards/roles.decorator';
import { AppRequest } from 'src/types/app-request.type';
import { RejectWeeklyOffDto, RequestWeeklyOffDto } from './dto/weekly-off.dto';
import { WeeklyOffService } from './weekly-off.service';

@Controller()
export class WeeklyOffController {
  constructor(private readonly weeklyOffService: WeeklyOffService) {}

  // Employee Endpoints
  @Get('attendance/me/weekly-off')
  @RequirePermissions('weeklyoff.view')
  async getMyWeeklyOff(@Req() req: AppRequest) {
    return this.weeklyOffService.getMyScheduleAndRequests(req.tenant_id!, req.user!.id as string);
  }

  @Post('attendance/me/weekly-off')
  @RequirePermissions('weeklyoff.view')
  async requestWeeklyOff(@Req() req: AppRequest, @Body() payload: RequestWeeklyOffDto) {
    return this.weeklyOffService.requestOffDay(req.tenant_id!, req.user!.id as string, payload);
  }

  // Admin Endpoints
  @Get('admin/weekly-off')
  @RequirePermissions('weeklyoff.manage')
  async getAllRequests(@Req() req: AppRequest) {
    return this.weeklyOffService.getAllRequests(req.tenant_id!);
  }

  @Post('admin/weekly-off/:id/approve')
  @RequirePermissions('weeklyoff.approve')
  async approveRequest(@Req() req: AppRequest, @Param('id') id: string) {
    const adminId = req.user!.role === 'TENANT_OWNER' ? null : (req.user!.id as string);
    return this.weeklyOffService.approveRequest(req.tenant_id!, adminId, id);
  }

  @Post('admin/weekly-off/:id/reject')
  @RequirePermissions('weeklyoff.approve')
  async rejectRequest(@Req() req: AppRequest, @Param('id') id: string, @Body() payload: RejectWeeklyOffDto) {
    const adminId = req.user!.role === 'TENANT_OWNER' ? null : (req.user!.id as string);
    return this.weeklyOffService.rejectRequest(req.tenant_id!, adminId, id, payload);
  }
}
