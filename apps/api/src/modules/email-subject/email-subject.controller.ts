import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
  Query,
  Request,
  UsePipes,
} from '@nestjs/common';
import { AtLeastOnePropertyPipe } from 'src/pipes/at-least-one-property.pipe';
import { AppRequest } from 'src/types/app-request.type';
import { PaginationProvider } from '../utility/pagination.provider';
import { CreateEmailSubjectDto } from './dto/create-email-subject.dto';
import { GetAllEmailSubjectQueryUrlDto } from './dto/get-all-email-subject.dto';
import { UpdateEmailSubjectDto } from './dto/update-email-subject.dto';
import { EmailSubjectService } from './email-subject.service';

@Controller('email-subject')
export class EmailSubjectController {
  constructor(
    private readonly emailSubjectService: EmailSubjectService,
    private readonly paginationProvider: PaginationProvider,
  ) {}

  @Get()
  findAll(
    @Query() query: GetAllEmailSubjectQueryUrlDto,
    @Request() request: AppRequest,
  ) {
    const { pagination, filter }
      = this.paginationProvider.separateUrlParameter(query);
    return this.emailSubjectService.findAll(request.tenant_id!, pagination, filter);
  }

  @Get(':id')
  findById(@Param('id') id: string, @Request() request: AppRequest) {
    return this.emailSubjectService.findOne(request.tenant_id!, id);
  }

  @Post()
  create(
    @Body() createEmailSubjectDto: CreateEmailSubjectDto,
    @Request() request: AppRequest,
  ) {
    return this.emailSubjectService.create(request.tenant_id!, createEmailSubjectDto);
  }

  @Patch(':id')
  @UsePipes(AtLeastOnePropertyPipe)
  update(
    @Param('id') emailSubjectId: string,
    @Body() updateEmailSubjectDto: UpdateEmailSubjectDto,
    @Request() request: AppRequest,
  ) {
    return this.emailSubjectService.update(
      request.tenant_id!,
      emailSubjectId,
      updateEmailSubjectDto,
    );
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(@Param('id') emailSubjectId: string, @Request() request: AppRequest) {
    return this.emailSubjectService.remove(request.tenant_id!, emailSubjectId);
  }
}
