import { Body, Controller, Get, Headers, Post, Query, UseGuards } from '@nestjs/common';
import { VcAuthGuard } from 'src/guards/vc-auth.guard';
import { VoucherService } from './voucher.service';

@Controller('voucher')
@UseGuards(VcAuthGuard)
export class VoucherController {
  constructor(private readonly voucherService: VoucherService) {}

  @Post('generate')
  async generate(
    @Headers('x-tenant-id') tenantId: string,
    @Body() dto: any,
  ) {
    return this.voucherService.generateManualVoucher(tenantId, dto);
  }

  @Get()
  async list(
    @Headers('x-tenant-id') tenantId: string,
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 10,
    @Query('search') search?: string,
    @Query('status') status?: string,
  ) {
    const offset = (page - 1) * limit;
    return this.voucherService.getVouchers(tenantId, { limit, offset, search, status });
  }

  @Get('statistics')
  async statistics(@Headers('x-tenant-id') tenantId: string) {
    return this.voucherService.getStatistics(tenantId);
  }
}
