import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';
import { TaskQueueService } from '../task-queue/task-queue.service';

export interface SendVoucherWAParams {
  buyerPhone: string;
  buyerName: string;
  voucherCode: string;
  productName: string;
  expiredAt: Date;
  tenantId?: string;
}

@Injectable()
export class WhatsappService {
  private readonly logger = new Logger(WhatsappService.name);

  constructor(
    private readonly configService: ConfigService,
    private readonly httpService: HttpService,
    private readonly taskQueueService: TaskQueueService,
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
    const { buyerPhone, buyerName, voucherCode, productName, expiredAt, tenantId } = params;
    const toPhone = this.normalizePhone(buyerPhone);
    const formattedDate = this.formatDate(expiredAt);

    const redeemBaseUrl = this.configService.get<string>('WHATSAPP_REDEEM_BASE_URL', '');
    const fullRedeemUrl = redeemBaseUrl ? `${redeemBaseUrl}${voucherCode}` : `https://paytronik.digitalpremium.id/redeem?code=${voucherCode}`;

    const waMessage = `𝐓𝐞𝐫𝐢𝐦𝐚 𝐤𝐚𝐬𝐢𝐡 𝐭𝐞𝐥𝐚𝐡 𝐦𝐞𝐥𝐚𝐤𝐮𝐤𝐚𝐧 𝐩𝐞𝐦𝐛𝐞𝐥𝐢𝐚𝐧 𝐝𝐢 𝐭𝐨𝐤𝐨 𝐤𝐚𝐦𝐢. 𝐁𝐞𝐫𝐢𝐤𝐮𝐭 𝐚𝐝𝐚𝐥𝐚𝐡 𝐝𝐞𝐭𝐚𝐢𝐥 𝐯𝐨𝐮𝐜𝐡𝐞𝐫 𝐀𝐧𝐝𝐚:

Kode Voucher	: ${voucherCode}
Batas Klaim	: ${formattedDate}
Link redeem	: ${fullRedeemUrl}

𝐊𝐀𝐋𝐎 𝐋𝐈𝐍𝐊 𝐆𝐀𝐁𝐈𝐒𝐀 𝐃𝐈 𝐊𝐋𝐈𝐊 𝐂𝐎𝐏𝐘 𝐀𝐉𝐀 𝐓𝐄𝐑𝐔𝐒 𝐏𝐀𝐒𝐓𝐄 𝐊𝐄 𝐖𝐄𝐁

Cara Redeem Voucher:
1. Klik link redeem di atas.
2. Kode voucher akan terisi otomatis.
3. Klik "Cek Sekarang", lalu klik "Aktivasi Voucher".
4. Jika berhasil, detail akun akan muncul seketika.`;

    try {
      await this.taskQueueService.upsert([{
        tenant_id: tenantId || 'master',
        execute_at: new Date(),
        subject_id: voucherCode,
        context: 'SEND_WA_MESSAGE',
        payload: JSON.stringify({
          phoneNumber: toPhone,
          message: waMessage
        })
      }]);
      this.logger.log(`[WA] Antrean terkirim ke ${toPhone} | Voucher: ${voucherCode}`);
      return true;
    } catch (error) {
      this.logger.error(`[WA] Gagal kirim ke ${toPhone} | Voucher: ${voucherCode} | Error: ${error.message}`);
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
