import { Module } from '@nestjs/common';
import { UtilityModule } from '../utility/utility.module';
import { TenantController } from './tenant.controller';
import { TenantService } from './tenant.service';

@Module({
  imports: [UtilityModule],
  providers: [TenantService],
  controllers: [TenantController],
})
export class TenantModule {}
