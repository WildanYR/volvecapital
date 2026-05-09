import { Body, Controller, Headers, Post } from '@nestjs/common';
import { PublicRoute } from 'src/guards/public-route.decorator';
import { ValidatePromoCodeDto } from './dto/validate-promo-code.dto';
import { PromoService } from './promo.service';

@Controller('public/promo')
@PublicRoute()
export class PublicPromoController {
  constructor(private readonly promoService: PromoService) {}

  @Post('validate')
  async validate(
    @Headers('x-tenant-id') tenantId: string,
    @Body() dto: ValidatePromoCodeDto,
  ) {
    return await this.promoService.validate(tenantId, dto.code, dto.total_purchase, dto.product_variant_id);
  }
}
