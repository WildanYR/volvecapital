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
import { BaseGetAllUrlQuery } from '../utility/types/base-get-all-url-query.type';
import { CreatePromoCodeDto, UpdatePromoCodeDto } from './dto/create-promo-code.dto';
import { PromoService } from './promo.service';

@Controller('promo')
export class PromoController {
  constructor(private readonly promoService: PromoService) {}

  @Get()
  async findAll(
    @Headers('x-tenant-id') tenantId: string,
    @Query() pagination?: BaseGetAllUrlQuery,
  ) {
    return await this.promoService.findAll(tenantId, pagination);
  }

  @Get(':id')
  async findOne(
    @Headers('x-tenant-id') tenantId: string,
    @Param('id') id: string,
  ) {
    return await this.promoService.findOne(tenantId, id);
  }

  @Post()
  async create(
    @Headers('x-tenant-id') tenantId: string,
    @Body() dto: CreatePromoCodeDto,
  ) {
    return await this.promoService.create(tenantId, dto);
  }

  @Patch(':id')
  async update(
    @Headers('x-tenant-id') tenantId: string,
    @Param('id') id: string,
    @Body() dto: UpdatePromoCodeDto,
  ) {
    return await this.promoService.update(tenantId, id, dto);
  }

  @Delete(':id')
  async remove(
    @Headers('x-tenant-id') tenantId: string,
    @Param('id') id: string,
  ) {
    return await this.promoService.remove(tenantId, id);
  }
}
