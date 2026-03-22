import { Body, Controller, Get, Post, Query, Request } from '@nestjs/common';
import { AppRequest } from 'src/types/app-request.type';
import { PaginationProvider } from '../utility/pagination.provider';
import { CreateLogDto } from './dto/create-log.dto';
import { GetLogQueryDto } from './dto/get-log-query.dto';
import { SyslogService } from './syslog.service';

@Controller('log')
export class LoggerController {
  constructor(private readonly syslogService: SyslogService, private readonly paginationProvider: PaginationProvider) {}

  @Get()
  getLogWithPagination(
    @Query() query: GetLogQueryDto,
    @Request() request: AppRequest
  ) {
    const { pagination, filter } = this.paginationProvider.separateUrlParameter(query);
    return this.syslogService.getLogWithPagination(request.tenant_id!, pagination, filter);
  }

  @Get('/sys')
  getSyslogWithPagination(@Query() query: GetLogQueryDto) {
    const { pagination, filter } = this.paginationProvider.separateUrlParameter(query);
    return this.syslogService.getSyslogWithPagination(pagination, filter);
  }

  @Post()
  async logToDb(
    @Body() createLogDto: CreateLogDto,
    @Request() request: AppRequest
  ) {
    await this.syslogService.logToDb(request.tenant_id!, createLogDto);
  }
}
