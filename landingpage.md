bantu aku membuat sebuah landing page diluar dashboard ini ya soalnya localhost:3000 masih kosong hanya memunculkan logo volvecapital. Buat landing page untuk penjualan voucher streaming seperti spotify, netflix, dll
referensi bisa liat di rapartonline.com tapi tolong dibuat jauh lebih modern dari itu.

## 🎯 TUJUAN UTAMA

Buat sistem dimana:

1. User bisa membeli voucher berdasarkan produk dan varian (contoh: Netflix 1 Bulan)
2. User mendapatkan kode voucher setelah pembayaran
3. User melakukan redeem voucher
4. Sistem otomatis mengalokasikan akun + profile
5. User langsung mendapatkan akses akun (email, password, profile)

---

## 🧱 TEKNOLOGI YANG DIGUNAKAN

Frontend:

* Next.js (App Router)
* TailwindCSS
* Framer Motion (untuk animasi)

Backend:

* Node.js + Express
* PostgreSQL
* Sequelize ORM

---

## 🎨 STRUKTUR LANDING PAGE (WAJIB DIIKUTI)

Desain harus:

* Bersih (clean)
* Modern seperti SaaS
* Minimalis
* Fokus ke conversion (jualan)

---

### 1. HERO SECTION

* Headline: “Akses Aplikasi Premium Secara Instan”
* Subheadline: “Netflix, Spotify, Viu dan lainnya — tanpa ribet login”
* Tombol CTA:

  * “Beli Voucher”
  * “Redeem Voucher”
* Tambahkan animasi background (gradient bergerak atau elemen floating)

---

### 2. USER SPLIT SECTION (PENTING)

Pisahkan user menjadi 2:

#### A. Sudah punya voucher

* Input kode voucher
* Tombol: Redeem Sekarang

#### B. Belum punya voucher

* Tombol: Lihat Produk

---

### 3. CARA KERJA (3 LANGKAH)

Gunakan icon + animasi:

1. Beli Voucher
2. Dapatkan Kode
3. Redeem & Akses

Tambahkan animasi scroll (fade in + slide up)

---

### 4. SECTION PRODUK

Tampilkan dalam bentuk card:

Isi:

* Nama produk (Netflix, Spotify, dll)
* Varian (1 Bulan, 3 Bulan)
* Harga
* Tombol: Beli Sekarang

---

### 5. TRUST SECTION

Tampilkan keunggulan:

* Akses instan
* Pembayaran aman
* Support 24 jam
* Tanpa login akun pribadi

---

### 6. TESTIMONI

* Card sederhana berisi review user

---

### 7. FAQ

* Model accordion (bisa buka tutup)

---

### 8. FOOTER

* Menu: Beli, Redeem, FAQ, Kontak

---

## ✨ UI/UX REQUIREMENT

* Gunakan border radius besar (rounded-2xl)
* Shadow halus
* Animasi smooth (Framer Motion)
* Hover effect (scale, shadow)
* Responsive (mobile-first)
* Warna modern (dark mode + gradient)

---

## 🔄 FLOW SISTEM (WAJIB SESUAI INI)

---

### 1. FLOW BELI VOUCHER

Saat user klik “Beli Sekarang”:

* Buat data transaction
* Buat transaction_item
* Generate kode voucher

Struktur tabel voucher:

* id (kode voucher unik)
* product_variant_id
* status (UNUSED / USED)
* expired_at
* transaction_item_id
* created_at
* updated_at

Setelah pembayaran:

* Kirim voucher ke user (email / WhatsApp)

---

### 2. FLOW REDEEM VOUCHER

User input kode voucher:

Validasi:

* Voucher ada
* Status UNUSED
* Belum expired

---

### 3. AUTO ALOKASI AKUN (CORE SYSTEM)

Sistem harus:

1. Cari account:

   * status = “ready”
   * sesuai product_variant_id

2. Cari profile:

   * allow_generate = true
   * slot belum penuh

3. Insert ke account_user:

   * name
   * expired_at = sekarang + durasi

4. Update transaction_item:

   * isi account_user_id

5. Update voucher:

   * status = USED

---

### 4. HASIL KE USER

Tampilkan:

* Email akun
* Password
* Nama profile
* Masa aktif

Gunakan template dari:
product_variant.copy_template

---

## ⚠️ HANDLE ERROR

* Jika akun tidak tersedia → tampilkan “Stok habis”
* Jika voucher tidak valid → tampilkan error
* Jika voucher sudah dipakai → tolak

---

## 🎬 ANIMASI (WAJIB ADA)

* Fade in saat load halaman
* Animasi scroll per section
* Hover tombol (scale up)
* Hover card (terangkat)
* Background animasi gradient

---

## 📱 HALAMAN YANG HARUS ADA

1. Landing Page (/)
2. Halaman Beli (/buy)
3. Halaman Redeem (/redeem)
4. Halaman Success (/success)

---

## 🎯 HASIL AKHIR

Website harus terasa seperti:

* Produk SaaS premium
* Cepat, simpel, dan fokus jualan
* Lebih modern dari RapatOnline.com
* Siap untuk scale banyak produk

Pastikan code clean, modular, dan siap production.

tolong bantu buatkan implementasi diatas di file sistemvoucher.md, jangan langsung mulai ngoding dulu
oiya saya mau pakai midtrans untuk payment gateway nya
