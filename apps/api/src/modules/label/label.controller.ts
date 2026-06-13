import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Query,
  Request,
} from '@nestjs/common';
import { RequirePermissions } from 'src/guards/permissions.decorator';
import { AppRequest } from 'src/types/app-request.type';
import { CreateLabelDto } from './dto/create-label.dto';
import { LabelService } from './label.service';

@Controller('labels')
export class LabelController {
  constructor(private readonly labelService: LabelService) {}

  @Post()
  @RequirePermissions('account.edit')
  create(@Body() createLabelDto: CreateLabelDto, @Request() request: AppRequest) {
    return this.labelService.create(request.tenant_id!, createLabelDto);
  }

  @Get()
  @RequirePermissions('account.view')
  findAll(@Query('product_variant_id') productVariantId: string, @Request() request: AppRequest) {
    return this.labelService.findAll(request.tenant_id!, productVariantId);
  }

  @Delete(':id')
  @RequirePermissions('account.edit')
  remove(@Param('id') id: string, @Request() request: AppRequest) {
    return this.labelService.remove(request.tenant_id!, id);
  }
}
