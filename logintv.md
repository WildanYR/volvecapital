# Implementasi Fitur Netflix Login TV

Fitur ini memungkinkan admin untuk memicu proses login Netflix TV langsung dari dashboard. Bot akan menangani proses login di browser, menunggu input kode 8-digit dari admin, dan memasukkannya ke halaman Netflix TV2.

## 1. Alur Kerja (Workflow)

### Tahap 1: Inisiasi (Dashboard)
- Admin klik tombol **"Login TV"** pada kartu akun Netflix di dashboard.
- API mengirim tugas `NETFLIX_LOGIN_TV` ke Bot via Socket.IO.

### Tahap 2: Persiapan Bot (Bot2)
- Bot membuka folder session yang sesuai di `session_data`.
- Bot menavigasi ke `netflix.com/tv2`.
- Jika belum terlogin:
    - Bot memicu flow "Reset Password" (Login Help).
    - Bot menunggu Link Login dari email (via GAS/Email Service).
    - Bot mengklik link tersebut untuk mendapatkan session login.
    - Bot kembali/navigasi ke `netflix.com/tv2`.

### Tahap 3: Interaksi PIN (Bot & Dashboard)
- Bot mendeteksi input PIN 8-digit di halaman Netflix.
- Bot mengirim event `AWAITING_TV_PIN` ke Dashboard via Socket.IO.
- Dashboard menampilkan notifikasi di pojok kanan atas dan membuka modal input 8-digit.
- Bot masuk ke status **Wait (5 Menit)**.

### Tahap 4: Eksekusi
- Admin memasukkan 8 angka dan klik "Kirim".
- Dashboard mengirim PIN ke Bot.
- Bot mengetik PIN satu per satu (bukan paste) ke input Netflix.
- Bot klik tombol **"LANJUT"**.
- Bot menunggu redirect ke URL `netflix.com/tv/out/success`.
- Bot klik tombol **"Go to Netflix"** (`btn-witcher-navigate-home`) untuk memfinalisasi sesi.
- Bot melaporkan hasil akhir (Berhasil/Gagal) ke dashboard.

---

## 2. Rencana Perubahan Teknis

### A. Dashboard (Frontend)
- **Komponen**: Tambahkan `TvPinModal` yang berisi 8 kolom input angka (atau 1 input dengan filter 8 digit).
- **Notifikasi**: Integrasi dengan `sonner` atau sistem notifikasi internal untuk menampilkan pesan "Bot menunggu kode TV".
- **Trigger**: Tambahkan tombol `MonitorPlay` atau icon TV di bawah tombol Auto Upgrade.

### B. API Server (Backend)
- **Task Queue**: Tambahkan context `NETFLIX_LOGIN_TV`.
- **Socket.IO**: Tambahkan handler untuk meneruskan PIN dari Dashboard ke ID Bot yang sedang spesifik menjalankan tugas tersebut.

### C. Bot (Bot2)
- **NetflixModule**: Tambahkan method `loginTvFlow()`.
- **Locator**: Tambahkan selector untuk `pin-number-0` s/d `pin-number-7` dan `witcher-code-submit`.
- **Logic**: Implementasikan pengetikan manual menggunakan `page.type()` dengan delay kecil antar karakter.

---

## 3. Detail Elemen UI (Locators)
- **Input PIN**: `input[data-uia^="pin-number-"]`
- **Tombol Lanjut**: `button[data-uia="witcher-code-submit"]`
- **URL Sukses**: `https://www.netflix.com/tv/out/success`
- **Tombol Final**: `button[data-uia="btn-witcher-navigate-home"]`
- **Error Message**: `div[data-uia="UIMessage-content"]` yang berisi teks "Kode tersebut salah".

---

## 4. Penanganan Kegagalan (Fallback)
- **Timeout**: Jika dalam 5 menit PIN tidak dikirim, bot akan membatalkan tugas dengan status `FAILED` (Reason: User Timeout).
- **Wrong PIN**: Jika Netflix menolak kode, bot akan mengirim pesan "Kode Salah" ke dashboard dan admin bisa mencoba mengirim ulang kode baru selama sesi 5 menit belum habis.
