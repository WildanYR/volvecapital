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
import { AccountProfileService } from './account-profile.service';
import { CreateAccountProfileDto } from './dto/create-account-profile.dto';
import { GetAllAccountProfileQueryUrlDto } from './dto/get-all-account-profile.dto';
import { UpdateAccountProfileDto } from './dto/update-account-profile.dto';

@Controller('account-profile')
export class AccountProfileController {
  constructor(
    private readonly accountProfileService: AccountProfileService,
    private readonly paginationProvider: PaginationProvider,
  ) {}

  @Get()
  findAll(
    @Query() query: GetAllAccountProfileQueryUrlDto,
    @Request() request: AppRequest,
  ) {
    const { pagination, filter }
      = this.paginationProvider.separateUrlParameter(query);
    return this.accountProfileService.findAll(
      request.tenant_id!,
      pagination,
      filter,
    );
  }

  @Get(':id')
  findById(@Param('id') id: string, @Request() request: AppRequest) {
    return this.accountProfileService.findOne(request.tenant_id!, id);
  }

  @Post()
  create(
    @Body() createAccountProfileDto: CreateAccountProfileDto,
    @Request() request: AppRequest,
  ) {
    return this.accountProfileService.create(
      request.tenant_id!,
      createAccountProfileDto,
    );
  }

  @Patch(':id')
  @UsePipes(AtLeastOnePropertyPipe)
  update(
    @Param('id') accountProfileId: string,
    @Body() updateAccountProfileDto: UpdateAccountProfileDto,
    @Request() request: AppRequest,
  ) {
    return this.accountProfileService.update(
      request.tenant_id!,
      accountProfileId,
      updateAccountProfileDto,
    );
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(
    @Param('id') accountProfileId: string,
    @Request() request: AppRequest,
  ) {
    return this.accountProfileService.remove(
      request.tenant_id!,
      accountProfileId,
    );
  }
}
