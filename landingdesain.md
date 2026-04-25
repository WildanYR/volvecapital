## Desain & UI/UX (Estetika Premium)
Tampilan harus terlihat mahal dan profesional:
- **Landing Page (High-Conversion Structure)**:
    - **Visual Style**: Dark mode premium dengan aksen warna brand yang kuat, glassmorphism, dan background blur blobs yang dinamis. Gunakan `framer-motion` untuk efek *fade-in* dan *staggered children*.
    - **Hero Section**:
        - Badge (misal: "Sistem Voucher Otomatis 24/7").
        - Headline utama menggunakan font black/extra-bold dengan teks gradien.
        - Sub-headline persuasif dan CTA utama (Redeem Voucher & Lihat Produk).
        - Social Proof Mini (misal: "2.000+ Pelanggan", "4.9/5 Rating").
    - **Section Pilihan User (Decision Split)**
    ada 2 container :
          1.  Container kiri:  "Sudah Punya Kode?"
              - Langsung tukarkan kode voucher Anda dan dapatkan layananmu seketika.
              - CTA : redeem now ==> kalo diklik masuk ke halaman redeem /redeem
          2.  Container kanan: "Belum Punya Kode?"
              - Temukan layanan premium yang kamu butuhkan.
              - CTA : buy now ==> kalo diklik masuk ke halaman produk /product
    - **Cara Kerja (3 Step)**
    Buat bagian ini untuk menjelaskan alur transaksi dengan singkat & visual:
    1.  Pilih Variant & Bayar ==> customer memilih produk yang di inginkan lalu melakukan pembayaran
    2.  Dapatkan Kode Voucher Otomatis ==> setelah pembayaran berhasil customer mendapatkan kode voucher otomatis
    3.  Langsung Redeem & Aktifasi ==> customer langsung menukar kode voucher dan mendapatkan layanan
    - **produk section** 
    section ini menampilkan card produk 3 terlaris (sesuaikan dengan data di table product_variant)
    PAKET POPULER KAMI 
    Pilih paket sesuai kebutuhanmu dan dapatkan akses instan ke layanan premium pilihan.
    CTA card pilih paket ==> masuk ke halaman produk /produk/produk-variant
    dibawah 3 card tadi ada CTA "Lihat semua paket" ==> masuk ke halaman produk /product
    - **Value Proposition Section*
    Kenapa harus pilih kami?
    disini nanti diisi value proposition seperti:
    1.Tanpa login
    2.Pembayaran instan (QRIS, dll)
    3.Aktif 24 jam
    4.Support WhatsApp
    5.Legal Full Garansi

    - **Testimoni**
    Testimoni pelanggan di sini (sesuaikan dengan data dari file JSON atau hardcode untuk MVP).
    Disini ada 4 card testimoni
    - **Footer**
    Footer harus berisi: Slogan, Copyright, Link ke halaman Disclaimer & Privacy Policy.

- **Halaman Redeem (`/redeem`)
    Tampilan seperti ini:
    - Bagian Atas: Judul "Tukar Kode Voucher".
    - Form: Input Voucher Code, Tombol "Tukar Voucher".
    - Setelah Redeem: Tampilkan detail layanan dan username/email akun yang didapatkan.
    - CTA: "Buka Layanan Sekarang" → link ke halaman login resmi service (Netflix, Spotify, dll).   

- **Halaman Produk (`/product`)
    Disini menampilkan card produk dengan format sebagai berikut:
    - Nama produk
    - Harga
    - Deskripsi singkat
    - Durasi (misal: 1 Bulan, 3 Bulan, dst)
    - CTA "Beli Sekarang" ==> kalo diklik masuk ke halaman produk /product/produk-variant    

- **Halaman Produk Variant (`/product/produk-variant`)
    Tampilan seperti ini:
    - Bagian Atas: Logo dan Judul "Produk Variant".
    - Form: Input Produk Variant ID, Tombol "Beli Sekarang".
    - Setelah Beli: Tampilkan detail layanan dan username/email akun yang didapatkan.
    - CTA: "Buka Layanan Sekarang" → link ke halaman login resmi service (Netflix, Spotify, dll).               



saya mau kamu merombak semua tampilan landing page ini. buat yang clean dan mobile friendly.  