# 🚀 Panduan Go-Live WhatsApp Business API ke Production

> Dokumen ini menjelaskan langkah-langkah yang harus dilakukan di **Facebook Developer Console** dan **Meta Business Suite** untuk berpindah dari mode sandbox/development ke **production** yang bisa mengirim ke semua nomor Indonesia.

---

## 📊 Status Saat Ini vs Target

```
SEKARANG (Sandbox)                    TARGET (Production)
─────────────────────────────         ──────────────────────────────
Nomor: +1 (555) 141-4154 [US]   →    Nomor: +62 8xx-xxxx-xxxx [Indonesia]
Hanya nomor terdaftar saja      →    Semua nomor WA di dunia
Token expire 24 jam             →    Token permanent (System User)
Template terbatas               →    Template custom approved
Gratis                          →    Berbayar per conversation
```

---

## 🗺️ Roadmap Production (Urutan Wajib)

```
[1] Verifikasi Bisnis Meta
         ↓
[2] Tambah Nomor WA Indonesia Asli
         ↓
[3] Buat Permanent Token (System User)
         ↓
[4] Buat & Submit Message Template
         ↓
[5] Setup Webhook di Server Produksi
         ↓
[6] Ganti Mode App: Development → Live
         ↓
[7] Update .env & Deploy
```

---

## LANGKAH 1 — Verifikasi Bisnis Meta (PALING PENTING)

**Dimana:** https://business.facebook.com → Pengaturan → Pusat Keamanan → Verifikasi Bisnis

**Dokumen yang disiapkan:**
- SIUP / NIB (Nomor Induk Berusaha) — dikeluarkan OSS
- NPWP Perusahaan
- Akta Pendirian Perusahaan (jika PT)
- KTP Direktur/Owner

**Langkah:**
1. Buka https://business.facebook.com/settings/security
2. Klik "Mulai Verifikasi" di bagian Verifikasi Bisnis
3. Pilih negara: Indonesia
4. Isi nama bisnis PERSIS seperti di dokumen legal
5. Upload dokumen (NIB/SIUP + NPWP)
6. Submit → Tunggu 1-5 hari kerja

> ⚠️ Tanpa ini, akun tetap restricted dan tidak bisa kirim ke nomor Indonesia!

---

## LANGKAH 2 — Tambah Nomor WhatsApp Indonesia Asli

**Dimana:** Facebook Developer Console → WhatsApp → API Setup → "Langkah 2. Penyiapan Produksi"

**Syarat nomor:**
- Bisa menerima SMS atau telepon (untuk verifikasi OTP)
- BELUM terdaftar sebagai WhatsApp personal (atau sudah dinonaktifkan WA personal-nya)
- Nomor aktif Indonesia (+62)

**Langkah:**
1. Klik "Add phone number"
2. Isi nama display (nama bisnis yang akan terlihat oleh penerima)
3. Masukkan nomor Indonesia (format: +62 8xx-xxxx-xxxx)
4. Pilih verifikasi via SMS atau Telepon
5. Masukkan OTP yang diterima
6. Catat Phone Number ID yang baru → update .env

> 💡 Tips: Gunakan nomor yang KHUSUS untuk bisnis, bukan nomor pribadi.

**Update .env setelah dapat nomor baru:**
```env
WHATSAPP_PHONE_NUMBER_ID=ID_BARU_DARI_SINI
```

---

## LANGKAH 3 — Buat Permanent Token (System User)

**Dimana:** https://business.facebook.com → Pengaturan → Pengguna Sistem

**Kenapa perlu ini?**
Token dari Developer Console expire dalam 24 jam. System User Token TIDAK expire.

**Langkah:**
1. Buka https://business.facebook.com/settings/system-users
2. Klik "Tambahkan" → beri nama (misal: "volvecapital-wa-bot")
3. Pilih peran: "Admin"
4. Setelah dibuat, klik nama System User → "Buat Token"
5. Pilih App kamu (nama aplikasi di Developer Console)
6. Centang permission berikut:
   - ✅ whatsapp_business_messaging
   - ✅ whatsapp_business_management
   - ✅ business_management
7. Klik "Generate Token"
8. COPY token-nya sekarang (tidak bisa dilihat lagi!)

**Update .env:**
```env
WHATSAPP_ACCESS_TOKEN=TOKEN_SYSTEM_USER_YANG_PERMANENT
```

---

## LANGKAH 4 — Buat & Submit Message Template

**Dimana:** https://business.facebook.com/wa/manage/message-templates

**Template yang perlu dibuat:**

### Template: voucher_kode_pembayaran

```
Kategori  : UTILITY
Nama      : voucher_kode_pembayaran
Bahasa    : Indonesian (id)

─── HEADER (Opsional) ───
🎉 Pembayaran Berhasil!

─── BODY ───
Halo {{1}}, terima kasih telah berbelanja di *VolveCaptial*! 🎉

Berikut detail voucher kamu:
🔑 *Kode Voucher* : {{2}}
📦 *Produk*        : {{3}}
⏰ *Berlaku hingga* : {{4}}

Gunakan kode ini di aplikasi untuk menikmati layananmu.
Jika ada pertanyaan, balas pesan ini. 😊

─── FOOTER ───
VolveCaptial — Digital Services
```

**Variabel:**
| Variabel | Diisi dengan |
|----------|-------------|
| `{{1}}` | buyer_name |
| `{{2}}` | voucher_code |
| `{{3}}` | product_name |
| `{{4}}` | expired_at |

**Setelah approve, update .env:**
```env
WHATSAPP_TEMPLATE_NAME=voucher_kode_pembayaran
WHATSAPP_TEMPLATE_LANGUAGE=id
```

> ⚠️ Template approval: 1-3 hari. Template DITOLAK jika mengandung konten promosi agresif.

---

## LANGKAH 5 — Setup Webhook di Server Production

**Dimana:** Facebook Developer Console → WhatsApp → Configuration → Webhooks

**Syarat:**
- Server harus bisa diakses publik (HTTPS, bukan localhost)
- Endpoint harus merespons verifikasi challenge dari Meta

**Endpoint yang perlu dibuat di NestJS kamu:**

### GET /webhook/whatsapp (Verifikasi)
```typescript
// Untuk verifikasi initial dari Meta
@Get('webhook/whatsapp')
verifyWebhook(
  @Query('hub.mode') mode: string,
  @Query('hub.verify_token') token: string,
  @Query('hub.challenge') challenge: string,
) {
  if (mode === 'subscribe' && token === process.env.WHATSAPP_WEBHOOK_VERIFY_TOKEN) {
    return parseInt(challenge);  // HARUS return angka challenge
  }
  throw new ForbiddenException();
}

// Untuk menerima delivery status & pesan masuk
@Post('webhook/whatsapp')
receiveWebhook(@Body() body: any) {
  // Log delivery status (delivered, read, failed)
  const statuses = body?.entry?.[0]?.changes?.[0]?.value?.statuses;
  if (statuses) {
    for (const status of statuses) {
      console.log(`[WA Webhook] Message ${status.id}: ${status.status}`);
      if (status.errors) {
        console.error(`[WA Webhook] Error:`, status.errors);
      }
    }
  }
  return { status: 'ok' };
}
```

**Di Facebook Developer Console:**
1. Callback URL: `https://yourdomain.com/webhook/whatsapp`
2. Verify Token: (isi bebas, simpan di .env sebagai WHATSAPP_WEBHOOK_VERIFY_TOKEN)
3. Subscribe to: ✅ messages

**Tambah ke .env:**
```env
WHATSAPP_WEBHOOK_VERIFY_TOKEN=random_secret_string_kamu
```

---

## LANGKAH 6 — Ganti Mode App: Development → Live

**Dimana:** Facebook Developer Console → App Dashboard → App Settings → Basic

**Langkah:**
1. Buka https://developers.facebook.com/apps/
2. Pilih aplikasi kamu
3. Di pojok kanan atas ada toggle **"Development"** → klik → pilih **"Live"**
4. Konfirmasi

> ⚠️ Sebelum bisa Live, Meta akan cek:
> - Business Verification sudah selesai ✅
> - App sudah ada privacy policy URL
> - App sudah ada terms of service URL
> - Setidaknya satu nomor produksi sudah terdaftar

**Tambahkan Privacy Policy & Terms:**
1. App Settings → Basic
2. Isi "Privacy Policy URL" dan "Terms of Service URL"
3. Bisa gunakan halaman di website bisnis kamu

---

## LANGKAH 7 — Update .env Final & Deploy

Setelah semua langkah selesai, `.env` production kamu akan terlihat seperti:

```env
# ── WhatsApp Business API (PRODUCTION) ───────────────────────────
WHATSAPP_ACCESS_TOKEN=EAAxxxxx...PERMANENT_SYSTEM_USER_TOKEN
WHATSAPP_PHONE_NUMBER_ID=ID_NOMOR_INDONESIA_ASLI
WHATSAPP_BUSINESS_ACCOUNT_ID=1025246497080126
WHATSAPP_API_VERSION=v20.0
WHATSAPP_TEMPLATE_NAME=voucher_kode_pembayaran
WHATSAPP_TEMPLATE_LANGUAGE=id
WHATSAPP_WEBHOOK_VERIFY_TOKEN=random_secret_string_kamu
```

---

## ⏱️ Estimasi Total Waktu

| Langkah | Estimasi |
|---------|----------|
| Verifikasi Bisnis Meta | 1-5 hari kerja |
| Tambah nomor WA Indonesia | 1-2 jam |
| Buat System User Token | 15 menit |
| Buat & Submit Template | 1-3 hari (review) |
| Setup Webhook | 1 jam |
| Ganti mode ke Live | 15 menit |
| **Total** | **±3-7 hari** (tergantung review Meta) |

---

## 💰 Biaya WhatsApp Business API (Production)

Setelah live, biaya dihitung per **conversation** (24 jam window):

| Tipe | Biaya per conversation (Indonesia) |
|------|-------------------------------------|
| Utility (notifikasi transaksi/voucher) | ~$0.016 / conv |
| Marketing | ~$0.040 / conv |
| Authentication (OTP) | ~$0.016 / conv |
| Service (balas pesan user) | ~$0.012 / conv |

**Estimasi biaya jika kirim 1000 voucher/bulan:**
- 1000 x $0.016 = **$16/bulan** (~Rp 260.000)

> 💡 1000 pesan pertama per bulan GRATIS dari Meta!

---

## ✅ Checklist Go-Live

- [ ] Verifikasi Bisnis Meta selesai & approved
- [ ] Nomor WA Indonesia ditambahkan & terverifikasi
- [ ] System User Token (permanent) dibuat
- [ ] Template `voucher_kode_pembayaran` dibuat & approved
- [ ] Webhook endpoint siap di server production (HTTPS)
- [ ] Privacy Policy & Terms URL diisi di App Settings
- [ ] Mode App diganti ke "Live"
- [ ] .env production diupdate dengan nilai baru
- [ ] Test end-to-end: generate voucher → terima WA

---

*Dokumen dibuat: 15 Juli 2026 | VolveCaptial Internal Documentation*
