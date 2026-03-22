import { Controller, Get, Request } from '@nestjs/common';
import { AppRequest } from 'src/types/app-request.type';
import { StatisticService } from './statistic.service';

@Controller('statistic')
export class StatisticController {
  constructor(private readonly statisticService: StatisticService) {}

  @Get()
  getAllStatistic(@Request() request: AppRequest) {
    return this.statisticService.getAllStatistic(request.tenant_id!);
  }
}
