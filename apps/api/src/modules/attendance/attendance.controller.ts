import {
  Body,
  Controller,
  Get,
  Post,
  Req,
  Query,
} from '@nestjs/common';
import { RequirePermissions } from 'src/guards/permissions.decorator';
import { RolesCheck } from 'src/guards/roles.decorator';
import { AppRequest } from 'src/types/app-request.type';
import { EndAttendanceDto, UpdateAttendanceSettingDto } from './dto/attendance.dto';
import { AttendanceService } from './attendance.service';

@Controller()
export class AttendanceController {
  constructor(private readonly attendanceService: AttendanceService) {}

  // Employee Endpoints
  @Get('attendance/me/today')
  @RequirePermissions('attendance.view')
  async getTodayStatus(@Req() req: AppRequest) {
    return this.attendanceService.getTodayStatus(req.tenant_id!, req.user!.id as string);
  }

  @Post('attendance/start')
  @RequirePermissions('attendance.start')
  async startShift(@Req() req: AppRequest) {
    return this.attendanceService.startShift(req.tenant_id!, req.user!.id as string);
  }

  @Post('attendance/end')
  @RequirePermissions('attendance.end')
  async endShift(@Req() req: AppRequest, @Body() payload: EndAttendanceDto) {
    return this.attendanceService.endShift(req.tenant_id!, req.user!.id as string, payload);
  }

  @Get('attendance/me/stats')
  @RequirePermissions('attendance.view')
  async getMyStats(@Req() req: AppRequest) {
    return this.attendanceService.getMyStats(req.tenant_id!, req.user!.id as string);
  }

  @Get('attendance/me/history')
  @RequirePermissions('attendance.view')
  async getMyHistory(@Req() req: AppRequest, @Query('filter') filter?: string) {
    return this.attendanceService.getMyHistory(req.tenant_id!, req.user!.id as string, filter);
  }

  // Admin Endpoints
  @Get('admin/attendance')
  @RequirePermissions('attendance.manage')
  async getAdminAttendanceList(@Req() req: AppRequest) {
    return this.attendanceService.getAdminAttendanceList(req.tenant_id!);
  }

  @Get('admin/attendance/dashboard')
  @RequirePermissions('attendance.manage')
  async getAdminDashboardStats(@Req() req: AppRequest) {
    return this.attendanceService.getAdminDashboardStats(req.tenant_id!);
  }

  @Get('admin/attendance/report')
  @RequirePermissions('attendance.report')
  async getAdminReport(@Req() req: AppRequest, @Query() query: any) {
    return this.attendanceService.getAdminReport(req.tenant_id!, query);
  }

  @Get('admin/attendance/setting')
  @RequirePermissions('attendance.manage')
  async getAttendanceSetting(@Req() req: AppRequest) {
    return this.attendanceService.getAttendanceSetting(req.tenant_id!);
  }

  @Post('admin/attendance/setting')
  @RequirePermissions('attendance.manage')
  async updateAttendanceSetting(@Req() req: AppRequest, @Body() payload: UpdateAttendanceSettingDto) {
    return this.attendanceService.updateAttendanceSetting(req.tenant_id!, payload);
  }
}
