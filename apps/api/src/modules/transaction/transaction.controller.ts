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
import { CreateTransactionDto } from './dto/create-transaction.dto';
import { GetAllTransactionQueryUrlDto } from './dto/get-all-transaction.dto';
import { UpdateTransactionDto } from './dto/update-transaction.dto';
import { TransactionService } from './transaction.service';

@Controller('transaction')
export class TransactionController {
  constructor(
    private readonly transactionService: TransactionService,
    private readonly paginationProvider: PaginationProvider,
  ) {}

  @Get()
  findAll(
    @Query() query: GetAllTransactionQueryUrlDto,
    @Request() request: AppRequest,
  ) {
    const { pagination, filter }
      = this.paginationProvider.separateUrlParameter(query);
    return this.transactionService.findAll(
      request.tenant_id!,
      pagination,
      filter,
    );
  }

  @Get(':id')
  findById(@Param('id') id: string, @Request() request: AppRequest) {
    return this.transactionService.findOne(request.tenant_id!, id);
  }

  @Post()
  create(
    @Body() createTransactionDto: CreateTransactionDto,
    @Request() request: AppRequest,
  ) {
    return this.transactionService.create(
      request.tenant_id!,
      createTransactionDto,
    );
  }

  @Patch(':id')
  @UsePipes(AtLeastOnePropertyPipe)
  update(
    @Param('id') transactionId: string,
    @Body() updateTransactionDto: UpdateTransactionDto,
    @Request() request: AppRequest,
  ) {
    return this.transactionService.update(
      request.tenant_id!,
      transactionId,
      updateTransactionDto,
    );
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(@Param('id') transactionId: string, @Request() request: AppRequest) {
    return this.transactionService.remove(request.tenant_id!, transactionId);
  }
}
