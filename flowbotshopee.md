# Alur Kerja Bot Shopee Order Automation

Dokumen ini menjelaskan alur kerja lengkap dari **ShopeeOrderModule** di `bot2`, mulai dari pendeteksian pesanan baru hingga pengiriman akun ke pembeli secara otomatis.

## 1. Tahap Inisialisasi & Login
Saat bot dijalankan, modul Shopee akan melakukan langkah-langkah berikut:
- **Cek Sesi**: Bot memeriksa apakah ada sesi login yang tersimpan (`shopee_session`).
- **Halaman Login**: Jika belum login, bot menuju halaman login Shopee Seller Centre.
- **Input Kredensial**: Bot mengisi `loginKey` dan `password` dari file `config.toml`.
- **Penanganan Verifikasi (OTP)**: Jika Shopee meminta verifikasi (WA/SMS), bot akan berhenti sejenak dan memberikan waktu hingga 10 menit bagi user untuk melakukan verifikasi manual di browser bot.
- **Penyimpanan Sesi**: Setelah berhasil masuk, sesi disimpan agar bot tidak perlu login ulang di kemudian hari.

## 2. Pemindaian Pesanan (Loop Utama)
Bot berjalan dalam putaran (*loop*) terus-menerus (default setiap 30 detik):
- **Masuk ke Daftar Pesanan**: Bot membuka halaman "Pesanan Saya" di Shopee.
- **Filter "Perlu Dikirim"**: Bot memastikan berada di tab pesanan yang perlu diproses.
- **Ekstraksi ID Pesanan**: Bot membaca semua ID Pesanan yang muncul di daftar.
- **Penyaringan Database**: Bot membandingkan ID tersebut dengan database lokal (`bot.db`). Jika ID belum pernah diproses, maka akan dimasukkan ke dalam antrean (*Queue*).

## 3. Pemrosesan Detail Pesanan (Task Handler)
Untuk setiap ID Pesanan baru, bot membuka halaman detail pesanan:
- **Cek Status**: Memastikan pesanan belum diproses manual atau dibatalkan.
- **Ambil Data Pembeli**: Mengambil username pembeli.
- **Ambil Data Produk**: Membaca nama produk, variasi, dan jumlah (Quantity) yang dibeli.
- **Hitung Total Harga**: Membaca nominal total belanja.

## 4. Proses Pengiriman (Atur Pengiriman)
Bot mensimulasikan klik untuk memproses pesanan di Shopee:
- **Klik Tombol Kirim**: Bot mencari tombol "Kirim" atau "Atur Pengiriman".
- **Konfirmasi**: Mengklik konfirmasi pada modal pengiriman (biasanya untuk pengiriman *non-integrated* atau *digital*).
- **Update Status**: Bot menandai status internal menjadi `processing`.

## 5. Integrasi ke API Platform (Volve Capital)
Bot berkomunikasi dengan server API pusat:
- **Cek Mapping Produk**: Bot mengirimkan nama produk Shopee ke API untuk mendapatkan `product_variant_id` yang sesuai di database server.
- **Generate Transaksi & Akun**: Bot mengirimkan data (Username, Order ID, Produk ID) ke API.
- **Terima Akun**: Server API akan mencarikan akun (Netflix/Spotify/dll) yang tersedia dan mengirimkan detailnya kembali ke bot.

## 6. Pengiriman Akun via Chat Shopee
Setelah mendapatkan detail akun dari API:
- **Buka Chat**: Bot mengklik tombol "Chat Sekarang" di halaman detail pesanan Shopee.
- **Susun Pesan**: 
    - Mengambil template pesan pembuka (`message_before`).
    - Memasukkan detail akun (Email, Password, Profil, PIN).
    - Mengambil template pesan penutup (`message_after`).
- **Kirim Pesan**: Bot mengisi kotak chat dan menekan `Enter` untuk setiap baris pesan.
- **Selesai**: Jika berhasil, status pesanan diubah menjadi `success` di database lokal.

## 7. Penanganan Kegagalan (Fallback)
- **Retry**: Jika terjadi error (misal jaringan lemot), bot akan mencoba ulang hingga 3 kali.
- **Pesan Gagal**: Jika akun tidak tersedia di server atau terjadi error permanen, bot akan mengirimkan pesan `message_fallback` ke pembeli (misal: "Pesanan sedang diproses manual, mohon tunggu").
- **Log Error**: Semua kegagalan dicatat dalam log sistem untuk audit.

---
**Catatan**: Modul ini memerlukan browser dalam mode *headed* (tidak *headless*) pada saat login pertama kali jika ada verifikasi OTP/Captcha.
