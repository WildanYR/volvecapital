# Rencana Implementasi DOKU Payment Gateway (QRIS Only)

Dokumen ini menjelaskan langkah-langkah untuk mengganti Midtrans dengan DOKU (Jokul) khusus untuk metode pembayaran QRIS, dengan tetap mempertahankan alur kerja yang sudah ada.

## 1. Persiapan Environment Variables
Ganti variabel Midtrans dengan DOKU di file `.env` API dan Dashboard.

```env
# DOKU Config
DOKU_CLIENT_ID=G-XXXXXXXXXXXX
DOKU_SECRET_KEY=SK-XXXXXXXXXXXX
DOKU_IS_PRODUCTION=false
DOKU_NOTIFY_URL=https://api.yourdomain.com/public/payment/notify-doku
```

## 2. Perubahan Backend (apps/api)

### A. Konfigurasi Baru
Buat `apps/api/src/configs/doku.config.ts` untuk memetakan variabel environment.

### B. Service Payment (DOKU)
Ganti logika `requestMidtransSnapToken` dengan `requestDokuQris`:
1. **Generate Signature**: Membuat signature HMAC-SHA256 sesuai standar DOKU.
2. **Hit API DOKU**: Menggunakan endpoint `/qris/v1/generate-qr`.
3. **Response**: DOKU akan mengembalikan data QR (string) yang nantinya diubah menjadi gambar di frontend.

### C. Webhook Handler
Buat endpoint baru `/public/payment/notify-doku` di `PublicController` yang akan menerima notifikasi dari DOKU.
- Logika validasi signature dari DOKU.
- Update status voucher menjadi `PAID` jika pembayaran berhasil.

## 3. Perubahan Frontend (apps/landingpage)

### A. Komponen Pembayaran
Saat ini landing page mungkin menggunakan `Snap Midtrans`. Kita perlu mengubahnya untuk menampilkan QR Code secara langsung atau mengarahkan ke halaman instruksi DOKU.
- Jika menggunakan API QRIS Direct: Tampilkan QR Code menggunakan library seperti `qrcode.react`.
- Jika menggunakan Checkout: Buka URL checkout DOKU.

## 4. Perbandingan Alur Kerja

| Fitur | Midtrans (Lama) | DOKU (Baru) |
| :--- | :--- | :--- |
| **Metode** | Snap Popup (Multi-payment) | QRIS Direct / DOKU Page |
| **Trigger** | Klik Bayar -> Snap Token | Klik Bayar -> Generate QRIS |
| **Verifikasi** | Webhook Midtrans | Webhook DOKU |
| **UX** | Popup Midtrans | QR Code tampil di layar |

---

## 5. Struktur Data Request DOKU QRIS (Contoh)

```json
{
    "order": {
        "invoice_number": "VC-TENANT-12345678",
        "amount": 50000
    },
    "qris": {
        "reusability": "ONE_TIME_USE",
        "expires_at": 3600
    },
    "customer": {
        "name": "Buyer Name",
        "email": "buyer@email.com"
    }
}
```

## 6. Logic Signature (Node.js)

DOKU memerlukan signature HMAC-SHA256. Berikut adalah cara pembuatannya:

```typescript
import * as crypto from 'crypto';

function generateSignature(clientId: string, requestId: string, requestTimestamp: string, requestTarget: string, body: string, secretKey: string) {
    const digest = crypto.createHash('sha256').update(body).digest('base64');
    const component = `Client-Id:${clientId}\n` +
                      `Request-Id:${requestId}\n` +
                      `Request-Timestamp:${requestTimestamp}\n` +
                      `Request-Target:${requestTarget}\n` +
                      `Digest:${digest}`;
    
    return crypto.createHmac('sha256', secretKey).update(component).digest('base64');
}
```

## 7. Integrasi ke `public.service.ts`

Saya akan mengganti fungsi `requestMidtransSnapToken` menjadi `requestDokuQris` dengan alur:
1. Menyiapkan payload sesuai format DOKU.
2. Generate `Signature` menggunakan fungsi di atas.
3. Kirim POST request ke `https://api-sandbox.doku.com/qris/v1/generate-qr`.
4. Return URL QRIS atau string raw QRIS.

---
---

## 9. Cara Mengambil Credential DOKU Sandbox

1.  **Daftar/Login**: Buka [DOKU Dashboard Sandbox](https://sandbox.doku.com/).
2.  **Akses Integration**: Di menu sidebar, cari **Integration** > **API Keys**.
3.  **Salin Client ID & Secret Key**:
    - `Client ID` biasanya diawali dengan huruf `G-`.
    - `Secret Key` (Shared Key) diawali dengan `SK-`.
4.  **Konfigurasi Webhook**:
    - Masuk ke menu **Integration** > **URL Notifications**.
    - Masukkan URL Ngrok Anda di kolom **Notification URL** (contoh: `https://abcd-123.ngrok-free.app/public/payment/notify-doku`).
    - Simpan perubahan.

---

## 10. Detail Teknis Berdasarkan Diskusi

- **Frontend**: Menggunakan library `qrcode.react` untuk merender `qr_string`.
- **Expiry**: Set ke **30 menit** (1800 detik).
- **Check Status**: Menambahkan endpoint GET `/public/payment/status/:order_id` di backend agar frontend bisa melakukan polling atau manual check status.

---
**Rencana Aksi Terbaru**:
- [x] Install library: `pnpm --filter landingpage add qrcode.react`
- [x] Backend: Buat `doku.config.ts` & update `AppModule`.
- [x] Backend: Implementasi `requestDokuQris` & `handlePaymentNotify`.
- [x] Backend: Buat endpoint `checkPaymentStatus`.
- [x] Frontend: Buat komponen `QrisDisplay` (QrisModal) & tombol "Cek Status".
