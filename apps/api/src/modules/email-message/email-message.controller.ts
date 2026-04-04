import { Controller, Get, Query, Request } from '@nestjs/common';
import { AppRequest } from 'src/types/app-request.type';
import { PaginationProvider } from '../utility/pagination.provider';
import { GetEmailMessageQueryDto } from './dto/get-email-message-query.dto';
import { EmailMessageService } from './email-message.service';

@Controller('email-message')
export class EmailMessageController {
  constructor(
    private readonly emailMessageService: EmailMessageService,
    private readonly paginationProvider: PaginationProvider,
  ) {}

  @Get()
  findAll(
    @Query() query: GetEmailMessageQueryDto,
    @Request() request: AppRequest,
  ) {
    const { pagination, filter }
      = this.paginationProvider.separateUrlParameter(query);
    return this.emailMessageService.findAll(
      request.tenant_id!,
      pagination,
      filter,
    );
  }
}
