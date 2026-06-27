# Rencana Implementasi Amortisasi Harian (Opsi C)

Rencana ini merangkum perubahan yang akan saya buat di kode `AmortizationService` untuk mengubah perhitungan Pendapatan dan HPP (COGS) sesuai kesepakatan kita.

## User Review Required

> [!WARNING]
> **Tidak ada field `price` di `transaction_item`.**
> Setelah saya mengecek struktur database, ternyata tabel `transaction_item` tidak memiliki kolom harga (price). Harga hanya disimpan di tabel induknya, yaitu `transaction` (pada kolom `total_price`). 
> 
> Karena itu, saya akan menggunakan `transaction.total_price` dibagi dengan jumlah item di dalam transaksi tersebut (jika pembeli membeli lebih dari 1 produk sekaligus dalam 1 nota) sebagai harga per itemnya. Apakah ini dapat diterima?

## Proposed Changes

---

### Backend API (Amortization Service)

#### [MODIFY] [amortization.service.ts](file:///e:/latihan%20coding/1volvecapital/volvecapital/apps/api/src/modules/accounting/amortization.service.ts)

**1. Perubahan Query Pencarian Data Aktif**
Kita perlu menarik lebih banyak data relasi saat mencari langganan yang aktif.
- Menambahkan relasi `TransactionItem` dan `Transaction` untuk mendapatkan harga beli dari `total_price`.
- Menambahkan relasi `AccountProfile` (seluruh profil di dalam satu akun) untuk menghitung total kapasitas user (`max_users`).

**2. Perhitungan Pendapatan (Revenue) Baru**
- Mengambil total durasi dari selisih `expired_at` - `created_at` milik `AccountUser`.
- `Pendapatan Harian` = `(Transaction.total_price / Jumlah Item di Transaksi)` dibagi `Durasi Langganan`.
- Membuat jurnal Pendapatan.

**3. Perhitungan HPP (COGS) Baru**
- Mengambil `capital_price` (modal) dari tabel `Account`.
- Menghitung total durasi aktif Akun = `account.subscription_expiry` - `account.created_at`.
- Biaya Modal Akun Per Hari = `capital_price` / Total Durasi Akun.
- Mengumpulkan seluruh profil di Akun tersebut yang `allow_generate = true` dan menjumlahkan `max_user`-nya.
- HPP Harian Per User = `Biaya Modal Akun Per Hari` / `Total Max User`.
- Membuat jurnal HPP untuk tiap user aktif.

**4. Penambahan Jurnal Kerugian (Slot Kosong)**
- Untuk setiap Akun yang sedang diamortisasi, kita akan mencatat berapa total slot yang benar-benar terisi dan sudah dibuatkan jurnal HPP-nya.
- Setelah me-looping seluruh user di dalam satu Akun, kita cek apakah ada slot kosong.
- Beban Slot Kosong = `Biaya Modal Akun Per Hari` - (HPP Harian Per User x Jumlah User Aktif).
- Jika ada beban slot kosong (> 0), sistem akan membuat satu Jurnal Amortisasi tambahan dengan referensi: `AMRT-LOSS-[AccountID]-[Date]`.
- Jurnal Loss ini akan mendebet beban penyusutan/HPP dan mengkredit persediaan.

## Verification Plan

### Automated Tests
- Menjalankan `clean.js` untuk membersihkan jurnal yang ada.
- Menjalankan server backend secara lokal.
- Menekan tombol "Trigger Amortisasi" dari dashboard.

### Manual Verification
- Anda dapat mengecek tabel jurnal umum di dashboard untuk melihat perhitungan yang dihasilkan.
- Memastikan angka pendapatan (Revenue) sama dengan harga di transaksi Shopee / nota pembelian dibagi durasi.
- Memastikan HPP per user tepat sejumlah `(Modal Akun / Durasi) / Max User` dan terdapat jurnal tambahan untuk slot kosong (jika ada).
