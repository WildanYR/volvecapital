import { Body, Controller, Delete, Get, Param, Post, Req, UseGuards } from '@nestjs/common';
import { Request } from 'express';
import { RequirePermissions } from 'src/guards/permissions.decorator';
import { BankAccountService } from './bank-account.service';
import { CreateBankAccountDto } from './dto/create-bank-account.dto';
import { VerifyOtpDto } from './dto/verify-otp.dto';

@Controller('bank-accounts')
export class BankAccountController {
  constructor(private readonly bankAccountService: BankAccountService) {}

  @Get()
  @RequirePermissions('wallet.view')
  async getAll(@Req() req: Request) {
    const tenantId = (req as any).tenant_id;
    return await this.bankAccountService.getAllVerified(tenantId);
  }

  @Post()
  @RequirePermissions('wallet.create')
  async addAccount(@Req() req: Request, @Body() dto: CreateBankAccountDto) {
    const tenantId = (req as any).tenant_id;
    return await this.bankAccountService.initiateAdd(tenantId, dto);
  }

  @Post(':id/verify')
  @RequirePermissions('wallet.edit')
  async verifyOtp(
    @Req() req: Request,
    @Param('id') id: string,
    @Body() dto: VerifyOtpDto,
  ) {
    const tenantId = (req as any).tenant_id;
    return await this.bankAccountService.verifyOtp(tenantId, id, dto);
  }

  @Delete(':id')
  @RequirePermissions('wallet.delete')
  async deleteAccount(@Req() req: Request, @Param('id') id: string) {
    const tenantId = (req as any).tenant_id;
    return await this.bankAccountService.delete(tenantId, id);
  }
}
