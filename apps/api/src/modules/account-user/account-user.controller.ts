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
import { AccountUserService } from './account-user.service';
import { CreateAccountUserDto } from './dto/create-account-user.dto';
import { GetAllAccountUserQueryUrlDto } from './dto/get-all-account-user.dto';
import { UpdateAccountUserDto } from './dto/update-account-user.dto';

@Controller('account-user')
export class AccountUserController {
  constructor(
    private readonly accountUserService: AccountUserService,
    private readonly paginationProvider: PaginationProvider,
  ) {}

  @Get()
  findAll(
    @Query() query: GetAllAccountUserQueryUrlDto,
    @Request() request: AppRequest,
  ) {
    const { pagination, filter }
      = this.paginationProvider.separateUrlParameter(query);
    return this.accountUserService.findAll(
      request.tenant_id!,
      pagination,
      filter,
    );
  }

  @Get(':id')
  findById(@Param('id') id: string, @Request() request: AppRequest) {
    return this.accountUserService.findOne(request.tenant_id!, id);
  }

  @Post()
  create(
    @Body() createAccountUserDto: CreateAccountUserDto,
    @Request() request: AppRequest,
  ) {
    return this.accountUserService.create(
      request.tenant_id!,
      createAccountUserDto,
    );
  }

  @Patch(':id')
  @UsePipes(AtLeastOnePropertyPipe)
  update(
    @Param('id') accountUserId: string,
    @Body() updateAccountUserDto: UpdateAccountUserDto,
    @Request() request: AppRequest,
  ) {
    return this.accountUserService.update(
      request.tenant_id!,
      accountUserId,
      updateAccountUserDto,
    );
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(@Param('id') accountUserId: string, @Request() request: AppRequest) {
    return this.accountUserService.remove(request.tenant_id!, accountUserId);
  }

  // TODO: move to other account
}
