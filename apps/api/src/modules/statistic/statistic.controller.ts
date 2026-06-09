import { Controller, Get, Query, Request } from '@nestjs/common';
import { AppRequest } from 'src/types/app-request.type';
import { StatisticService } from './statistic.service';

@Controller('statistic')
export class StatisticController {
  constructor(private readonly statisticService: StatisticService) {}

  @Get()
  getAllStatistic(
    @Request() request: AppRequest,
    @Query('range') range?: string,
  ) {
    return this.statisticService.getAllStatistic(request.tenant_id!, range || 'month');
  }
}
