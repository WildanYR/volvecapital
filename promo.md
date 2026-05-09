# Implementasi Sistem Kode Promo (Multi-Tenant)

Dokumen ini menjelaskan rancangan fitur Kode Promo yang dapat dikelola oleh tenant melalui dashboard dan digunakan oleh pembeli saat checkout.

## 1. Konsep Dasar
Setiap tenant dapat membuat kode promo yang unik di dalam schema mereka sendiri. Kode promo ini akan memotong harga akhir sebelum pembeli melakukan pembayaran via DOKU.

### Jenis Diskon:
*   **Fixed Amount**: Potongan harga tetap (Contoh: Potongan Rp 10.000).
*   **Percentage**: Potongan harga berdasarkan persentase (Contoh: Diskon 10%).

---

## 2. Struktur Database (Tenant Schema)

Tambahkan tabel `promo_code` di setiap schema tenant melalui migrasi:

### Table: `promo_code`
| Column | Type | Description |
| :--- | :--- | :--- |
| `id` | UUID | Primary Key |
| `code` | STRING | Kode unik (Contoh: "HEMATPAGI") |
| `type` | ENUM | `FIXED` atau `PERCENTAGE` |
| `value` | DECIMAL | Nilai potongan (Rp atau %) |
| `max_usage` | INTEGER | Maksimal berapa kali kode bisa dipakai (Kuota) |
| `current_usage`| INTEGER | Jumlah pemakaian saat ini |
| `min_purchase`| DECIMAL | Minimal belanja agar kode bisa aktif |
| `start_date` | DATE | Tanggal mulai berlaku |
| `end_date` | DATE | Tanggal kadaluarsa |
| `is_active` | BOOLEAN | Status aktif/nonaktif |
| `created_at` | DATE | Waktu pembuatan |
| `updated_at` | DATE | Waktu update terakhir |

---

## 3. Alur Kerja (Workflow)

### A. Pengaturan di Dashboard (Tenant)
1.  Tenant masuk ke menu **Promo**.
2.  Mengisi form: Kode, Tipe Diskon, Nilai, Kuota, dan Masa Berlaku.
3.  Sistem menyimpan data ke tabel `promo_code` di schema tenant tersebut.

### B. Penggunaan saat Checkout (Pembeli)
1.  Pembeli memasukkan kode promo di modal checkout.
2.  **API Validation**: Frontend memanggil endpoint `POST /public/promo/validate`.
    *   Cek apakah kode ada di database tenant?
    *   Cek apakah `is_active = true`?
    *   Cek apakah masih dalam masa berlaku (`start_date` & `end_date`)?
    *   Cek apakah kuota masih ada (`current_usage < max_usage`)?
    *   Cek apakah total belanja memenuhi `min_purchase`?
3.  Jika valid, API mengembalikan nilai potongan (`discount_amount`) dan detail promo.
4.  **UI Update**: Frontend menampilkan harga baru dan detail potongan secara real-time.

### C. Finalisasi Pembayaran
1.  Saat klik "Bayar Sekarang", backend menghitung ulang `Total = (Harga Paket - Diskon) + Pajak/Fee`.
2.  Sistem membuat transaksi di DOKU dengan harga final yang sudah dipotong.
3.  Setelah pembayaran DOKU sukses (notifikasi Webhook), sistem menambah `current_usage` pada kode promo tersebut.

---

## 4. UI/UX Design (Checkout Modal)

Sesuai dengan desain modal checkout saat ini, berikut adalah elemen yang akan ditambahkan:

*   **Input Field**: Desain minimalis dengan placeholder "Masukkan kode...".
*   **Gunakan Button**: Tombol di sebelah kanan input dengan status loading saat memvalidasi.
*   **Feedback**: Tampilan pesan sukses (hijau) atau error (merah) di bawah input.
*   **Summary Update**:
    *   Harga Paket: Rp 34.900
    *   Biaya Admin: GRATIS
    *   Kode Promo (-): Rp 5.000 (Jika valid)
    *   **Total Bayar: Rp 29.900**

---

## 5. Keamanan & Pencegahan Fraud

1.  **Server-Side Re-validation**: Backend wajib menghitung ulang harga asli dikurangi diskon sebelum memanggil API DOKU. Jangan mengandalkan harga yang dikirim dari frontend.
2.  **Atomic Updates**: Gunakan `increment()` pada sequelize untuk `current_usage` guna menghindari masalah jika banyak user checkout bersamaan (race condition).
3.  **Normalization**: Simpan kode dalam format UPPERCASE di database agar pencarian kode "HEMAT" dan "hemat" tetap berhasil.

---

## 6. Rencana Tahapan Coding

1.  **Database**: Buat migrasi untuk tabel `promo_code`.
2.  **Backend (Dashboard)**: Buat Module, Service, dan Controller untuk pengelolaan promo oleh tenant.
3.  **Backend (Public)**: Buat endpoint public untuk validasi kode promo tanpa perlu login.
4.  **Frontend (Landing Page)**: Tambahkan state `promo` di komponen checkout, buat fungsi handle validate, dan update tampilan total harga.
