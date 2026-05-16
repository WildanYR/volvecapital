# Rencana Implementasi Email Reminder Expired

Fitur ini bertujuan untuk mengirimkan email otomatis kepada pembeli (khusus pembelian dari **Landing Page**) sebelum durasi langganan mereka berakhir, lengkap dengan rekomendasi produk lainnya. Untuk pembelian manual (WA) dan Shopee, fitur ini akan diabaikan karena data email buyer tidak tersedia.

## 1. Perubahan Database (Schema)
- **Tabel `product_variant`**:
    - Tambah kolom `reminder_before_hours` (Integer, nullable). Menyimpan jumlah jam sebelum expired untuk trigger email.
- **Tabel `account_user`**:
    - Tambah kolom `is_reminder_sent` (Boolean, default false). Untuk memastikan email hanya dikirim satu kali.

## 2. Backend Logic (NestJS)
- **Cron Job / Worker**:
    - Membuat task yang berjalan setiap 15-30 menit.
    - Query: Mencari `account_user` yang:
        - `status = 'active'`
        - `is_reminder_sent = false`
        - `expired_at` <= (Waktu sekarang + `reminder_before_hours`)
    - **Filter Platform**: Hanya memproses user yang terhubung ke `Transaction` dengan `platform = 'landing'` (via `TransactionItem`).
    - Mengambil data `buyer_email` dari `Voucher` atau `Transaction` yang terkait.
- **Email Dispatcher**:
    - Menggunakan `nodemailer` yang sudah ada.
    - Template email dinamis yang mengambil data `tenant`, `product`, dan `variants`.
- **Rekomendasi Varian**:
    - Mencari varian lain dari `product_id` yang sama untuk ditampilkan sebagai rekomendasi "Upgrade" atau "Perpanjang".

## 3. Frontend Dashboard (Vite)
- **Halaman Edit Varian**:
    - Menambahkan input field baru: "Email Reminder (Jam Sebelum Expired)".
    - Contoh: Input "1" untuk netflix harian, "24" untuk netflix bulanan.

## 4. Struktur Email
- **Subject**: [Reminder] Langganan {{product_name}} Anda akan segera berakhir!
- **Body**:
    - Notifikasi waktu sisa langganan.
    - Link perpanjangan otomatis ke Landing Page tenant: `https://{{tenant_slug}}.digitalpremium.id/product/{{product_slug}}`.
    - List produk rekomendasi (varian lain).

---

## Pertanyaan & Klarifikasi (Mohon dijawab sebelum saya mulai ngoding):

1. **Email Sender**: Apakah kita akan menggunakan SMTP global (Digital Premium) atau setiap tenant bisa setting SMTP sendiri? (Saat ini sepertinya SMTP diset global di level API).
2. **Link Pembelian**: Link yang dikirim akan mengarah ke landing page produk (contoh: `https://tenant.volvecapital.com/product/netflix`). Apakah format ini sudah sesuai?
3. **Logika Rekomendasi**: Untuk rekomendasi varian, apakah cukup menampilkan semua varian lain dari produk yang sama, atau ada logika prioritas (misal: hanya yang durasinya lebih lama)?
4. **Nama Pengirim**: Nama pengirim di email ingin dibuat statis ("Digital Premium") atau dinamis mengikuti nama Brand/Tenant masing-masing?
5. **Bahasa Email**: Apakah cukup bahasa Indonesia saja atau perlu support multi-language?
