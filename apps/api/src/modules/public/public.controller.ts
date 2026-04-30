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
import { RegisterTenantDto } from './dto/register-tenant.dto';
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
    // For DOKU notifications, extract tenantId from order.invoice_number
    // Format: VC-TENANTID-TIMESTAMP
    const orderId = body.order?.invoice_number || body.order_id || '';
    const parts = orderId.split('-');
    
    console.log(`[PaymentNotify] Incoming: ${orderId}, Body: ${JSON.stringify(body)}`);

    if (parts.length < 2) {
      console.error(`[PaymentNotify] Invalid order_id format: ${orderId}`);
      throw new BadRequestException('Invalid order_id format');
    }

    const tenantId = parts[1].toLowerCase();
    console.log(`[PaymentNotify] Extracted Tenant: ${tenantId}`);
    return this.publicService.handlePaymentNotify(tenantId, body);
  }

  @Get('payment/status/:order_id')
  checkPaymentStatus(
    @Headers() headers: any,
    @Param('order_id') orderId: string,
  ) {
    let tenantId = '';
    
    // 1. Try to extract from orderId (VC-TENANT-TIMESTAMP)
    const parts = orderId.split('-');
    if (parts.length >= 2) {
      tenantId = parts[1].toLowerCase();
    } else {
      // 2. Fallback to headers
      const host = headers.host || '';
      const xTenantId = headers['x-tenant-id'];
      tenantId = this.getTenantId(host, xTenantId);
    }
    
    return this.publicService.checkPaymentStatus(tenantId, orderId);
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

  @Get('email-access/:token')
  getEmailAccess(
    @Headers() headers: any,
    @Param('token') token: string,
  ) {
    const host = headers.host || '';
    const xTenantId = headers['x-tenant-id'];
    const tenantId = this.getTenantId(host, xTenantId);
    return this.publicService.getEmailAccess(tenantId, token);
  }

  @Get('tutorial')
  getTutorials(@Headers() headers: any) {
    const host = headers.host || '';
    const xTenantId = headers['x-tenant-id'];
    const tenantId = this.getTenantId(host, xTenantId);
    return this.publicService.getTutorials(tenantId);
  }

  @Get('tutorial/:slug')
  getTutorialBySlug(
    @Headers() headers: any,
    @Param('slug') slug: string,
  ) {
    const host = headers.host || '';
    const xTenantId = headers['x-tenant-id'];
    const tenantId = this.getTenantId(host, xTenantId);
    return this.publicService.getTutorialBySlug(tenantId, slug);
  }

  @Post('tenant/register')
  async registerTenant(@Body() data: RegisterTenantDto) {
    return await this.publicService.registerTenant(data);
  }

  @Post('auth/forgot-password')
  async forgotPassword(@Body('email') email: string) {
    return await this.publicService.forgotPassword(email);
  }

  @Post('auth/reset-password')
  async resetPassword(@Body() data: any) {
    return await this.publicService.resetPassword(data.token, data.password);
  }
}
