import { Module } from '@nestjs/common';
import { UtilityModule } from '../utility/utility.module';
import { StatisticController } from './statistic.controller';
import { StatisticService } from './statistic.service';

@Module({
  imports: [UtilityModule],
  providers: [StatisticService],
  controllers: [StatisticController],
})
export class StatisticModule {}
