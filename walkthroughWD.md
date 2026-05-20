# Walkthrough: Implementasi Sistem Withdrawal (WD) DOKU & Verifikasi Rekening Bank

Sistem penarikan dana tenant (Withdrawal) ke rekening bank melalui DOKU Payout API telah diimplementasikan sepenuhnya dengan keamanan dan alur yang telah disempurnakan. Berikut ringkasan apa saja yang telah dikerjakan:

## 1. Keamanan & Verifikasi Rekening Bank
Untuk mencegah kesalahan transfer dan menjaga keamanan dana tenant, saya menambahkan sistem **Manajemen Rekening Bank**.
*   **Database & Migrasi**: Menambahkan tabel `tenant_bank_account` pada setiap skema tenant, yang menyimpan nomor rekening dan status verifikasi.
*   **Modul Backend**: Membuat `BankAccountModule` yang mengurus operasi *CRUD* dan *OTP (One Time Password)*.
*   **Verifikasi OTP**: Saat tenant ingin menambahkan rekening, sistem secara otomatis mengirimkan email berisi **kode OTP** ke email pemilik (*owner*) tenant.
*   **UI Frontend**:
    *   Halaman `Wallet > Rekening Bank` di mana tenant bisa melihat daftar rekening mereka.
    *   Modal/Form tambah rekening beserta *flow* verifikasi OTP yang *seamless*.
    *   Dropdown pada saat melakukan permintaan penarikan (WD), tenant kini **diwajibkan** untuk memilih salah satu rekening yang **sudah terverifikasi**.

## 2. Penghitungan Net Profit (Fee) pada Transaksi
Struktur model `Transaction` telah dimutakhirkan.
*   Setiap kali ada pembelian (*checkout*), sistem kini mencatat `mdr_fee` (MDR), `platform_fee`, dan menghitung `net_profit` yang merupakan uang riil yang masuk ke *wallet* tenant.
*   Ini memastikan jumlah yang dapat ditarik oleh tenant benar-benar telah dikurangi *fee* yang sesuai.

## 3. Sistem Withdrawal (WD)
*   **Tenant Dashboard**: Tenant dapat memonitor saldo tersedia (hasil *net_profit*) dan membuat _request_ penarikan melalui form yang mengambil data rekening terverifikasi.
*   **Admin Dashboard**: Admin pusat memiliki hak untuk melihat daftar _request_ berstatus PENDING di seluruh jaringan tenant dan menekan tombol **"Setujui & Transfer"**.

## 4. Integrasi DOKU Payout API
*   **Approval Flow**: Saat admin menyetujui, backend memanggil endpoint **DOKU Payout** (berbasis HMAC-SHA256 *signature*) secara otomatis.
*   **Status Sinkronisasi**: Jika API DOKU berhasil memproses, status menjadi `PROCESSING`.
*   **Webhook DOKU**: Endpoint `POST /public/webhook/doku/payout` disediakan untuk memvalidasi dan menerima status final (contoh: `SUCCESS` atau `FAILED`) langsung dari webhook DOKU, memastikan saldo dan _database_ selalu sinkron tanpa ada jeda.

Semua penyesuaian terkait _type safety_, pengelolaan *schema*, dan masalah _dependency injection_ pada NestJS juga telah dibereskan. Selamat menikmati fitur baru ini!
