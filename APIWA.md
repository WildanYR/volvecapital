# 📱 WhatsApp Business API — Panduan Implementasi Pengiriman Kode Voucher

> Dokumentasi ini menjelaskan langkah-langkah lengkap untuk mengintegrasikan **WhatsApp Business API (Meta/Facebook)** ke dalam sistem VolveCaptial agar kode voucher dapat dikirimkan secara otomatis ke pelanggan via WhatsApp setelah pembayaran berhasil — selain via email yang sudah berjalan.

---

## 🗺️ Arsitektur Alur Sistem

```
Pelanggan Bayar → Payment Gateway Callback
       ↓
  NestJS API (transaction.service.ts / voucher.service.ts)
       ↓
  [EXISTING] Kirim Email (nodemailer)
  [NEW]      Kirim WA via WhatsApp Business API ← Akan kita tambahkan
       ↓
  Pelanggan terima kode voucher di WA + Email
```

---

## 📋 BAGIAN 1 — Setup di Facebook Developer / Meta Business

### 1.1 Persiapan Akun

Kamu butuh hal berikut sebelum mulai:

| Syarat | Status | Keterangan |
|--------|--------|------------|
| Akun Facebook Developer | ✅ Sudah ada | Terlihat di screenshot |
| WhatsApp Business Account (WABA) | ✅ Sudah terbuat | ID: `1025246497080126` |
| Phone Number ID | ✅ Sudah ada | ID: `12313659000067086` |
| Nomor WA Test | ✅ Sudah ada | `+1 (555) 141-4154` (nomor sandbox) |
| Nomor WA Bisnis ASLI | ❌ Belum | Perlu di-setup di Langkah 2 (Penyiapan Produksi) |

---

### 1.2 Generate Access Token (Permanent)

> ⚠️ Token yang di halaman "Langkah 1. Cobalah" bersifat SEMENTARA (expire 24 jam). Kamu perlu token permanen untuk production.

**Cara mendapatkan Token Permanen:**

1. Buka [Facebook Developer Console](https://developers.facebook.com/)
2. Masuk ke aplikasi kamu → **WhatsApp** → **API Setup**
3. Di bagian **"Step 1. Select phone numbers"**, klik **"Generate access token"**
4. **ATAU**, cara yang lebih baik (production):
   - Buka [Meta Business Suite](https://business.facebook.com/)
   - Pergi ke **System Users** → buat **System User** dengan role "Admin"
   - Generate token untuk System User tersebut dengan permission:
     - `whatsapp_business_messaging`
     - `whatsapp_business_management`
   - Token System User **tidak akan expire** (permanent token)

```bash
# Simpan token ini di .env aplikasi kamu
WHATSAPP_ACCESS_TOKEN=EAAxxxxxxxxxxxxxxxx...
WHATSAPP_PHONE_NUMBER_ID=12313659000067086
WHATSAPP_BUSINESS_ACCOUNT_ID=1025246497080126
```

---

### 1.3 Setup Message Template (WAJIB untuk Production)

> ⚠️ WhatsApp Business API **HANYA bisa mengirim pesan template** yang sudah diapprove Meta, kecuali dalam 24 jam setelah pelanggan menghubungi kamu duluan.

**Langkah membuat Template:**

1. Buka **Meta Business Suite** → **WhatsApp Manager**
2. Pilih Business Account kamu → **Manage** → **Message Templates**
3. Klik **"Create Template"**
4. Isi form berikut:

```
Category    : UTILITY  (untuk notifikasi transaksi)
Name        : voucher_kode_pembayaran   (huruf kecil, underscore)
Language    : Indonesian (id) / English (en_US)
```

5. **Buat isi template seperti ini:**

```
Header: 🎉 Pembayaran Berhasil!

Body:
Halo {{1}}, terima kasih telah melakukan pembelian di *VolveCaptial*!

Berikut detail voucher kamu:
🔑 *Kode Voucher* : {{2}}
📦 *Produk*       : {{3}}
⏰ *Berlaku hingga*: {{4}}

Cara menggunakan:
1. Buka aplikasi
2. Masukkan kode voucher di halaman checkout
3. Nikmati layanan kamu!

Jika ada kendala, balas pesan ini atau hubungi tim support kami.

Footer: VolveCaptial — Digital Services Platform
```

**Penjelasan variabel:**
- `{{1}}` = Nama pembeli (buyer_name)
- `{{2}}` = Kode voucher (voucher_code)
- `{{3}}` = Nama produk (product_name)
- `{{4}}` = Tanggal kadaluarsa (expired_at)

6. Submit → Tunggu approval Meta (biasanya **1-3 hari kerja**)
7. Setelah approved, catat **Template Name** dan **Language Code**

---

### 1.4 Tambahkan Nomor WhatsApp Bisnis Asli (Production)

1. Di Developer Console → **WhatsApp** → **API Setup**
2. Klik **"Langkah 2. Penyiapan produksi"** (terlihat di sidebar screenshot)
3. Klik **"Add phone number"**
4. Masukkan nomor WA bisnis kamu (pastikan nomor ini:
   - Belum terdaftar sebagai WA personal
   - Aktif dan bisa menerima SMS/Telepon untuk verifikasi OTP)
5. Verifikasi via SMS atau telepon
6. Setelah verified, catat **Phone Number ID** yang baru

---

### 1.5 Setup Webhook (Opsional tapi Direkomendasikan)

Webhook digunakan untuk menerima update status pesan (terkirim, dibaca, gagal).

1. Di Developer Console → **WhatsApp** → **Configuration** → **Webhooks**
2. Isi **Callback URL**: `https://yourdomain.com/api/webhook/whatsapp`
3. Isi **Verify Token**: string random (simpan di .env)
4. Subscribe ke events:
   - `messages` (pesan masuk)
   - `message_deliveries` (status pengiriman)

```bash
WHATSAPP_WEBHOOK_VERIFY_TOKEN=your_random_secret_token_here
```

---

## 📋 BAGIAN 2 — Implementasi di Kode NestJS (apps/api)

### 2.1 Struktur File yang Akan Dibuat

```
apps/api/src/modules/
├── whatsapp/                          ← [BARU] Module WhatsApp
│   ├── whatsapp.module.ts
│   ├── whatsapp.service.ts            ← Logic kirim WA
│   └── dto/
│       └── send-whatsapp.dto.ts
└── voucher/
    └── voucher.service.ts             ← [MODIFIKASI] Tambah panggil WA service
```

---

### 2.2 Install Package

```bash
pnpm --filter @volvecapital/api add @nestjs/axios axios
```

---

### 2.3 Update .env

Tambahkan ke file `apps/api/.env`:

```env
# ===== WhatsApp Business API =====
WHATSAPP_ACCESS_TOKEN=EAAxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
WHATSAPP_PHONE_NUMBER_ID=12313659000067086
WHATSAPP_BUSINESS_ACCOUNT_ID=1025246497080126
WHATSAPP_API_VERSION=v20.0
WHATSAPP_TEMPLATE_NAME=voucher_kode_pembayaran
WHATSAPP_TEMPLATE_LANGUAGE=id
```

Juga update `apps/api/.env.example` dengan key yang sama (tanpa value sensitif).

---

### 2.4 Buat WhatsApp Service

**File:** `apps/api/src/modules/whatsapp/whatsapp.service.ts`

```typescript
import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';

export interface SendVoucherWAParams {
  buyerPhone: string;      // Format: 628xxxxxxxxxx
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

  private normalizePhone(phone: string): string {
    const cleaned = phone.replace(/\D/g, '');
    if (cleaned.startsWith('0')) return '62' + cleaned.substring(1);
    if (cleaned.startsWith('62')) return cleaned;
    return '62' + cleaned;
  }

  private formatDate(date: Date): string {
    return new Intl.DateTimeFormat('id-ID', {
      day: '2-digit',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      timeZone: 'Asia/Jakarta',
    }).format(date) + ' WIB';
  }

  async sendVoucherCode(params: SendVoucherWAParams): Promise<boolean> {
    const { buyerPhone, buyerName, voucherCode, productName, expiredAt } = params;

    const phoneNumberId = this.configService.get<string>('WHATSAPP_PHONE_NUMBER_ID');
    const accessToken = this.configService.get<string>('WHATSAPP_ACCESS_TOKEN');
    const apiVersion = this.configService.get<string>('WHATSAPP_API_VERSION', 'v20.0');
    const templateName = this.configService.get<string>('WHATSAPP_TEMPLATE_NAME', 'voucher_kode_pembayaran');
    const templateLanguage = this.configService.get<string>('WHATSAPP_TEMPLATE_LANGUAGE', 'id');

    const toPhone = this.normalizePhone(buyerPhone);
    const formattedDate = this.formatDate(expiredAt);

    const url = `https://graph.facebook.com/${apiVersion}/${phoneNumberId}/messages`;

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
              { type: 'text', text: buyerName },
              { type: 'text', text: voucherCode },
              { type: 'text', text: productName },
              { type: 'text', text: formattedDate },
            ],
          },
        ],
      },
    };

    try {
      const response = await firstValueFrom(
        this.httpService.post(url, payload, {
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
          },
        }),
      );
      this.logger.log(`WA terkirim ke ${toPhone} | ID: ${response.data?.messages?.[0]?.id}`);
      return true;
    } catch (error) {
      const errData = error?.response?.data;
      this.logger.error(`Gagal kirim WA ke ${toPhone}: ${JSON.stringify(errData ?? error.message)}`);
      return false;
    }
  }
}
```

---

### 2.5 Buat WhatsApp Module

**File:** `apps/api/src/modules/whatsapp/whatsapp.module.ts`

```typescript
import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { ConfigModule } from '@nestjs/config';
import { WhatsappService } from './whatsapp.service';

@Module({
  imports: [HttpModule, ConfigModule],
  providers: [WhatsappService],
  exports: [WhatsappService],
})
export class WhatsappModule {}
```

---

### 2.6 Daftarkan di AppModule

**File:** `apps/api/src/app.module.ts` — tambahkan ke imports:

```typescript
import { WhatsappModule } from './modules/whatsapp/whatsapp.module';

@Module({
  imports: [
    // ... existing imports ...
    WhatsappModule, // ← TAMBAHKAN INI
  ],
})
export class AppModule {}
```

---

### 2.7 Modifikasi VoucherService

Di `apps/api/src/modules/voucher/voucher.service.ts`, tambahkan setelah `await transaction.commit();` di fungsi `generateManualVoucher()`:

```typescript
// Inject di constructor:
private readonly whatsappService: WhatsappService,

// Setelah await transaction.commit():
if (voucher.buyer_whatsapp) {
  const productFullName = `${(variant as any).product?.name ?? 'Produk'} - ${variant.name}`;
  this.whatsappService.sendVoucherCode({
    buyerPhone: voucher.buyer_whatsapp,
    buyerName: voucher.buyer_name,
    voucherCode: voucher.id,
    productName: productFullName,
    expiredAt: voucher.expired_at,
  }).catch(err => this.logger.error('WA send error (non-fatal):', err));
}
```

---

### 2.8 Modifikasi VoucherModule

Tambahkan `WhatsappModule` ke imports di `voucher.module.ts`:

```typescript
import { WhatsappModule } from '../whatsapp/whatsapp.module';

@Module({
  imports: [
    // ... existing imports ...
    WhatsappModule, // ← TAMBAHKAN INI
  ],
})
export class VoucherModule {}
```

---

## 📋 BAGIAN 3 — Testing

### 3.1 Test dengan Nomor Sandbox (Sekarang bisa langsung)

```bash
curl -X POST \
  "https://graph.facebook.com/v20.0/12313659000067086/messages" \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -H "Content-Type: application/json" \
  -d '{
    "messaging_product": "whatsapp",
    "to": "628123456789",
    "type": "template",
    "template": {
      "name": "hello_world",
      "language": { "code": "en_US" }
    }
  }'
```

> Gunakan template `hello_world` untuk test awal karena sudah pre-approved.

---

## 📋 BAGIAN 4 — Checklist Persiapan di Facebook Developer

### ✅ Yang sudah ada (berdasarkan screenshot):
- [x] Aplikasi Facebook Developer sudah dibuat
- [x] WhatsApp Business Account sudah aktif (ID: `1025246497080126`)
- [x] Phone Number ID sudah ada (`12313659000067086`)
- [x] Nomor test sandbox sudah tersedia

### 🔲 Yang perlu kamu lakukan sekarang:

**Di Facebook Developer Console / Meta Business Suite:**
- [ ] Buat **Permanent Access Token** via System User
- [ ] Buat **Message Template** `voucher_kode_pembayaran` dengan isi seperti di Bagian 1.3
- [ ] Submit template dan tunggu approval (1-3 hari kerja)
- [ ] Tambahkan **nomor WA bisnis asli** di "Langkah 2. Penyiapan Produksi"
- [ ] Verifikasi nomor WA bisnis via OTP
- [ ] (Opsional) Setup Webhook untuk status delivery

**Di kodebase:**
- [ ] `pnpm --filter @volvecapital/api add @nestjs/axios axios`
- [ ] Tambahkan env variables ke `apps/api/.env`
- [ ] Buat file `whatsapp.module.ts` dan `whatsapp.service.ts`
- [ ] Daftarkan `WhatsappModule` di `AppModule`
- [ ] Modifikasi `VoucherService` untuk memanggil WA service
- [ ] Modifikasi `VoucherModule` untuk import `WhatsappModule`
- [ ] Test di staging environment

---

## 📋 BAGIAN 5 — Catatan Penting

### ⚠️ Format Nomor Telepon

```
✅ Benar  : 628123456789    (tanpa +, dengan kode negara)
✅ Benar  : +628123456789   (dengan +)
❌ Salah  : 08123456789     (perlu dikonversi → sudah di-handle di normalizePhone())
```

### ⚠️ Template WAJIB Approved Sebelum Production

Jangan deploy ke production sebelum template approved. Saat development, gunakan template `hello_world` yang sudah pre-approved.

### ⚠️ Non-blocking Pattern (PENTING)

WhatsApp service harus non-blocking agar kegagalan kirim WA tidak menggagalkan transaksi:

```typescript
// ✅ BENAR — fire and forget
this.whatsappService.sendVoucherCode({...})
  .catch(err => this.logger.error('WA error:', err));

// ❌ SALAH — akan throw error jika WA gagal
await this.whatsappService.sendVoucherCode({...});
```

### ⚠️ Biaya API

| Tier | Biaya per conversation (Indonesia) |
|------|-------------------------------------|
| Utility (notifikasi transaksi) | ~$0.016 per conversation 24 jam |
| Marketing | ~$0.04 per conversation |

---

## 📋 BAGIAN 6 — Referensi Resmi

| Resource | URL |
|----------|-----|
| WhatsApp Business API Docs | https://developers.facebook.com/docs/whatsapp |
| Message Templates Guide | https://developers.facebook.com/docs/whatsapp/message-templates |
| API Reference — Send Messages | https://developers.facebook.com/docs/whatsapp/cloud-api/reference/messages |
| Meta Business Suite | https://business.facebook.com |
| Template Manager | https://business.facebook.com/wa/manage/message-templates |
| Pricing | https://developers.facebook.com/docs/whatsapp/pricing |

---

*Dokumen dibuat: 15 Juli 2026 | VolveCaptial Internal Documentation*
