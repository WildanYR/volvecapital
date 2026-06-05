import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
  Request,
} from '@nestjs/common';
import { PublicRoute } from 'src/guards/public-route.decorator';
import { RequirePermissions } from 'src/guards/permissions.decorator';
import { DashboardUserService } from './dashboard-user.service';
import {
  CreateDashboardUserDto,
  LoginDashboardUserDto,
  UpdateDashboardUserDto,
} from './dto/dashboard-user.dto';

@Controller('dashboard-user')
export class DashboardUserController {
  constructor(private readonly dashboardUserService: DashboardUserService) {}

  // Public route — no auth needed, but requires x-tenant-id header
  @PublicRoute()
  @Post('login')
  login(@Body() dto: LoginDashboardUserDto, @Request() req: any) {
    const tenantId = req.headers['x-tenant-id'] as string;
    const userAgent = req.headers['user-agent'] || 'Unknown';
    const ip = req.ip || 'Unknown';
    return this.dashboardUserService.login(dto, tenantId, userAgent, ip);
  }

  // All routes below are protected by global VcAuthGuard (APP_GUARD)
  @Get('me')
  getMe(@Request() req: any) {
    // Only dashboard user (staff) has user id in payload. Owner doesn't use this route/module.
    return this.dashboardUserService.getMe(req.user.id, req.tenant_id, req.user.session_id);
  }

  @Patch('change-password')
  async changePassword(@Request() req: any, @Body() data: any) {
    const userId = req.user?.id;
    const currentSessionId = req.user?.session_id;
    return await this.dashboardUserService.changePassword(userId, req.tenant_id, data, currentSessionId);
  }

  @Get('device-sessions')
  getDeviceSessions(@Request() req: any) {
    return this.dashboardUserService.getDeviceSessions(req.user.id);
  }

  @Post('device-sessions/:sessionId/revoke')
  revokeDeviceSession(@Param('sessionId') sessionId: string, @Request() req: any) {
    return this.dashboardUserService.revokeDeviceSession(req.user.id, sessionId);
  }

  @RequirePermissions('device.view')
  @Get('all-device-sessions')
  async getAllDeviceSessions(@Request() req: any) {
    return await this.dashboardUserService.getAllDeviceSessions(req.tenant_id);
  }

  @RequirePermissions('device.delete')
  @Post('all-device-sessions/:sessionId/revoke')
  async revokeAnyDeviceSession(@Request() req: any, @Param('sessionId') sessionId: string) {
    return await this.dashboardUserService.revokeAnyDeviceSession(req.tenant_id, sessionId);
  }

  @Get()
  @RequirePermissions('user.view')
  findAll(@Request() req: any) {
    return this.dashboardUserService.findAll(req.tenant_id);
  }

  @Get(':id')
  @RequirePermissions('user.view')
  findOne(@Param('id') id: string, @Request() req: any) {
    return this.dashboardUserService.findOne(id, req.tenant_id);
  }

  @Post()
  @RequirePermissions('user.create')
  create(@Body() dto: CreateDashboardUserDto, @Request() req: any) {
    return this.dashboardUserService.create(dto, req.tenant_id);
  }

  @Patch(':id')
  @RequirePermissions('user.edit')
  update(
    @Param('id') id: string,
    @Body() dto: UpdateDashboardUserDto,
    @Request() req: any,
  ) {
    return this.dashboardUserService.update(id, dto, req.tenant_id);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @RequirePermissions('user.delete')
  remove(@Param('id') id: string, @Request() req: any) {
    return this.dashboardUserService.remove(id, req.tenant_id);
  }
}
