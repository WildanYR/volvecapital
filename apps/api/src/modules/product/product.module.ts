import { Module } from '@nestjs/common';
import { UtilityModule } from '../utility/utility.module';
import { ProductController } from './product.controller';
import { ProductService } from './product.service';

@Module({
  imports: [UtilityModule],
  providers: [ProductService],
  controllers: [ProductController],
})
export class ProductModule {}
