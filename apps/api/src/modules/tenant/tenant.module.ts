import { Module } from '@nestjs/common';
import { UtilityModule } from '../utility/utility.module';
import { TenantController } from './tenant.controller';
import { TenantService } from './tenant.service';
import { TenantProvisioningService } from './tenant-provisioning.service';

@Module({
  imports: [UtilityModule],
  providers: [TenantService, TenantProvisioningService],
  controllers: [TenantController],
  exports: [TenantService, TenantProvisioningService],
})
export class TenantModule {}
