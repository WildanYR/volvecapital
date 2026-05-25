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
import { CreateExpenseDto } from './dto/create-expense.dto';
import { GetAllExpenseQueryUrlDto } from './dto/get-all-expense.dto';
import { UpdateExpenseDto } from './dto/update-expense.dto';
import { ExpenseService } from './expense.service';

@Controller('expense')
export class ExpenseController {
  constructor(
    private readonly accountExpenseService: ExpenseService,
    private readonly paginationProvider: PaginationProvider,
  ) {}

  @Get()
  findAll(
    @Query() query: GetAllExpenseQueryUrlDto,
    @Request() request: AppRequest,
  ) {
    const { pagination, filter }
      = this.paginationProvider.separateUrlParameter(query);
    return this.accountExpenseService.findAll(
      request.tenant_id!,
      pagination,
      filter,
    );
  }

  @Get(':id')
  findOne(@Param('id') id: string, @Request() request: AppRequest) {
    return this.accountExpenseService.findOne(request.tenant_id!, id);
  }

  @Post()
  create(
    @Body() createDto: CreateExpenseDto,
    @Request() request: AppRequest,
  ) {
    return this.accountExpenseService.create(request.tenant_id!, createDto);
  }

  @Patch(':id')
  @UsePipes(AtLeastOnePropertyPipe)
  update(
    @Param('id') id: string,
    @Body() updateDto: UpdateExpenseDto,
    @Request() request: AppRequest,
  ) {
    return this.accountExpenseService.update(request.tenant_id!, id, updateDto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(@Param('id') id: string, @Request() request: AppRequest) {
    return this.accountExpenseService.remove(request.tenant_id!, id);
  }
}
