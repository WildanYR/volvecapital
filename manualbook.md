# Manual Book: Panduan Endpoint Dashboard Admin

Selamat datang di tim! Dokumen ini dibuat untuk membantu kamu memahami struktur dan fungsi dari setiap halaman (endpoint) yang ada di panel dashboard admin kita. 

Berikut adalah penjelasan fungsi dari masing-masing endpoint:

### 1. `/dashboard`
**Fungsi:** Halaman Utama (Beranda / Overview)
**Deskripsi:** Ini adalah halaman pertama yang kamu lihat saat berhasil login. Halaman ini berfungsi sebagai pusat informasi (dashboard summary) yang menampilkan ringkasan data penting, statistik performa, grafik penjualan, atau metrik utama lainnya agar kita bisa memantau kondisi bisnis secara cepat.

---

### 2. `/dashboard/product`
**Fungsi:** Manajemen Produk Utama
**Deskripsi:** Halaman ini digunakan untuk mengelola katalog produk yang kita jual. Di sini kamu bisa:
- Melihat daftar semua produk.
- Menambahkan produk baru.
- Mengubah informasi produk (seperti harga, deskripsi, gambar, dan stok).
- Menghapus atau menonaktifkan produk.

---

### 3. `/dashboard/platform-product`
**Fungsi:** Manajemen Produk Platform / Layanan
**Deskripsi:** Halaman ini khusus untuk mengatur produk-produk bawaan platform, produk digital, layanan berlangganan, atau produk dari mitra pihak ketiga (third-party). Biasanya ini dipisahkan dari produk fisik atau reguler untuk memudahkan pengelolaan sistem internal.

---

### 4. `/dashboard/email`
**Fungsi:** Pengaturan & Manajemen Kampanye Email
**Deskripsi:** Halaman ini digunakan untuk mengelola segala hal terkait email secara umum. Fungsi utamanya meliputi:
- Mengatur template email yang akan dikirim ke pengguna (misal: email selamat datang, email reset password).
- Mengatur konfigurasi pengiriman email (SMTP).
- Mengelola daftar kampanye email promosi.

---

### 5. `/dashboard/account`
**Fungsi:** Manajemen Akun Pengguna
**Deskripsi:** Halaman ini menampilkan daftar seluruh pengguna (klien/pelanggan) yang terdaftar di platform kita. Di sini kamu bisa mencari pengguna, melihat status akun (aktif/suspend), dan memantau pertumbuhan jumlah pengguna.

---

### 6. `/dashboard/account/slug`
**Fungsi:** Detail Akun Spesifik
**Deskripsi:** `slug` di sini merujuk pada ID unik atau nama pengguna tertentu (contoh: `/dashboard/account/johndoe`). Halaman ini berfungsi untuk melihat profil lengkap dari satu pengguna spesifik, termasuk riwayat transaksi mereka, aktivitas akun, dan opsi administratif (seperti memblokir akun atau mereset password pengguna tersebut).

---

### 7. `/dashboard/transaction`
**Fungsi:** Pemantauan Transaksi & Pembayaran
**Deskripsi:** Halaman ini sangat penting untuk operasional keuangan. Berfungsi untuk:
- Memantau semua pesanan dan transaksi yang masuk.
- Mengecek status pembayaran (berhasil, pending, gagal, atau direfund).
- Melakukan verifikasi manual jika ada pembayaran yang bermasalah.

---

### 8. `/dashboard/voucher-generator`
**Fungsi:** Pembuat & Pengelola Voucher Diskon (Manual Generator)
**Deskripsi:** Halaman ini digunakan oleh tim operasional/marketing untuk membuat kode promo atau voucher diskon. Fitur paling penting di halaman ini adalah **Voucher Generator**, yang berfungsi untuk membuat voucher secara manual untuk kebutuhan khusus (misalnya dibagikan langsung ke pelanggan, partner, atau event), yang pembuatannya dilakukan terpisah dan di luar dari sistem otomatis di landing page. Di sini kamu bisa mengatur:
- Pembuatan kode voucher kustom atau otomatis secara massal (generate).
- Jenis diskon (potongan harga tetap atau persentase).
- Kuota batas penggunaan dan masa berlaku (tanggal kedaluwarsa) dari setiap voucher.

---

### 9. `/dashboard/email-message`
**Fungsi:** Manajemen Pesan Email Spesifik / Log Pesan
**Deskripsi:** Berbeda dengan pengaturan template di `/email`, halaman ini biasanya berfokus pada isi pesan (message) itu sendiri. Digunakan untuk melihat riwayat pesan email yang sudah terkirim ke pengguna tertentu, log error jika email gagal terkirim, atau mengelola kotak masuk pesan dari pengguna ke sistem admin.

---

*Jika ada fitur baru yang ditambahkan di masa depan, mohon untuk mengupdate dokumen ini secara berkala.*
