import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';

export interface SendVoucherWAParams {
  buyerPhone: string;
  buyerName: string;
  voucherCode: string;
  productName: string;
  expiredAt: Date;
}

@Injectable()
export class WhatsappService {
  private readonly logger = new Logger(WhatsappService.name);

  constructor(
    private readonly configService: ConfigService,
    private readonly httpService: HttpService,
  ) {}

  /**
   * Normalisasi nomor telepon ke format internasional tanpa '+'
   * Contoh: 08123456789 → 628123456789
   */
  private normalizePhone(phone: string): string {
    const cleaned = phone.replace(/\D/g, '');
    if (cleaned.startsWith('0')) return '62' + cleaned.substring(1);
    if (cleaned.startsWith('62')) return cleaned;
    return '62' + cleaned;
  }

  /**
   * Format tanggal ke format Indonesia yang mudah dibaca
   */
  private formatDate(date: Date): string {
    return (
      new Intl.DateTimeFormat('id-ID', {
        day: '2-digit',
        month: 'long',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        timeZone: 'Asia/Jakarta',
      }).format(date) + ' WIB'
    );
  }

  /**
   * Kirim kode voucher via WhatsApp menggunakan Message Template yang sudah approved
   * Tidak throw error agar tidak menggagalkan transaksi utama.
   */
  async sendVoucherCode(params: SendVoucherWAParams): Promise<boolean> {
    const { buyerPhone, buyerName, voucherCode, productName, expiredAt } = params;

    const phoneNumberId = this.configService.get<string>('WHATSAPP_PHONE_NUMBER_ID');
    const accessToken = this.configService.get<string>('WHATSAPP_ACCESS_TOKEN');
    const apiVersion = this.configService.get<string>('WHATSAPP_API_VERSION', 'v20.0');
    const templateName = this.configService.get<string>(
      'WHATSAPP_TEMPLATE_NAME',
      'voucher_kode_pembayaran',
    );
    const templateLanguage = this.configService.get<string>(
      'WHATSAPP_TEMPLATE_LANGUAGE',
      'id',
    );

    if (!phoneNumberId || !accessToken) {
      this.logger.warn('WhatsApp env belum dikonfigurasi (WHATSAPP_PHONE_NUMBER_ID / WHATSAPP_ACCESS_TOKEN). Skip kirim WA.');
      return false;
    }

    const toPhone = this.normalizePhone(buyerPhone);
    const formattedDate = this.formatDate(expiredAt);

    const url = `https://graph.facebook.com/${apiVersion}/${phoneNumberId}/messages`;

    const redeemBaseUrl = this.configService.get<string>('WHATSAPP_REDEEM_BASE_URL', '');
    const fullRedeemUrl = redeemBaseUrl ? `${redeemBaseUrl}${voucherCode}` : `https://paytronik.digitalpremium.id/redeem?code=${voucherCode}`;

    const payload = {
      messaging_product: 'whatsapp',
      to: toPhone,
      type: 'template',
      template: {
        name: templateName,
        language: { code: templateLanguage },
        components: [
          {
            type: 'body',
            parameters: [
              { type: 'text', text: voucherCode },    // {{1}} kode voucher
              { type: 'text', text: formattedDate },  // {{2}} tanggal expired (batas klaim)
              { type: 'text', text: fullRedeemUrl },  // {{3}} link redeem
            ],
          },
          // Tombol URL dinamis — tetap ditambahkan sebagai opsi klik cepat
          ...(redeemBaseUrl
            ? [
                {
                  type: 'button',
                  sub_type: 'url',
                  index: '0',
                  parameters: [
                    { type: 'text', text: voucherCode }, // suffix URL → ?code={{1}}
                  ],
                },
              ]
            : []),
        ],
      },
    };


    try {
      const response = await firstValueFrom(
        this.httpService.post(url, payload, {
          headers: {
            Authorization: `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
          },
        }),
      );

      const messageId = response.data?.messages?.[0]?.id;
      this.logger.log(`[WA] Terkirim ke ${toPhone} | Voucher: ${voucherCode} | Message ID: ${messageId}`);
      return true;
    } catch (error) {
      const errData = error?.response?.data;
      this.logger.error(
        `[WA] Gagal kirim ke ${toPhone} | Voucher: ${voucherCode} | Error: ${JSON.stringify(errData ?? error.message)}`,
      );
      return false;
    }
  }

  /**
   * Kirim pesan template hello_world untuk testing sandbox
   */
  async sendSandboxTest(toPhone: string): Promise<{ success: boolean; data?: any; error?: any }> {
    const phoneNumberId = this.configService.get<string>('WHATSAPP_PHONE_NUMBER_ID');
    const accessToken = this.configService.get<string>('WHATSAPP_ACCESS_TOKEN');
    const apiVersion = this.configService.get<string>('WHATSAPP_API_VERSION', 'v20.0');

    if (!phoneNumberId || !accessToken) {
      return { success: false, error: 'WHATSAPP_PHONE_NUMBER_ID atau WHATSAPP_ACCESS_TOKEN belum dikonfigurasi' };
    }

    const normalizedPhone = this.normalizePhone(toPhone);
    const url = `https://graph.facebook.com/${apiVersion}/${phoneNumberId}/messages`;

    const payload = {
      messaging_product: 'whatsapp',
      to: normalizedPhone,
      type: 'template',
      template: {
        name: 'hello_world',
        language: { code: 'en_US' },
      },
    };

    try {
      const response = await firstValueFrom(
        this.httpService.post(url, payload, {
          headers: {
            Authorization: `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
          },
        }),
      );
      this.logger.log(`[WA Sandbox Test] Berhasil kirim ke ${normalizedPhone}`);
      return { success: true, data: response.data };
    } catch (error) {
      const errData = error?.response?.data;
      this.logger.error(`[WA Sandbox Test] Gagal ke ${normalizedPhone}: ${JSON.stringify(errData ?? error.message)}`);
      return { success: false, error: errData ?? error.message };
    }
  }
}
