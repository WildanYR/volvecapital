# Implementation Plan: Duoke Auto-Reply Module

Bot ini akan berfungsi sebagai background worker yang secara terus-menerus memantau pesan masuk di Duoke dan memberikan balasan otomatis berdasarkan aturan yang ditetapkan.

## 1. Konfigurasi Sistem
### Environment Variables (.env)
- `DUOKE_ENABLED=true`: Mengaktifkan/menonaktifkan modul.
- `REPLY_LINES="Ready kak Silahkan Order || langsung CO aja proses cepat"`: Pesan balasan (dipisahkan oleh `||` untuk multi-baris).
- `DUOKE_CHECK_INTERVAL=30000`: Jeda pengecekan dalam milidetik (default 30 detik).

### File Storage (apps/bot2/data/duoke-history.json)
Penyimpanan lokal untuk mencatat histori balasan agar tidak spam:
```json
{
  "last_reset_date": "2026-05-11",
  "replied_users": ["gigihkurniawangk6", "user_lain"]
}
```

## 2. Struktur Kode
- **File Utama**: `apps/bot2/src/modules/duoke/DuokeModule.ts`
- **Locators**: `apps/bot2/src/modules/duoke/locators.ts`
- **Types**: `apps/bot2/src/modules/duoke/types.ts`

## 3. Alur Kerja Worker (Infinite Loop)

### A. Tahap Inisialisasi (`init`)
1. Memuat data dari `duoke-history.json`.
2. Mengecek apakah tanggal hari ini berbeda dengan `last_reset_date`. Jika berbeda, hapus daftar `replied_users` (reset harian).
3. Memulai loop utama di background.

### B. Tahap Pengecekan Login
1. Navigasi ke `https://web.duoke.com/?lang=en#/dk/main/chat`.
2. Cek apakah elemen input Email atau Password ada (Selector: `.el-input__inner` dengan placeholder Email/Password).
3. Jika ada: Log "⚠️ Belum Login. Silahkan login manual di browser bot!" dan tunggu 1 menit sebelum cek lagi.
4. Jika tidak ada: Lanjut ke tahap Scanning Chat.

### C. Tahap Scanning & Balas
1. Mencari elemen badge unread: `.el-badge__content.is-fixed`.
2. Jika ditemukan:
    - Cari elemen `.buyer_name` terdekat atau dalam kontainer yang sama.
    - Ambil teks `username`.
    - Cek apakah `username` ada di daftar `replied_users` hari ini.
3. Jika belum dibalas:
    - Klik kontainer chat user tersebut.
    - Tunggu `textarea.el-textarea__inner` muncul.
    - Ambil `REPLY_LINES` dari env, pisahkan `||` menjadi array.
    - Lakukan loop pengetikan untuk setiap baris pesan.
    - Tekan `Enter` untuk mengirim.
    - Masukkan `username` ke daftar `replied_users` dan simpan ke file JSON secara asinkron.

### D. Tahap Jeda
1. Tunggu selama `DUOKE_CHECK_INTERVAL`.
2. Kembali ke Tahap B.

## 4. Keamanan & Stabilitas
- **Error Handling**: Jika gagal membalas satu user (misal elemen tidak ditemukan), bot akan mencatat error dan lanjut ke user berikutnya atau loop berikutnya, bukan berhenti total.
- **Auto-Reset**: Logic reset daftar user otomatis terjadi saat berganti hari (lewat jam 00:00).
- **Session Persistence**: Menggunakan context `duoke_session` agar login manual hanya perlu dilakukan sekali.

---

## 5. Pertanyaan Pending (Silahkan Jawab di Sini)

1. **Jeda antar baris**: Saat membalas dengan multi-baris (misal: baris 1 lalu baris 2), apakah kamu ingin ada jeda sedikit (misal 1 detik) antar pengiriman pesan tersebut agar terlihat lebih manusiawi?
   - Jawaban: ...

2. **Context Name**: Saya akan menggunakan session browser dengan nama `duoke_session`. Ini berarti login kamu akan tersimpan selama session tidak dihapus. Apakah oke?
   - Jawaban: ...

jawaban :
1. jeda antar baris 1 detik
2. okey boleh
