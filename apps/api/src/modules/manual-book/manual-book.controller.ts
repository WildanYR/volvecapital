import { Body, Controller, Delete, Get, Headers, Param, Post, Put, Query } from '@nestjs/common';
import { RequirePermissions } from 'src/guards/permissions.decorator';
import { CreateManualBookDto } from './dto/create-manual-book.dto';
import { UpdateManualBookDto } from './dto/update-manual-book.dto';
import { ManualBookService } from './manual-book.service';

@Controller('manual-book')
export class ManualBookController {
  constructor(private readonly manualBookService: ManualBookService) {}

  @Post()
  @RequirePermissions('manualbook.create')
  create(@Headers('x-tenant-id') tenantId: string, @Body() createDto: CreateManualBookDto) {
    return this.manualBookService.create(tenantId, createDto);
  }

  @Get()
  @RequirePermissions('manualbook.view')
  findAll(@Headers('x-tenant-id') tenantId: string, @Query() query: any) {
    return this.manualBookService.findAll(tenantId, query);
  }

  @Get(':id')
  @RequirePermissions('manualbook.view')
  findOne(@Headers('x-tenant-id') tenantId: string, @Param('id') id: string) {
    return this.manualBookService.findOne(tenantId, id);
  }

  @Get('slug/:slug')
  @RequirePermissions('manualbook.view')
  findBySlug(@Headers('x-tenant-id') tenantId: string, @Param('slug') slug: string) {
    return this.manualBookService.findBySlug(tenantId, slug);
  }

  @Put(':id')
  @RequirePermissions('manualbook.edit')
  update(@Headers('x-tenant-id') tenantId: string, @Param('id') id: string, @Body() updateDto: UpdateManualBookDto) {
    return this.manualBookService.update(tenantId, id, updateDto);
  }

  @Delete(':id')
  @RequirePermissions('manualbook.delete')
  remove(@Headers('x-tenant-id') tenantId: string, @Param('id') id: string) {
    return this.manualBookService.remove(tenantId, id);
  }
}
