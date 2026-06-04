import { Controller, Get, Post, Body, Param, UseGuards, Req, Query } from '@nestjs/common';
import { WithdrawalService } from './withdrawal.service';
import { CreateWithdrawalDto } from './dto/create-withdrawal.dto';
import { RequirePermissions } from 'src/guards/permissions.decorator';
import { Request } from 'express';

@Controller('withdrawals')
export class WithdrawalController {
  constructor(private readonly withdrawalService: WithdrawalService) {}

  @Get('balance')
  @RequirePermissions('wallet.view')
  async getBalance(@Req() req: Request) {
    const tenantId = (req as any).tenant_id;
    return await this.withdrawalService.getWalletBalance(tenantId);
  }

  @Get('wallet-transactions')
  @RequirePermissions('wallet.view')
  async getWalletTransactions(
    @Req() req: Request,
    @Query('type') type: 'available' | 'pending',
    @Query('page') page?: number,
    @Query('limit') limit?: number,
  ) {
    const tenantId = (req as any).tenant_id;
    return await this.withdrawalService.getWalletTransactions(tenantId, type, { page, limit });
  }

  @Get('history')
  @RequirePermissions('wallet.view')
  async getHistory(@Req() req: Request) {
    const tenantId = (req as any).tenant_id;
    return await this.withdrawalService.getHistory(tenantId);
  }

  @Post()
  @RequirePermissions('wallet.edit')
  async requestWithdrawal(@Req() req: Request, @Body() dto: CreateWithdrawalDto) {
    const tenantId = (req as any).tenant_id;
    return await this.withdrawalService.createRequest(tenantId, dto);
  }

  // --- Admin Endpoints ---

  @Get('admin/pending')
  @RequirePermissions('withdrawal.view')
  async getPendingRequests(@Req() req: Request) {
    return await this.withdrawalService.getPendingRequests();
  }

  @Post('admin/:tenantId/approve/:requestId')
  @RequirePermissions('withdrawal.edit')
  async approveRequest(
    @Req() req: Request,
    @Param('tenantId') tenantId: string,
    @Param('requestId') requestId: string
  ) {
    return await this.withdrawalService.approveRequest(tenantId, requestId);
  }
}
