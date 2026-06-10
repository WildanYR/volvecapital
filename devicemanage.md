# Analisa Sistem Login & Manajemen Perangkat (Device Management)

## 1. Analisa Kondisi Saat Ini (Apakah Device Lain Ikut Logout?)
Dari hasil analisa terhadap sistem keamanan aplikasi saat ini (khususnya pada file `vc-auth.guard.ts` dan `token.provider.ts`), aplikasi ini menggunakan **Stateless JWT (JSON Web Token)**. 
Artinya, ketika user berhasil login, server memberikan sebuah tiket (token) yang disimpan di perangkat user. Server **tidak mencatat** tiket ini di database. Setiap kali perangkat tersebut melakukan *request*, server hanya mengecek apakah tiketnya asli dan belum *expired* (kedaluwarsa).

**Kesimpulan:** 
Saat ini, jika Anda **mengubah password**, perangkat/device lain yang sebelumnya sudah login **TIDAK AKAN OTOMATIS TER-LOGOUT**. Mereka masih bisa mengakses sistem menggunakan tiket/token lama mereka sampai token tersebut kedaluwarsa secara natural.

---

## 2. Rencana Implementasi Fitur Manajemen Device & Logout Spesifik

Untuk memenuhi kebutuhan Anda agar bisa:
1. Menentukan apakah ingin me-logout semua device saat ganti password (lewat *checkbox*).
2. Memantau device apa saja yang sedang ter-login (seperti Netflix).
3. Meng-kick (logout) device tertentu.

Kita harus mengubah sistem yang awalnya murni *stateless* (tanpa pencatatan) menjadi **Stateful Session Tracking**. Berikut adalah langkah-langkah implementasinya:

### Langkah 1: Pembuatan Tabel Database Baru (`DeviceSession`)
Kita perlu membuat sebuah tabel baru di database untuk mencatat setiap sesi login.
Kolom yang dibutuhkan:
- `id`: UUID unik untuk sesi.
- `user_id`: ID dari staff atau owner yang login.
- `device_info`: Menyimpan informasi detail seperti `"PC Chrome - Browser Web"` atau `"Realme - Ponsel Android"`. Didapatkan dari header *User-Agent* saat login.
- `ip_address`: Untuk melacak IP.
- `last_active_at`: Waktu terakhir device melakukan aktivitas.
- `is_revoked`: Status `boolean`. Jika `true`, maka sesi ini telah di-kick atau di-logout.

### Langkah 2: Modifikasi Proses Login & Pengecekan Akses (Auth Guard)
- **Saat Login:** Selain membuat JWT Token, server juga mencatat detail device ke tabel `DeviceSession`. ID sesi ini akan dimasukkan ke dalam JWT (`session_id`).
- **Saat Request API (Auth Guard):** Setiap kali user mengakses web, sistem mengecek ke tabel `DeviceSession` apakah `session_id` tersebut statusnya `is_revoked == true`. Jika iya, maka akses ditolak dan user otomatis ter-logout.

### Langkah 3: Modifikasi Fitur Ganti Password
- Menambahkan parameter *checkbox* `logout_all_devices` di endpoint *Ubah Password*.
- Jika dicentang, maka server akan mencari semua sesi aktif milik user tersebut di tabel `DeviceSession` dan mengubah statusnya menjadi `is_revoked = true` (kecuali sesi yang sedang dipakai saat ini).

### Langkah 4: Endpoint API Manajemen Device
Membuat endpoint API baru untuk halaman "Kelola Akses dan Perangkat":
- `GET /dashboard/device-sessions`: Mengambil daftar device yang sedang aktif.
- `POST /dashboard/device-sessions/:id/revoke`: Tombol **Keluar / Kick** untuk mematikan satu device spesifik.

### Langkah 5: Penambahan Tampilan di UI (Frontend)
- **Halaman Pengaturan Akun:** Menambah *checkbox* "Keluarkan saya dari semua perangkat" di form Ubah Password.
- **Halaman Kelola Perangkat:** Membuat tampilan list perangkat dengan icon yang sesuai (PC/Mobile), info waktu aktif terakhir (misal: `05/06/26, 08.51 WIB`), informasi browser/OS, dan tombol **"Keluar"** di masing-masing *card* seperti di Netflix.
