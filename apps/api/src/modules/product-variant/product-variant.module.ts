import { Module } from '@nestjs/common';
import { UtilityModule } from '../utility/utility.module';
import { ProductVariantController } from './product-variant.controller';
import { ProductVariantService } from './product-variant.service';

@Module({
  imports: [UtilityModule],
  providers: [ProductVariantService],
  controllers: [ProductVariantController],
})
export class ProductVariantModule {}
