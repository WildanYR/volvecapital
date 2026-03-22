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
import { CreateEmailDto } from './dto/create-email.dto';
import { GetAllEmailQueryUrlDto } from './dto/get-all-email.dto';
import { UpdateEmailDto } from './dto/update-email.dto';
import { EmailService } from './email.service';

@Controller('email')
export class EmailController {
  constructor(
    private readonly emailService: EmailService,
    private readonly paginationProvider: PaginationProvider,
  ) {}

  @Get()
  findAll(
    @Query() query: GetAllEmailQueryUrlDto,
    @Request() request: AppRequest,
  ) {
    const { pagination, filter }
      = this.paginationProvider.separateUrlParameter(query);
    return this.emailService.findAll(request.tenant_id!, pagination, filter);
  }

  @Get(':id')
  findById(@Param('id') id: string, @Request() request: AppRequest) {
    return this.emailService.findOne(request.tenant_id!, id);
  }

  @Post()
  create(
    @Body() createEmailDto: CreateEmailDto,
    @Request() request: AppRequest,
  ) {
    return this.emailService.create(request.tenant_id!, createEmailDto);
  }

  @Patch(':id')
  @UsePipes(AtLeastOnePropertyPipe)
  update(
    @Param('id') emailId: string,
    @Body() updateEmailDto: UpdateEmailDto,
    @Request() request: AppRequest,
  ) {
    return this.emailService.update(
      request.tenant_id!,
      emailId,
      updateEmailDto,
    );
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(@Param('id') emailId: string, @Request() request: AppRequest) {
    return this.emailService.remove(request.tenant_id!, emailId);
  }
}
