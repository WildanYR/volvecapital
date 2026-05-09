import { Module } from '@nestjs/common';
import { DatabaseModule } from 'src/database/database.module';
import { UtilityModule } from '../utility/utility.module';
import { PromoController } from './promo.controller';
import { PromoService } from './promo.service';
import { PublicPromoController } from './public-promo.controller';

@Module({
  imports: [DatabaseModule, UtilityModule],
  controllers: [PromoController, PublicPromoController],
  providers: [PromoService],
  exports: [PromoService],
})
export class PromoModule {}
