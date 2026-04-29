# 📈 Rencana Implementasi HPP & Profit per Akun (Final)

Rencana ini merinci langkah-langkah untuk menambahkan fitur pelacakan **HPP (Harga Pokok Penjualan)** dan kalkulasi **Profit (Laba Bersih)** yang dihitung secara spesifik **per akun**. Statistik ini akan ditampilkan langsung di dalam tabel/list akun pada dashboard.

---

## 🛠️ 1. Perubahan Database (PostgreSQL)

Kita akan menambahkan kolom modal langsung ke tabel `account`.

### A. Tabel `account`
Tambahkan kolom `capital_price` untuk menyimpan harga modal/beli dari akun tersebut.
```sql
ALTER TABLE "account" ADD COLUMN "capital_price" INTEGER DEFAULT 0;
```

---

## ⚙️ 2. Perubahan Backend (NestJS API)

### A. Model & DTO
1.  **`account.model.ts`**: Tambahkan field `capital_price`.
2.  **`create-account.dto.ts` & `update-account.dto.ts`**: Tambahkan field `capital_price` agar bisa diinput dari dashboard.

### B. Logic Perhitungan Finansial per Akun
Setiap akun akan memiliki data statistik tambahan:
- **Total Revenue**: Total harga dari semua transaksi yang menggunakan profil di akun tersebut.
- **Profit**: `Total Revenue - Capital Price`.
- **ROI (%)**: `(Profit / Capital Price) * 100`.

### C. Update `AccountService` (`apps/api/src/modules/account/account.service.ts`)
Update method `findAll` dan `findOne` agar melakukan join/subquery untuk menghitung `total_revenue` secara otomatis dari tabel `transaction`.

---

## 🎨 3. Perubahan Frontend (Vite + React Dashboard)

### A. Form Edit Akun (`apps/dashboard/src/components/forms/account-edit.form.tsx`)
Tambahkan input field **"Harga Modal (HPP)"** agar user bisa memasukkan nominal modal untuk akun tersebut.

### B. Statistik di List Akun (`apps/dashboard/src/routes/dashboard/account/$slug.tsx`)
Pada card/row akun di halaman pooling, tambahkan seksi statistik baru:
1.  **Modal (HPP)**: Menampilkan `capital_price`.
2.  **Total Pendapatan**: Menampilkan `total_revenue` yang dihitung sistem.
3.  **Laba Bersih (Profit)**: Menampilkan selisih pendapatan dan modal.
4.  **ROI**: Menampilkan persentase pengembalian modal.

### C. Format Mata Uang & UI
Gunakan utility `formatRupiah` dan tambahkan icon `TrendingUp` atau `Wallet` untuk mempercantik tampilan statistik di dalam tabel akun.

---

## ✅ Konfirmasi User (Jawaban Sebelumnya)

Berdasarkan feedback Anda:
1.  **Scope**: Menghitung **semua transaksi** yang pernah terkait dengan akun tersebut sepanjang sejarah.
2.  **Input Modal**: Bisa diubah kapan saja (misal ada biaya tambahan).
3.  **ROI**: Menampilkan persentase ROI (Return on Investment).
4.  **Sorting**: Tidak memerlukan fitur sorting berdasarkan profit saat ini.

---


---

# 🚀 Update: Implementasi Statistik Finansial Lanjutan (Expandable & Multiple Capital)

Berdasarkan permintaan terbaru, kita akan meningkatkan fitur HPP agar mendukung pencatatan modal berkali-kali (cicilan modal/biaya tambahan) dan detail pendapatan yang bisa di-expand.

## 🛠️ 1. Perubahan Database (PostgreSQL)

### A. Tabel Baru: `account_capital`
Digunakan untuk menyimpan riwayat pengisian modal untuk setiap akun.
- `id`: BIGINT (Primary Key)
- `account_id`: BIGINT (Foreign Key ke `account.id`)
- `amount`: INTEGER (Nominal modal)
- `note`: TEXT (Catatan, misal: "Modal awal", "Biaya admin")
- `created_at`: TIMESTAMP (Tanggal input)

## ⚙️ 2. Perubahan Backend (NestJS API)

### A. Module & Model Baru
1.  **`AccountCapital` Module**: CRUD untuk pencatatan modal.
2.  **Update `Account` Model**: Tambahkan relasi `HasMany` ke `AccountCapital`.

### B. Logic Perhitungan Finansial
- **Total Capital**: Sum dari semua `amount` di `account_capital` untuk akun terkait.
- **Revenue Details**: Ambil data dari tabel `transaction_item` -> `transaction` -> `account_user` -> `account_profile` -> `account`. Kita perlu menarik detail nominal, tanggal, dan nama user pembeli.

### C. Endpoints
1.  `GET /account/:id/financial-details`: Mengembalikan list modal dan list pendapatan secara mendetail.
2.  `POST /account/:id/capital`: Menambahkan modal baru ke akun.

## 🎨 3. Perubahan Frontend (Dashboard)

### A. Expandable UI di List Akun
Tambahkan tombol **"Detail Finansial"** pada card akun. Saat diklik, akan menampilkan:
1.  **Tabel Riwayat Modal**: Menampilkan kolom Tanggal, Nominal, dan Catatan.
2.  **Tabel Riwayat Pendapatan**: Menampilkan kolom Tanggal, Nama User/Buyer, dan Nominal.
3.  **Form Tambah Modal**: Input cepat untuk menambah modal baru tanpa harus edit akun.

---

**Implementasi Selesai: Fitur statistik finansial lanjutan telah aktif.**
User sekarang dapat melihat detail modal dan pendapatan secara mendetail serta menambahkan riwayat modal baru secara bertahap.
