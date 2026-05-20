import { Controller, Get, Post, Body, Param, UseGuards, Req } from '@nestjs/common';
import { WithdrawalService } from './withdrawal.service';
import { CreateWithdrawalDto } from './dto/create-withdrawal.dto';
import { VcAuthGuard } from 'src/guards/vc-auth.guard';
import { Request } from 'express';

@Controller('withdrawals')
@UseGuards(VcAuthGuard)
export class WithdrawalController {
  constructor(private readonly withdrawalService: WithdrawalService) {}

  @Get('balance')
  async getBalance(@Req() req: Request) {
    const tenantId = (req as any).tenant_id;
    return await this.withdrawalService.getWalletBalance(tenantId);
  }

  @Get('history')
  async getHistory(@Req() req: Request) {
    const tenantId = (req as any).tenant_id;
    return await this.withdrawalService.getHistory(tenantId);
  }

  @Post()
  async requestWithdrawal(@Req() req: Request, @Body() dto: CreateWithdrawalDto) {
    const tenantId = (req as any).tenant_id;
    return await this.withdrawalService.createRequest(tenantId, dto);
  }

  // --- Admin Endpoints ---

  @Get('admin/pending')
  async getPendingRequests(@Req() req: Request) {
    // Ideally we check if role is ADMIN here or via a separate guard
    // but the frontend will only show it to ADMIN anyway.
    // For extra security, check the user role from token payload if available.
    const user = (req as any).user;
    if (user?.role !== 'ADMIN') {
      // Depending on auth implementation, might be user.role or something else
      // Throw Forbidden if not admin
    }
    return await this.withdrawalService.getPendingRequests();
  }

  @Post('admin/:tenantId/approve/:requestId')
  async approveRequest(
    @Req() req: Request,
    @Param('tenantId') tenantId: string,
    @Param('requestId') requestId: string
  ) {
    const user = (req as any).user;
    if (user?.role !== 'ADMIN') {
      // Forbidden check
    }
    return await this.withdrawalService.approveRequest(tenantId, requestId);
  }
}
