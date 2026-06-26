import { Body, Controller, Delete, Get, Headers, Param, Post, Put } from '@nestjs/common';
import { RequirePermissions } from 'src/guards/permissions.decorator';
import { CreateManualBookCategoryDto } from './dto/create-manual-book-category.dto';
import { UpdateManualBookCategoryDto } from './dto/update-manual-book-category.dto';
import { ManualBookCategoryService } from './manual-book-category.service';

@Controller('manual-book-category')
export class ManualBookCategoryController {
  constructor(private readonly manualBookCategoryService: ManualBookCategoryService) {}

  @Post()
  @RequirePermissions('manualbook.create')
  create(@Headers('x-tenant-id') tenantId: string, @Body() createDto: CreateManualBookCategoryDto) {
    return this.manualBookCategoryService.create(tenantId, createDto);
  }

  @Get()
  @RequirePermissions('manualbook.view')
  findAll(@Headers('x-tenant-id') tenantId: string) {
    return this.manualBookCategoryService.findAll(tenantId);
  }

  @Get(':id')
  @RequirePermissions('manualbook.view')
  findOne(@Headers('x-tenant-id') tenantId: string, @Param('id') id: string) {
    return this.manualBookCategoryService.findOne(tenantId, id);
  }

  @Put(':id')
  @RequirePermissions('manualbook.edit')
  update(@Headers('x-tenant-id') tenantId: string, @Param('id') id: string, @Body() updateDto: UpdateManualBookCategoryDto) {
    return this.manualBookCategoryService.update(tenantId, id, updateDto);
  }

  @Delete(':id')
  @RequirePermissions('manualbook.delete')
  remove(@Headers('x-tenant-id') tenantId: string, @Param('id') id: string) {
    return this.manualBookCategoryService.remove(tenantId, id);
  }
}
