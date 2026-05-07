# Rencana Implementasi Perubahan Voucher & Email

Berdasarkan permintaan Anda, berikut adalah rencana teknis untuk mengatasi kendala masa expired voucher dan penambahan tutorial pada email.

## 1. Penyesuaian Logika Expired Voucher (Public Service)

### Masalah
Saat ini, voucher memiliki `expired_at` (misal 3 hari) yang berfungsi sebagai batas waktu klaim. Namun, setelah diklaim (`USED`), jika `expired_at` tersebut sudah lewat, user mungkin mengalami kendala dalam mengakses detail akun (tergantung pengecekan di sistem).

### Solusi
Ketika voucher di-redeem (diklaim), kita akan memperbarui `expired_at` pada tabel `voucher` agar nilainya sama dengan masa aktif akun yang baru dibuat (berdasarkan durasi produk).

**Langkah-langkah:**
1.  Buka `apps/api/src/modules/public/public.service.ts`.
2.  Pada method `redeemVoucher`, setelah menghitung `expiredAt` untuk `account_user`, tambahkan logika untuk mengupdate `voucher.expired_at` dengan nilai yang sama.
3.  Ini memastikan voucher tetap "valid" secara sistem selama masa aktif akun masih ada.

---

## 2. Pembaruan Template Email Voucher

### Masalah
Email konfirmasi pembayaran saat ini hanya berisi kode voucher tanpa instruksi detail atau tombol redeem.

### Solusi
Memperbarui method `sendPaymentConfirmationEmail` di `PublicService` untuk mencakup:
- Detail Produk.
- Kode Voucher.
- Tanggal Kadaluwarsa (Batas Klaim).
- Tutorial Cara Redeem (4 langkah yang Anda berikan).
- Tombol/Link "Redeem Voucher" yang mengarah langsung ke halaman redeem.

**Langkah-langkah:**
1.  Buka `apps/api/src/modules/public/public.service.ts`.
2.  Perbarui method `sendPaymentConfirmationEmail`.
3.  Gunakan `FRONTEND_URL` dan `tenantId` untuk membuat link redeem yang dinamis (contoh: `https://[tenant].digitalpremium.id/redeem`).
4.  Implementasikan desain HTML yang premium dan responsif sesuai dengan brand "Digital Premium".

---

## Klarifikasi & Pertanyaan

Sebelum saya mulai melakukan pengodingan, ada beberapa hal yang ingin saya pastikan:

1.  **Format Tanggal di Email**: Untuk "Tanggal Kadaluwarsa" di email (saat voucher baru dibuat), apakah sudah benar jika yang ditampilkan adalah **batas waktu klaim** (misal 3 hari dari pembelian)? Karena saat itu voucher belum di-redeem, jadi durasi produk belum berjalan.
2.  **Link Tombol Redeem**: Apakah tombol redeem sebaiknya langsung mengisi kode vouchernya secara otomatis di halaman redeem? (Contoh: `/redeem?code=VC-XXXXX`). Jika ya, saya perlu sedikit menyesuaikan frontend di `apps/landingpage` agar bisa membaca query parameter tersebut.
3.  **Nama Toko**: Di template email yang Anda berikan ada variabel `[Nama Toko]`. Apakah saya sebaiknya mengambil nama ini dari setting `SITE_NAME` atau langsung menggunakan nama tenant?
4.  **Durasi Produk**: Saya berasumsi `variant.duration` disimpan dalam satuan milidetik (ms) di database. Mohon konfirmasi jika satuannya berbeda (misal hari).

Mohon berikan masukan Anda mengenai poin-poin di atas. Setelah Anda memberikan klarifikasi, saya akan segera mengeksekusi implementasinya.
