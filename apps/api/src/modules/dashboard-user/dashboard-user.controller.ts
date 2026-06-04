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
    return this.dashboardUserService.login(dto, tenantId);
  }

  // All routes below are protected by global VcAuthGuard (APP_GUARD)
  @Get('me')
  getMe(@Request() req: any) {
    // Only dashboard user (staff) has user id in payload. Owner doesn't use this route/module.
    return this.dashboardUserService.getMe(req.user.id, req.tenant_id);
  }

  @Patch('change-password')
  async changePassword(@Request() req: any, @Body() data: any) {
    const userId = req.user?.id;
    return await this.dashboardUserService.changePassword(userId, req.tenant_id, data);
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
