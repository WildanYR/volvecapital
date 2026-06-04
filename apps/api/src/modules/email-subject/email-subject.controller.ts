import { Body, Controller, Delete, Get, Headers, Param, Post, Put } from '@nestjs/common';
import { RequirePermissions } from 'src/guards/permissions.decorator';
import { EmailSubjectService } from './email-subject.service';

@Controller('email-subject')
export class EmailSubjectController {
  constructor(private readonly emailSubjectService: EmailSubjectService) {}

  @Get()
  @RequirePermissions('email.view')
  findAll(@Headers('x-tenant-id') tenantId: string) {
    return this.emailSubjectService.findAll(tenantId);
  }

  @Post()
  @RequirePermissions('email.edit')
  create(
    @Headers('x-tenant-id') tenantId: string,
    @Body() data: { context: string; subject: string; is_public?: boolean }
  ) {
    return this.emailSubjectService.create(tenantId, data);
  }

  @Put(':id')
  @RequirePermissions('email.edit')
  update(
    @Headers('x-tenant-id') tenantId: string,
    @Param('id') id: string, 
    @Body() data: { context?: string; subject?: string; is_public?: boolean }
  ) {
    return this.emailSubjectService.update(tenantId, id, data);
  }

  @Delete(':id')
  @RequirePermissions('email.edit')
  remove(
    @Headers('x-tenant-id') tenantId: string,
    @Param('id') id: string
  ) {
    return this.emailSubjectService.remove(tenantId, id);
  }
}
