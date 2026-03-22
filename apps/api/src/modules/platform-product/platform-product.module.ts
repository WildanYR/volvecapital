import { Module } from '@nestjs/common';
import { UtilityModule } from '../utility/utility.module';
import { PlatformProductController } from './platform-product.controller';
import { PlatformProductService } from './platform-product.service';

@Module({
  imports: [UtilityModule],
  providers: [PlatformProductService],
  controllers: [PlatformProductController],
})
export class PlatformProductModule {}
