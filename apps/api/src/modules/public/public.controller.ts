import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Headers,
  BadRequestException,
} from '@nestjs/common';
import { PublicRoute } from 'src/guards/public-route.decorator';
import { CreatePaymentDto } from './dto/create-payment.dto';
import { RedeemVoucherDto } from './dto/redeem-voucher.dto';
import { PublicService } from './public.service';

@Controller('public')
@PublicRoute()
export class PublicController {
  constructor(private readonly publicService: PublicService) {}

  private getTenantId(host: string, xTenantId?: string): string {
    // 1. Priority: x-tenant-id header (sent by frontend)
    if (xTenantId) return xTenantId;

    // 2. Fallback: Host header subdomain
    if (!host) throw new BadRequestException('Missing host or x-tenant-id header');
    
    const parts = host.split('.');
    if (parts.length >= 2) {
      const subdomain = parts[0].split(':')[0];
      if (subdomain !== 'localhost' && subdomain !== 'www') {
        return subdomain;
      }
    }

    throw new BadRequestException('Tenant ID tidak ditemukan di header');
  }

  @Get('product')
  getProducts(@Headers() headers: any) {
    const host = headers.host || '';
    const xTenantId = headers['x-tenant-id'];
    const tenantId = this.getTenantId(host, xTenantId);
    return this.publicService.getProducts(tenantId);
  }

  @Get('settings')
  getSettings(@Headers() headers: any) {
    const host = headers.host || '';
    const xTenantId = headers['x-tenant-id'];
    const tenantId = this.getTenantId(host, xTenantId);
    return this.publicService.getSettings(tenantId);
  }

  @Post('payment/create')
  createPayment(
    @Headers() headers: any,
    @Body() dto: CreatePaymentDto,
  ) {
    const host = headers.host || '';
    const xTenantId = headers['x-tenant-id'];
    const tenantId = this.getTenantId(host, xTenantId);
    return this.publicService.createPayment(tenantId, dto);
  }

  @Post('payment/notify')
  handleNotify(
    @Body() body: any,
  ) {
    // For notifications, always extract tenantId from order_id 
    // Format: VC-TENANTID-TIMESTAMP
    const orderId = body.order_id ?? '';
    const parts = orderId.split('-');
    
    if (parts.length < 2) {
      throw new BadRequestException('Invalid order_id format');
    }

    const tenantId = parts[1].toLowerCase();
    return this.publicService.handlePaymentNotify(tenantId, body);
  }

  @Get('voucher/stock')
  getStockStatus(@Headers() headers: any) {
    const host = headers.host || '';
    const xTenantId = headers['x-tenant-id'];
    const tenantId = this.getTenantId(host, xTenantId);
    return this.publicService.getStockStatus(tenantId);
  }

  @Get('voucher/:code')
  getVoucher(
    @Headers() headers: any,
    @Param('code') code: string,
  ) {
    const host = headers.host || '';
    const xTenantId = headers['x-tenant-id'];
    const tenantId = this.getTenantId(host, xTenantId);
    return this.publicService.getVoucher(tenantId, code);
  }

  @Post('voucher/redeem')
  redeemVoucher(
    @Headers() headers: any,
    @Body() dto: RedeemVoucherDto,
  ) {
    const host = headers.host || '';
    const xTenantId = headers['x-tenant-id'];
    const tenantId = this.getTenantId(host, xTenantId);
    return this.publicService.redeemVoucher(tenantId, dto);
  }
}
