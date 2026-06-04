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
  Put,
  Request,
} from '@nestjs/common';
import { RequirePermissions } from 'src/guards/permissions.decorator';
import { RoleService } from './role.service';
import { CreateRoleDto } from './dto/create-role.dto';
import { UpdateRoleDto, SetRolePermissionsDto } from './dto/update-role.dto';

@Controller('role')
export class RoleController {
  constructor(private readonly roleService: RoleService) {}

  @Get()
  @RequirePermissions('role.view')
  findAll(@Request() req: any) {
    return this.roleService.findAll(req.tenant_id);
  }

  @Get(':id')
  @RequirePermissions('role.view')
  findOne(@Param('id') id: string, @Request() req: any) {
    return this.roleService.findOne(id, req.tenant_id);
  }

  @Post()
  @RequirePermissions('role.create')
  create(@Body() dto: CreateRoleDto, @Request() req: any) {
    return this.roleService.create(dto, req.tenant_id);
  }

  @Patch(':id')
  @RequirePermissions('role.edit')
  update(@Param('id') id: string, @Body() dto: UpdateRoleDto, @Request() req: any) {
    return this.roleService.update(id, dto, req.tenant_id);
  }

  @Put(':id/permissions')
  @RequirePermissions('role.edit')
  setPermissions(
    @Param('id') id: string,
    @Body() dto: SetRolePermissionsDto,
    @Request() req: any,
  ) {
    return this.roleService.setPermissions(id, dto.permission_ids, req.tenant_id);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @RequirePermissions('role.delete')
  remove(@Param('id') id: string, @Request() req: any) {
    return this.roleService.remove(id, req.tenant_id);
  }
}
