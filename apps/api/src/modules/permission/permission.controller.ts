import { Controller, Get, Request } from '@nestjs/common';
import { RequirePermissions } from 'src/guards/permissions.decorator';
import { PermissionService } from './permission.service';

@Controller('permission')
export class PermissionController {
  constructor(private readonly permissionService: PermissionService) {}

  @Get()
  @RequirePermissions('role.view')
  findAll(@Request() req: any) {
    return this.permissionService.findAll(req.tenant_id);
  }
}
