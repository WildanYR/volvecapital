# Walkthrough: Fitur Link Login Netflix (Termasuk Aksi Massal)

Semua implementasi untuk fitur "Dapatkan Link Login Netflix" telah selesai dikerjakan, baik untuk *single action* (satu akun) maupun *bulk action* (aksi massal beberapa akun sekaligus).

## Changes Made

### 1. Backend (`apps/api`)
- **Controller Endpoint**: Menambahkan dua endpoint baru di `account.controller.ts`:
  - `GET /account/:id/netflix-links` untuk mengambil link satu akun spesifik.
  - `POST /account/bulk-netflix-links` untuk mengambil link beberapa akun secara bersamaan (aksi massal).
- **Service Logic**: Mengimplementasikan logika pembacaan file JSON session Netflix langsung dari direktori `apps/bot2/session_data`. Algoritmanya akan mencari cookie `NetflixId`, mengekstrak parameter `ct`, lalu menormalkan Base64-nya menjadi nilai `nftoken` yang valid untuk disisipkan ke dalam 4 varian URL (PC, Mobile, TV, General). 

### 2. Frontend (`apps/dashboard`)
- **API Service**: Menambahkan metode pemanggilan `getNetflixLinks` dan `getBulkNetflixLinks` di klien API dashboard.
- **UI Integration**: 
  - Menyisipkan menu **"Dapatkan Link Login"** di bawah *Login TV* pada *dropdown* aksi untuk tiap *card* akun individu.
  - Menyisipkan menu **"Bulk Link Login"** pada menu aksi massal (*Bulk Action*).
- **Modal Dialog**: Membuat pop-up (*Dialog*) interaktif yang akan menampilkan status *loading* ketika dipanggil, dan menampilkan hasil berupa 4 tipe *link* untuk masing-masing akun. Terdapat tombol khusus berlogo *Copy* agar *link* bisa langsung tersalin ke *clipboard* untuk segera kamu pakai, menjadikan alur kerjamu lebih *seamless*.

## Validation Results
- Path ke folder sesi bot (`apps/bot2/session_data`) telah disesuaikan dengan struktur *monorepo*.
- UI komponen pop-up dipastikan menampilkan peringatan ("*Cookie tidak ditemukan*") jika sewaktu-waktu data *session* belum sinkron atau tidak valid, menghindarkan UI dari kerusakan akibat nilai *undefined*.

> [!TIP]
> **Siap Dicoba!**
> Segarkan (Auto Reload) dashboard kamu. Kamu sekarang bisa menyeleksi beberapa akun lalu memilih **Bulk Link Login** dari menu **Aksi Massal** untuk memunculkan modal daftar *link*. Silakan diuji, kalau ada masalah kecil (misal tata letak UI kurang rapi), beri tahu aku!
