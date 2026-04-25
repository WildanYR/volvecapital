import { Body, Controller, Get, Headers, Post, UseGuards } from '@nestjs/common';
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
  async list(@Headers('x-tenant-id') tenantId: string) {
    return this.voucherService.getVouchers(tenantId);
  }
}
