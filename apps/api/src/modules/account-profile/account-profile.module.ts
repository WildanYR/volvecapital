import { Module } from '@nestjs/common';
import { UtilityModule } from '../utility/utility.module';
import { AccountProfileController } from './account-profile.controller';
import { AccountProfileService } from './account-profile.service';

@Module({
  imports: [UtilityModule],
  providers: [AccountProfileService],
  controllers: [AccountProfileController],
})
export class AccountProfileModule {}
