import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Put,
  Req,
} from '@nestjs/common';
import { RequirePermissions } from 'src/guards/permissions.decorator';
import { RolesCheck } from 'src/guards/roles.decorator';
import { AppRequest } from 'src/types/app-request.type';
import { AssignShiftDto, CreateShiftDto, UpdateShiftDto } from './dto/shift.dto';
import { ShiftService } from './shift.service';

@Controller('admin/shifts')
export class ShiftController {
  constructor(private readonly shiftService: ShiftService) {}

  @Get()
  @RequirePermissions('shift.view')
  async findAll(@Req() req: AppRequest) {
    return this.shiftService.findAll(req.tenant_id!);
  }

  @Get('assignments')
  @RequirePermissions('shift.view')
  async getAssignments(@Req() req: AppRequest) {
    return this.shiftService.getAssignments(req.tenant_id!);
  }

  @Post()
  @RequirePermissions('shift.manage')
  async create(@Req() req: AppRequest, @Body() payload: CreateShiftDto) {
    return this.shiftService.create(req.tenant_id!, payload);
  }

  @Put(':id')
  @RequirePermissions('shift.manage')
  async update(
    @Req() req: AppRequest,
    @Param('id') id: string,
    @Body() payload: UpdateShiftDto,
  ) {
    return this.shiftService.update(req.tenant_id!, id, payload);
  }

  @Delete(':id')
  @RequirePermissions('shift.manage')
  async delete(@Req() req: AppRequest, @Param('id') id: string) {
    return this.shiftService.delete(req.tenant_id!, id);
  }

  @Post('users/:userId')
  @RequirePermissions('shift.manage')
  async assignShift(
    @Req() req: AppRequest,
    @Param('userId') userId: string,
    @Body() payload: AssignShiftDto,
  ) {
    return this.shiftService.assignShiftToUser(req.tenant_id!, userId, payload);
  }

  @Put('assignments/:id')
  @RequirePermissions('shift.manage')
  async updateAssignment(
    @Req() req: AppRequest,
    @Param('id') id: string,
    @Body() payload: AssignShiftDto,
  ) {
    return this.shiftService.updateAssignment(req.tenant_id!, id, payload);
  }
}
