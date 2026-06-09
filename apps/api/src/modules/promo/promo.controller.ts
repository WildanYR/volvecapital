import {
  Body,
  Controller,
  Delete,
  Get,
  Headers,
  Param,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import { RequirePermissions } from 'src/guards/permissions.decorator';
import { BaseGetAllUrlQuery } from '../utility/types/base-get-all-url-query.type';
import { CreatePromoCodeDto, UpdatePromoCodeDto } from './dto/create-promo-code.dto';
import { PromoService } from './promo.service';

@Controller('promo')
export class PromoController {
  constructor(private readonly promoService: PromoService) {}

  @Get()
  @RequirePermissions('voucher.view')
  async findAll(
    @Headers('x-tenant-id') tenantId: string,
    @Query() pagination?: BaseGetAllUrlQuery,
  ) {
    return await this.promoService.findAll(tenantId, pagination);
  }

  @Get(':id')
  @RequirePermissions('voucher.view')
  async findOne(
    @Headers('x-tenant-id') tenantId: string,
    @Param('id') id: string,
  ) {
    return await this.promoService.findOne(tenantId, id);
  }

  @Post()
  @RequirePermissions('voucher.create')
  async create(
    @Headers('x-tenant-id') tenantId: string,
    @Body() dto: CreatePromoCodeDto,
  ) {
    return await this.promoService.create(tenantId, dto);
  }

  @Patch(':id')
  @RequirePermissions('voucher.edit')
  async update(
    @Headers('x-tenant-id') tenantId: string,
    @Param('id') id: string,
    @Body() dto: UpdatePromoCodeDto,
  ) {
    return await this.promoService.update(tenantId, id, dto);
  }

  @Delete(':id')
  @RequirePermissions('voucher.delete')
  async remove(
    @Headers('x-tenant-id') tenantId: string,
    @Param('id') id: string,
  ) {
    return await this.promoService.remove(tenantId, id);
  }
}
