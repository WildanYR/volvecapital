# Rancangan Sistem Auto-Jurnal (Integrasi Transaksi & Akuntansi)

Saat ini, transaksi yang Anda buat baik melalui input manual maupun dari Landing Page/Shopee **belum tercatat ke Jurnal Umum** karena modul Transaksi (`Transaction`) dan modul Akuntansi (`Accounting`) masih berdiri sendiri-sendiri (belum ada "jembatan" atau *Event Listener* yang menghubungkannya).

Untuk melacak pendapatan spesifik per **Varian Produk** dan melacak uang masuk secara spesifik per **Metode Pembayaran/Channel**, kita memerlukan arsitektur pemetaan COA (*COA Mapping*) yang dinamis dan terstruktur.

Berikut adalah saran implementasi profesional (*best practices*) yang biasa digunakan pada sistem ERP/Keuangan modern:

---

## 1. Konsep Pemetaan COA (COA Mapping)

Agar jurnal dapat terbentuk secara otomatis tanpa perlu *hardcode* di dalam sistem, kita harus memberikan kebebasan kepada Anda (sebagai *admin*) untuk mengatur pemetaan akun.

### A. Pemetaan Pendapatan (Revenue Mapping)
Setiap **Varian Produk** (atau minimal Produk) harus memiliki kolom khusus untuk menyimpan *ID Akun Pendapatan*.
- **Tabel `product_variant`** ditambahkan kolom: `income_coa_id` (Relasi ke tabel `coa`).
- *Contoh:* Varian "Netflix Harian" di-*setting* agar `income_coa_id`-nya menunjuk ke akun **"401 - Pendapatan Netflix Harian"**.

### B. Pemetaan Kas/Bank (Asset Mapping)
Setiap **Metode Pembayaran** atau **Channel Penjualan** harus memiliki *ID Akun Kas/Bank*.
- Kita bisa membuat tabel referensi baru (misal: `payment_channel_setting`) atau menambahkannya di tabel konfigurasi yang sudah ada.
- *Contoh Mapping:*
  - Pembayaran via "Shopee" $\rightarrow$ **"101 - Kas ShopeePay"**
  - Pembayaran via "BNI Virtual Account" (Landing Page) $\rightarrow$ **"102 - Bank BNI"**
  - Pembayaran via "Manual/Cash" $\rightarrow$ **"100 - Kas Kecil"**

---

## 2. Alur Kerja (Workflow) Auto-Jurnal

Ketika ada transaksi baru yang statusnya berubah menjadi **LUNAS (PAID/COMPLETED)**, sistem akan menjalankan fungsi `AccountingService.createJournalEntry()` di latar belakang dengan logika berikut:

**Skenario 1: Transaksi Netflix Harian via Landing Page (Bank BNI)**
1. **Debit**: `Asset COA` dari metode pembayaran "Bank BNI" (Misal: Rp 5.000)
2. **Kredit**: `Income COA` dari varian produk "Netflix Harian" (Misal: Rp 5.000)

**Skenario 2: Transaksi Spotify Bulanan via Shopee**
1. **Debit**: `Asset COA` dari channel "Shopee" (Misal: Rp 40.000)
2. **Kredit**: `Income COA` dari varian produk "Spotify Bulanan" (Misal: Rp 40.000)

---

## 3. Rencana Implementasi (Langkah demi Langkah)

Jika Anda menyetujui rancangan ini, kita akan melakukan langkah-langkah implementasi (Sprint) berikut:

### Tahap 1: Modifikasi Database & Entity
- [ ] Membuat *migration* untuk menambahkan kolom `income_coa_id` pada tabel `ProductVariant` (atau `Product`).
- [ ] Membuat tabel/konfigurasi `payment_method_coa` untuk menyimpan relasi antara Nama Metode Pembayaran dengan `asset_coa_id`.

### Tahap 2: Modifikasi UI Dashboard (Admin)
- [ ] Pada menu **Edit Varian Produk**, tambahkan *dropdown* "Akun Pendapatan" (memilih dari COA tipe PENDAPATAN).
- [ ] Buat satu halaman pengaturan kecil di akuntansi untuk mengatur "Pemetaan Akun Bank/Metode Pembayaran" (memilih dari COA tipe ASET).

### Tahap 3: Pembuatan Sistem Trigger (Event Listener)
- [ ] Modifikasi *Service Transaksi* backend: Ketika fungsi penyelesaian transaksi/webhook dipanggil dan berstatus LUNAS, ambil data produk dan metode pembayarannya.
- [ ] Tarik `income_coa_id` dan `asset_coa_id` terkait.
- [ ] Panggil `createJournalEntry` secara otomatis dengan parameter di atas. Jika gagal, transaksi di-*rollback* atau dicatat ke log error.

---

### Diskusi / Keputusan yang Dibutuhkan dari Anda:
1. **Level Pemetaan Pendapatan**: Apakah pemetaan Akun Pendapatan cukup di level **Produk Utama** (misal: "Netflix" secara umum) atau wajib sangat spesifik hingga level **Varian** (misal dibedakan antara "Netflix Harian" dan "Netflix Bulanan")? 
2. **Pemetaan Diskon/Biaya Admin (Opsional)**: Jika ada transaksi Rp 50.000 tapi ada biaya potongan *payment gateway* (misal Midtrans memotong Rp 4.000), apakah pencatatannya ingin diringkas (Kas terima bersih Rp 46.000), atau dirinci (Kas Rp 46.000, Biaya Admin Rp 4.000, Pendapatan Rp 50.000)?

*Mohon berikan masukan Anda untuk kedua pertanyaan di atas agar implementasi jurnal otomatisnya benar-benar sesuai dengan gaya pembukuan yang Anda inginkan.*
