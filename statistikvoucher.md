# 📊 Rencana Implementasi Statistik Voucher

Rencana ini merinci penambahan fitur statistik dan detail voucher pada dashboard `voucher-generator`.

---

## 🛠️ Perubahan Backend (NestJS API)

### 1. Database Model (`voucher.model.ts`)
Tambahkan kolom `used_at` untuk mencatat waktu persis voucher di-redeem.
```typescript
@Column(DataType.DATE)
declare used_at?: Date | null;
```

### 2. Voucher Service (`voucher.service.ts`)
Tambahkan method `getStatistics` untuk menghitung metrik:
- **Total Generated**: `count(*)`
- **Total Redeemed/Used**: `count(status = 'USED')`
- **Total Tersedia (Paid & Unused)**: `count(status = 'UNUSED' AND payment_status = 'PAID' AND expired_at > now())`
- **Total Unused**: `count(status = 'UNUSED')`
- **Total Active Duration**: `count(expired_at > now())`
- **Total Expired**: `count(expired_at <= now())`

### 3. Public Service (`public.service.ts`)
Update logic `redeemVoucher` agar mengisi kolom `used_at`:
```typescript
await voucher.update({ status: 'USED', used_at: new Date() }, { transaction });
```

---

## 🎨 Perubahan Frontend (Vite + React Dashboard)

### 1. Dashboard UI (`voucher-generator/index.tsx`)

#### A. Bagian Statistik (Grid Card)
Tambahkan grid statistik di atas form:
- Total Generated
- Total Redeemed
- Total Tersedia
- Total Unused
- Total Used
- Total Aktif
- Total Kadaluarsa

#### B. Voucher Terakhir (Detail Card)
Ubah tampilan list menjadi card detail yang mencakup:
- **Voucher ID & Product Name** (Header)
- **Status Badge** (Used/Unused/Expired)
- **Info Tanggal**: Dibuat, Kadaluarsa, Digunakan
- **Info User**: Nama, Email, WhatsApp
- **Durasi**: (diambil dari variant duration)

### 2. Voucher Service (`voucher.service.ts` - Dashboard)
Tambahkan fungsi `getStatistics()` untuk memanggil API statistik.

---

## ❓ Pertanyaan & Klarifikasi

Sebelum lanjut ke tahap pengodingan, mohon konfirmasi beberapa hal berikut:

1. **Metrik #4 ("total voucher yang sudah di redeem dan tersedia")**: Apakah ini maksudnya adalah jumlah total dari (Voucher yang SUDAH di-redeem) + (Voucher yang SUDAH dibayar tapi BELUM di-redeem)? Atau ada perhitungan lain?
2. **Kolom `used_at`**: Apakah setuju untuk menambahkan kolom `used_at` baru di database? Saat ini kita hanya bisa mengandalkan `updated_at`, namun `updated_at` bisa berubah jika ada update data user (misal typo nama).
3. **Status "Aktif" (#7)**: Apakah voucher yang sudah USED tapi durasi produknya masih berjalan dianggap "Aktif", atau hanya voucher UNUSED yang belum melewati `expired_at`?
4. **Layout Detail**: Apakah data lengkap user (Nama, Email, WA) ingin ditampilkan langsung di card list, atau muncul saat card diklik (expand/modal)? Menampilkan semua data langsung mungkin akan membuat card menjadi sangat panjang.
5. **Auto-Refresh**: Apakah statistik ini perlu auto-refresh setiap beberapa detik, atau cukup refresh saat halaman dimuat/setelah generate voucher baru?

jawaban : 
1. iya itu maksud saya (Voucher yang SUDAH di-redeem) + (Voucher yang SUDAH dibayar tapi BELUM di-redeem)
2. iya setuju
3. voucher yang sudah used tapi durasi produknya masih berjalan dianggap "Aktif", atau hanya voucher UNUSED yang belum melewati `expired_at`
4. datanya muncul saat card diklik (expand/modal)
5. cukup refresh saat halaman dimuat/setelah generate voucher baru

bisa kan ngambil data account dan account_profile nya? untuk ditampilkan di detail voucher

w-full md:w-auto px-10 py-4 bg-green-500 text-black font-black rounded-2xl hover:bg-green-400 transition-all flex items-center justify-center gap-3 shadow-[0_10px_30px_rgba(34,197,94,0.3)]