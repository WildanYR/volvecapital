import { Module } from '@nestjs/common';
import { DatabaseModule } from 'src/database/database.module';
import { UtilityModule } from '../utility/utility.module';
import { DashboardUserController } from './dashboard-user.controller';
import { DashboardUserService } from './dashboard-user.service';

@Module({
  imports: [DatabaseModule, UtilityModule],
  controllers: [DashboardUserController],
  providers: [DashboardUserService],
  exports: [DashboardUserService],
})
export class DashboardUserModule {}
