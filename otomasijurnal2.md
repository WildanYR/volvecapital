# Arsitektur Automasi Jurnal (Amortisasi Persediaan & Pendapatan)

Konsep yang Anda jelaskan sudah 100% tepat sasaran secara kaidah akuntansi modern (*Accrual Basis Accounting*). 

Berikut adalah rancangan arsitektur teknis bagaimana kita bisa membangunkannya ke dalam sistem VolveCapital, beserta struktur Bagan Akun (COA) spesifik untuk produk-produk Netflix yang Anda miliki.

---

## 1. Alur Logika Sistem (Studi Kasus: Netflix Harian)

Misal Anda membeli 1 Akun Netflix Premium (berisi 5 Profil, asumsi masa aktif 30 hari) seharga Rp 54.000.  
Total kapasitas jualan Anda = 5 profil × 30 hari = **150 slot-hari**.  
Maka, Modal / HPP per profil untuk 1 hari = Rp 54.000 / 150 = **Rp 360 / hari**.  
Lalu Anda menjualnya secara eceran per profil seharga Rp 5.000 / hari kepada pembeli.

### A. Saat Membeli Stok (Kulakan 1 Akun Netflix)
Sistem mencatat pengeluaran dan "menimbun" nilai aset (kapasitas 150 hari) sebelum dijual.
* **Jurnal Terbentuk:**
  * (Debit) 1060 - Persediaan Netflix Harian: Rp 54.000
  * (Kredit) 1010 - Kas Utama / Bank: Rp 54.000

### B. Saat Terjadi Penjualan (Pembeli Bayar Langganan 1 Profil untuk 1 Hari)
Saat transaksi *checkout* berstatus PAID, sistem akan mencatat uang masuk namun menempatkannya di akun Kewajiban sementara.
* **Jurnal Terbentuk:**
  * (Debit) 1010 - Kas Utama (Payment Gateway): Rp 5.000
  * (Kredit) 2010 - Pendapatan Diterima Di Muka (Netflix Harian): Rp 5.000

### C. Saat Layanan Selesai (Automasi Amortisasi Harian)
Ini adalah peran utama **"Robot Automasi"** kita. Setelah masa layanan selesai (1 hari = 24 jam untuk profil tersebut), sistem otomatis menembakkan jurnal pengakuan *(Realized)*.
* **Jurnal Otomatis 1: Pengakuan Pendapatan (Revenue)**
  * (Debit) 2010 - Pendapatan Diterima Di Muka (Netflix Harian): Rp 5.000
  * (Kredit) 4010 - Pendapatan Penjualan Netflix Harian: Rp 5.000
* **Jurnal Otomatis 2: Pengakuan Beban Pokok (COGS/HPP)**
  *(Sistem mencatat pemakaian 1 slot-hari dengan modal Rp 360)*
  * (Debit) 5010 - HPP Netflix Harian: Rp 360
  * (Kredit) 1060 - Persediaan Netflix Harian: Rp 360

---

## 2. Kebutuhan Perubahan Database (Schema)

Agar automasi ini berjalan dinamis tanpa '*hardcode*', tabel pengaturan produk kita perlu ditambah kolom konfigurasinya. Saat ini di tabel `product_variant` hanya ada `expense_coa_id`. Kita perlu ekspansi menjadi 4 kolom inti untuk *auto-journaling*:
1. `inventory_coa_id` (Koneksi ke Aset Persediaan, misal: 1060)
2. `deferred_revenue_coa_id` (Koneksi ke Kewajiban, misal: 2010)
3. `revenue_coa_id` (Koneksi ke Pendapatan Riil, misal: 4010)
4. `expense_coa_id` (Koneksi ke HPP, misal: 5010 - sudah ada)

Selain itu, kita butuh tabel antrean (misalnya tabel `AmortizationQueue`) untuk mencatat: *Transaksi ID #001 harus diamortisasi sebesar Rp 10.000 pada tanggal besok jam 23:59.*

---

## 3. Arsitektur Layanan (Cron Job & Task Queue)

Implementasi "*Robot Automasi*" terbaik untuk kasus ini adalah memadukan **NestJS Task Scheduler (Cron)** dengan **Message Queue (BullMQ / Redis)**.
* **On Checkout:** Saat invoice PAID, sistem langsung mendaftarkan jadwal (*Schedule Event*) ke BullMQ dengan parameter `delay`. Jika beli paket 1 hari, *delay* = 24 jam. Jika 1 bulan, *delay* = 30 hari.
* **On Processing:** Tepat pada waktu *delay* habis, *Worker* BullMQ akan aktif dan langsung menembak API pembentukan jurnal ke modul Akuntansi, memindahkan saldo dari Kewajiban ke Pendapatan.

---

## 4. Seed Bagan Akun (COA) yang Disarankan

Untuk mempermudah pelacakan laba-rugi setiap varian (apakah varian Harian lebih untung dari Bulanan?), saya sangat menyarankan setiap varian memiliki "Grup Akun" *(Account Bundle)* masing-masing.

Saat kita mengaktifkan sistem ini, kita akan injeksikan *seed* COA berikut ke *database*:

**Kelompok Aset Lancar (Persediaan Digital)**
* **1060** - Persediaan Netflix Harian (Debit)
* **1061** - Persediaan Netflix Mingguan (Debit)
* **1062** - Persediaan Netflix Bulanan (Debit)
* **1063** - Persediaan Netflix Sharing Bulanan (Debit)

**Kelompok Kewajiban Lancar (Deferred Revenue)**
* **2010** - Pendapatan Diterima di Muka - Netflix Harian (Kredit)
* **2011** - Pendapatan Diterima di Muka - Netflix Mingguan (Kredit)
* **2012** - Pendapatan Diterima di Muka - Netflix Bulanan (Kredit)
* **2013** - Pendapatan Diterima di Muka - Netflix Sharing (Kredit)

**Kelompok Pendapatan Penjualan**
* **4010** - Pendapatan Realisasi Netflix Harian (Kredit)
* **4011** - Pendapatan Realisasi Netflix Mingguan (Kredit)
* **4012** - Pendapatan Realisasi Netflix Bulanan (Kredit)
* **4013** - Pendapatan Realisasi Netflix Sharing Bulanan (Kredit)

**Kelompok Harga Pokok Penjualan (HPP)**
* **5010** - HPP Netflix Harian (Debit)
* **5011** - HPP Netflix Mingguan (Debit)
* **5012** - HPP Netflix Bulanan (Debit)
* **5013** - HPP Netflix Sharing Bulanan (Debit)

### Manfaat Pemecahan COA Ini:
Dengan setup 4 paket akun di atas, sistem secara otomatis akan melahirkan **Laporan Laba/Rugi (*Profit & Loss*) yang sangat granular**. Anda bisa membuka laporannya dan melihat langsung:
> *"Bulan ini profit kotor Netflix Harian Rp 2.000.000, tapi Netflix Bulanan merugi Rp 500.000"*, 

karena data pendapatan dan HPP-nya tidak tercampur dalam satu wadah.
