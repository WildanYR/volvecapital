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
import { AccountService } from './account.service';
import { AddAccountCapitalDto } from './dto/add-account-capital.dto';
import { CreateAccountDto } from './dto/create-account.dto';
import { FreezeAccountDto } from './dto/freeze-account.dto';
import { GetAllAccountQueryUrlDto } from './dto/get-all-account.dto';
import { UpdateAccountDto } from './dto/update-account.dto';
import { BulkCreateAccountDto } from './dto/bulk-create-account.dto';
import { RequirePermissions } from 'src/guards/permissions.decorator';

@Controller('account')
export class AccountController {
  constructor(
    private readonly accountService: AccountService,
    private readonly paginationProvider: PaginationProvider,
  ) {}

  @Get()
  @RequirePermissions('account.view')
  findAll(
    @Query() query: GetAllAccountQueryUrlDto,
    @Request() request: AppRequest,
  ) {
    const { pagination, filter }
      = this.paginationProvider.separateUrlParameter(query);
    return this.accountService.findAll(request.tenant_id!, pagination, filter);
  }

  @Get('/count')
  @RequirePermissions('account.view')
  countStatusAccount(
    @Query('product_variant_id') productVariantId: string,
    @Query('product_id') productId: string,
    @Query('product_slug') productSlug: string,
    @Request() request: AppRequest,
  ) {
    return this.accountService.countStatusAccount(request.tenant_id!, {
      product_variant_id: productVariantId,
      product_id: productId,
      product_slug: productSlug,
    });
  }

  @Get('pending-topups')
  @RequirePermissions('account.view')
  getPendingTopups(@Request() request: AppRequest) {
    return this.accountService.getPendingTopups(request.tenant_id!);
  }

  @Get(':id')
  @RequirePermissions('account.view')
  findById(@Param('id') id: string, @Request() request: AppRequest) {
    return this.accountService.findOne(request.tenant_id!, id);
  }

  @Get(':id/financial-details')
  @RequirePermissions('account.view')
  getFinancialDetails(@Param('id') id: string, @Request() request: AppRequest) {
    return this.accountService.getFinancialDetails(request.tenant_id!, id);
  }

  @Post()
  @RequirePermissions('account.edit')
  create(
    @Body() createAccountDto: CreateAccountDto,
    @Request() request: AppRequest,
  ) {
    return this.accountService.create(request.tenant_id!, createAccountDto);
  }

  @Post('bulk')
  @RequirePermissions('account.edit')
  bulkCreate(
    @Body() bulkCreateDto: BulkCreateAccountDto,
    @Request() request: AppRequest,
  ) {
    return this.accountService.bulkCreate(request.tenant_id!, bulkCreateDto);
  }

  @Patch('bulk')
  @RequirePermissions('account.edit')
  bulkAction(
    @Body() body: { ids: string[]; action: any },
    @Request() request: AppRequest,
  ) {
    return this.accountService.bulkAction(request.tenant_id!, body.ids, body.action);
  }

  @Patch(':id')
  @UsePipes(AtLeastOnePropertyPipe)
  @RequirePermissions('account.edit')
  update(
    @Param('id') accountId: string,
    @Body() updateAccountDto: UpdateAccountDto,
    @Request() request: AppRequest,
  ) {
    return this.accountService.update(
      request.tenant_id!,
      accountId,
      updateAccountDto,
    );
  }


  @Patch(':id/freeze')
  @HttpCode(HttpStatus.NO_CONTENT)
  @RequirePermissions('account.edit')
  async freezeAccount(
    @Param('id') accountId: string,
    @Body() freezeAccountDto: FreezeAccountDto,
    @Request() request: AppRequest,
  ) {
    await this.accountService.freezeAccount(
      request.tenant_id!,
      accountId,
      freezeAccountDto,
    );
  }

  @Patch(':id/unfreeze')
  @HttpCode(HttpStatus.NO_CONTENT)
  @RequirePermissions('account.edit')
  async unfreezeAccount(
    @Param('id') accountId: string,
    @Request() request: AppRequest,
  ) {
    await this.accountService.clearFreezeAccount(request.tenant_id!, accountId);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @RequirePermissions('account.delete')
  remove(@Param('id') accountId: string, @Request() request: AppRequest) {
    return this.accountService.remove(request.tenant_id!, accountId);
  }

  @Post(':id/capital')
  @RequirePermissions('account.edit')
  addCapital(
    @Param('id') id: string,
    @Body() addAccountCapitalDto: AddAccountCapitalDto,
    @Request() request: AppRequest,
  ) {
    return this.accountService.addCapital(
      request.tenant_id!,
      id,
      addAccountCapitalDto,
    );
  }

  @Post(':id/reset')
  @RequirePermissions('account.edit')
  resetAccount(@Param('id') id: string, @Request() request: AppRequest) {
    return this.accountService.triggerReset(request.tenant_id!, id);
  }

  @Post(':id/reload')
  @RequirePermissions('account.edit')
  reloadAccount(@Param('id') id: string, @Request() request: AppRequest) {
    return this.accountService.triggerReload(request.tenant_id!, id);
  }

  @Post(':id/upgrade')
  @RequirePermissions('account.edit')
  upgradeAccount(@Param('id') id: string, @Request() request: AppRequest) {
    return this.accountService.triggerUpgrade(request.tenant_id!, id);
  }

  @Post(':id/login-tv')
  @RequirePermissions('account.edit')
  loginTv(@Param('id') id: string, @Request() request: AppRequest) {
    return this.accountService.triggerLoginTv(request.tenant_id!, id);
  }

  @Post(':id/request-topup')
  @RequirePermissions('account.edit')
  requestTopup(
    @Param('id') id: string,
    @Body() body: { email: string; billing: string; taskId: string },
    @Request() request: AppRequest,
  ) {
    return this.accountService.registerPendingTopup(request.tenant_id!, id, body);
  }
}
