import {
  Body,
  Controller,
  ForbiddenException,
  Get,
  HttpCode,
  Logger,
  Post,
  Query,
  Res,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Response } from 'express';
import { PublicRoute } from 'src/guards/public-route.decorator';
import { WhatsappService } from './whatsapp.service';

class SandboxTestDto {
  to: string;
}

/**
 * Controller untuk WhatsApp Business API.
 *
 * Endpoint testing (/whatsapp/test-*) tidak dilindungi auth untuk kemudahan test.
 * Endpoint webhook (/whatsapp/webhook) harus publik karena dipanggil server Meta.
 */
@Controller('whatsapp')
@PublicRoute()
export class WhatsappController {
  private readonly logger = new Logger(WhatsappController.name);

  constructor(
    private readonly whatsappService: WhatsappService,
    private readonly configService: ConfigService,
  ) {}

  // ─────────────────────────────────────────────────────────────
  //  WEBHOOK — Dipanggil oleh server Meta (HARUS publik / no auth)
  // ─────────────────────────────────────────────────────────────

  /**
   * GET /whatsapp/webhook
   *
   * Meta akan memanggil endpoint ini saat kamu klik "Verifikasi dan simpan"
   * di halaman Konfigurasi Webhooks Facebook Developer Console.
   *
   * Meta mengirim 3 query params:
   *   hub.mode         = "subscribe"
   *   hub.verify_token = token yang kamu set di console (harus cocok dengan .env)
   *   hub.challenge    = angka random yang HARUS dikembalikan sebagai plain text
   */
  @Get('webhook')
  verifyWebhook(
    @Query('hub.mode') mode: string,
    @Query('hub.verify_token') token: string,
    @Query('hub.challenge') challenge: string,
    @Res() res: Response,
  ): void {
    const verifyToken = this.configService.get<string>('WHATSAPP_WEBHOOK_VERIFY_TOKEN');

    this.logger.log(`[WA Webhook] Verifikasi | mode=${mode} | token_match=${token === verifyToken} | challenge=${challenge}`);

    if (mode === 'subscribe' && token === verifyToken) {
      this.logger.log('[WA Webhook] ✅ Verifikasi berhasil!');
      // WAJIB return challenge sebagai plain text (bukan JSON)
      res.status(200).send(challenge);
      return;
    }

    this.logger.warn('[WA Webhook] ❌ Token tidak cocok!');
    throw new ForbiddenException('Webhook verification failed');
  }

  /**
   * POST /whatsapp/webhook
   *
   * Meta mengirim notifikasi ke sini setiap kali ada event:
   * - Pesan terkirim (delivered)
   * - Pesan dibaca (read)
   * - Pesan gagal (failed)
   * - Pesan masuk dari pelanggan
   */
  @Post('webhook')
  @HttpCode(200)
  receiveWebhook(@Body() body: any): { status: string } {
    try {
      const changes = body?.entry?.[0]?.changes?.[0]?.value;
      if (!changes) return { status: 'ok' };

      // Log delivery status (delivered, read, failed, sent)
      const statuses = changes.statuses;
      if (statuses) {
        for (const status of statuses) {
          const logMsg = `[WA Webhook] Message ${status.id} → status: ${status.status} | recipient: ${status.recipient_id}`;
          if (status.status === 'failed') {
            this.logger.error(`${logMsg} | error: ${JSON.stringify(status.errors)}`);
          } else {
            this.logger.log(logMsg);
          }
        }
      }

      // Log pesan masuk dari pelanggan (jika ada)
      const messages = changes.messages;
      if (messages) {
        for (const msg of messages) {
          this.logger.log(`[WA Webhook] Pesan masuk dari ${msg.from}: ${msg.type}`);
        }
      }
    } catch (err) {
      this.logger.error('[WA Webhook] Error parsing webhook payload:', err);
    }

    // WAJIB return 200 OK ke Meta dalam 20 detik, apapun yang terjadi
    return { status: 'ok' };
  }

  // ─────────────────────────────────────────────────────────────
  //  TESTING ENDPOINTS (untuk development/sandbox)
  // ─────────────────────────────────────────────────────────────

  /**
   * POST /whatsapp/test-sandbox
   * Body: { "to": "628123456789" }
   * Kirim template hello_world (pre-approved, untuk test)
   */
  @Post('test-sandbox')
  async testSandbox(@Body() dto: SandboxTestDto) {
    const result = await this.whatsappService.sendSandboxTest(dto.to);
    return {
      message: result.success
        ? `Pesan sandbox berhasil dikirim ke ${dto.to}`
        : `Gagal mengirim pesan ke ${dto.to}`,
      ...result,
    };
  }

  /**
   * POST /whatsapp/test-voucher
   * Body: {
   *   "to": "628123456789",
   *   "buyerName": "John Doe",
   *   "voucherCode": "MNL-TESTABCD",
   *   "productName": "Netflix Premium 1 Bulan",
   *   "expiredAt": "2026-08-15T23:59:59.000Z"
   * }
   * Kirim template voucher_kode_pembayaran (harus sudah approved)
   */
  @Post('test-voucher')
  async testVoucher(
    @Body()
    dto: {
      to: string;
      buyerName: string;
      voucherCode: string;
      productName: string;
      expiredAt: string;
    },
  ) {
    const result = await this.whatsappService.sendVoucherCode({
      buyerPhone: dto.to,
      buyerName: dto.buyerName,
      voucherCode: dto.voucherCode,
      productName: dto.productName,
      expiredAt: new Date(dto.expiredAt),
    });

    return {
      message: result
        ? `Voucher WA berhasil dikirim ke ${dto.to}`
        : `Gagal mengirim voucher WA ke ${dto.to}`,
      success: result,
    };
  }
}
