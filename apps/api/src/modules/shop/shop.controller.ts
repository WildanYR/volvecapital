import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
} from '@nestjs/common';
import { ShopService } from './shop.service';
import { CreateShopDto } from './dto/create-shop.dto';
import { UpdateShopDto } from './dto/update-shop.dto';
import { RequirePermissions } from 'src/guards/permissions.decorator';
import { AppRequest } from 'src/types/app-request.type';
import { Request } from '@nestjs/common';

@Controller('shop')
export class ShopController {
  constructor(private readonly shopService: ShopService) {}

  @Post()
  @RequirePermissions('platform_product.create')
  create(@Body() createShopDto: CreateShopDto, @Request() req: AppRequest) {
    return this.shopService.create(req.tenant_id!, createShopDto);
  }

  @Get()
  @RequirePermissions('platform_product.view')
  findAll(@Request() req: AppRequest) {
    return this.shopService.findAll(req.tenant_id!);
  }

  @Get(':id')
  @RequirePermissions('platform_product.view')
  findOne(@Param('id') id: string, @Request() req: AppRequest) {
    return this.shopService.findOne(req.tenant_id!, id);
  }

  @Patch(':id')
  @RequirePermissions('platform_product.edit')
  update(@Param('id') id: string, @Body() updateShopDto: UpdateShopDto, @Request() req: AppRequest) {
    return this.shopService.update(req.tenant_id!, id, updateShopDto);
  }

  @Delete(':id')
  @RequirePermissions('platform_product.delete')
  remove(@Param('id') id: string, @Request() req: AppRequest) {
    return this.shopService.remove(req.tenant_id!, id);
  }
}
