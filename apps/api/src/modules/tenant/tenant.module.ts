import { Module } from '@nestjs/common';
import { UtilityModule } from '../utility/utility.module';
import { TenantProvisioningService } from './tenant-provisioning.service';
import { TenantController } from './tenant.controller';
import { TenantService } from './tenant.service';

@Module({
  imports: [UtilityModule],
  providers: [TenantService, TenantProvisioningService],
  controllers: [TenantController],
  exports: [TenantService, TenantProvisioningService],
})
export class TenantModule {}
