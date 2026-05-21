import { Controller, Get, Query, Request } from '@nestjs/common';
import { AppRequest } from 'src/types/app-request.type';
import { StatisticService, StatisticParams } from './statistic.service';

@Controller('statistic')
export class StatisticController {
  constructor(private readonly statisticService: StatisticService) {}

  @Get()
  getAllStatistic(
    @Request() request: AppRequest,
    @Query() query: StatisticParams,
  ) {
    return this.statisticService.getStatistic(request.tenant_id!, query);
  }
}
