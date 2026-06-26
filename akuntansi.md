# Rencana Implementasi Sistem Akuntansi Profesional

Selamat atas perkembangan bisnis Anda! Membangun sistem akuntansi yang solid adalah langkah yang sangat tepat untuk memastikan bisnis terus berkembang secara terkontrol dan dapat diukur.

Karena Anda awam di bidang akuntansi, kita akan menggunakan pendekatan **Double-Entry Bookkeeping** (Sistem Pembukuan Berpasangan). Ini adalah standar akuntansi global di mana setiap transaksi selalu memengaruhi setidaknya dua akun (Debit dan Kredit) yang jumlahnya harus selalu seimbang (Balance).

Berikut adalah rancangan implementasi sistem akuntansi khusus untuk bisnis Anda:

---

## 1. Fondasi: Chart of Accounts (Bagan Akun)
Langkah pertama yang paling krusial adalah membuat **Chart of Accounts (COA)**. Ini adalah daftar semua akun yang akan digunakan untuk mencatat transaksi. Setiap akun harus memiliki **Kode Akun** yang unik agar lebih profesional, terstruktur, dan mudah dicari.

Akun-akun ini dikelompokkan menjadi kategori utama. Berikut adalah rancangan COA khusus untuk bisnis Anda:

### 1xxx - ASET (HARTA)
*(Debit bertambah, Kredit berkurang)*
| Kode | Nama Akun |
| :--- | :--- |
| 101 | Kas |
| 102 | Bank BCA |
| 103 | Bank BRI |
| 104 | Dana |
| 105 | ShopeePay |
| 106 | Piutang Usaha |
| 107 | Persediaan Akun Premium |
| 108 | Uang Muka Supplier |
| 109 | Perlengkapan Kantor |

### 2xxx - KEWAJIBAN (HUTANG)
*(Kredit bertambah, Debit berkurang)*
| Kode | Nama Akun |
| :--- | :--- |
| 201 | Hutang Supplier |
| 202 | Hutang Gaji |
| 203 | Hutang Pajak |
| 204 | Hutang Operasional |

### 3xxx - EKUITAS (MODAL)
*(Kredit bertambah, Debit berkurang)*
| Kode | Nama Akun |
| :--- | :--- |
| 301 | Modal Owner |
| 302 | Laba Ditahan |
| 303 | Prive Owner |

### 4xxx - PENDAPATAN
*(Kredit bertambah, Debit berkurang)*
| Kode | Nama Akun |
| :--- | :--- |
| 401 | Pendapatan Netflix |
| 402 | Pendapatan YouTube Premium |
| 403 | Pendapatan Canva Pro |
| 404 | Pendapatan ChatGPT Plus |
| 405 | Pendapatan Spotify |
| 406 | Pendapatan Produk Digital Lain |
| 407 | Pendapatan Reseller |

### 5xxx - HARGA POKOK PENJUALAN (HPP)
*(Debit bertambah, Kredit berkurang)*
| Kode | Nama Akun |
| :--- | :--- |
| 501 | HPP Netflix |
| 502 | HPP YouTube Premium |
| 503 | HPP Canva Pro |
| 504 | HPP ChatGPT Plus |
| 505 | HPP Spotify |
| 506 | HPP Produk Digital Lain |

### 6xxx - BEBAN OPERASIONAL
*(Debit bertambah, Kredit berkurang)*
| Kode | Nama Akun |
| :--- | :--- |
| 601 | Beban Gaji CS |
| 602 | Beban Gaji Admin |
| 603 | Beban Bonus Karyawan |
| 604 | Beban Internet |
| 605 | Beban Server/VPS |
| 606 | Beban Domain Hosting |
| 607 | Beban WhatsApp |
| 608 | Beban Proxy |
| 609 | Beban VPN |
| 610 | Beban Shopee Ads |
| 611 | Beban Facebook Ads |
| 612 | Beban TikTok Ads |
| 613 | Beban Admin Bank |
| 614 | Beban Operasional Lain |

*Sistem kita nanti akan mendasarkan semua laporannya dari klasifikasi dan kode COA ini.*

## 2. Arsitektur Sistem (Database)
Untuk membangun ini dalam perangkat lunak (seperti aplikasi Anda yang sudah ada), kita membutuhkan 3 tabel utama di database:

*   **Tabel `accounts` (Akun):** Menyimpan daftar COA di atas. Kolomnya: `id`, **`code` (Kode Akun, misal: '101')**, `name` (Nama Akun), `type` (Tipe Akun: Aset/Kewajiban/dll), dan `normal_balance` (Debit/Kredit).
*   **Tabel `journal_entries` (Jurnal Umum):** Menyimpan header transaksi (ID, Tanggal, Deskripsi/Referensi).
*   **Tabel `journal_lines` (Baris Jurnal):** Menyimpan rincian debit/kredit untuk setiap transaksi. Terhubung dengan `journal_entries` dan `accounts` (via `account_id`). Setiap transaksi akan memiliki minimal 2 baris di sini (satu debit, satu kredit).

## 3. Otomatisasi Pencatatan (Terutama Pendapatan)
Agar pendapatan tercatat otomatis, sistem akuntansi ini harus diintegrasikan dengan *core system* bisnis Anda (misal: sistem order, payment gateway, dll).

**Contoh Alur Otomatis:**
Ketika pelanggan membayar pesanan senilai Rp 100.000 melalui transfer bank:
Sistem di belakang layar (API/Bot) akan otomatis membuat jurnal:
*   *Debit:* Kas di Bank (Bertambah Rp 100.000)
*   *Kredit:* Pendapatan Penjualan (Bertambah Rp 100.000)

Untuk pengeluaran (biaya), jika tidak ada sistem otomatis, Anda atau admin keuangan perlu memiliki antarmuka (dashboard) untuk memasukkan "Jurnal Manual" (Misal: Bayar tagihan listrik -> Debit: Biaya Listrik, Kredit: Kas Bank).

## 4. Mekanisme Pembuatan Laporan
Dari data jurnal yang terkumpul, sistem akan mengolahnya menjadi laporan yang Anda minta dengan cara berikut:

1.  **Buku Besar (General Ledger):** Sistem menjumlahkan semua debit dan kredit untuk masing-masing akun dalam rentang waktu tertentu.
2.  **Neraca Saldo (Trial Balance):** Daftar semua akun beserta saldo akhirnya (Debit - Kredit atau sebaliknya). Total Debit dan Total Kredit **harus sama**.
3.  **Laporan Laba Rugi (Income Statement):** Mengambil data hanya dari akun kategori **Pendapatan** dikurangi **Beban/Biaya**. Hasilnya adalah Laba atau Rugi Bersih.
4.  **Laporan Perubahan Modal (Statement of Changes in Equity):** Modal Awal + Laba Bersih (dari Laba Rugi) - Penarikan Prive = Modal Akhir.
5.  **Laporan Posisi Keuangan (Balance Sheet):** Menampilkan Aset, Kewajiban, dan Modal Akhir (dari Laporan Perubahan Modal). Rumusnya harus selalu: `Aset = Kewajiban + Ekuitas`.
6.  **Laporan Arus Kas (Cash Flow Statement):** Melacak pergerakan khusus pada akun Kas/Bank, dibagi menjadi Aktivitas Operasi, Investasi, dan Pendanaan.

---

## Apa yang Perlu Anda Siapkan?

Sebelum kita mulai menulis kode (ngoding), Anda perlu menyiapkan hal-hal berikut dari sisi bisnis:

1.  **Daftar Pengeluaran & Pemasukan Rutin:** Buat daftar kasar di Excel/Kertas tentang dari mana saja uang masuk (produk A, jasa B) dan ke mana saja uang keluar (gaji, listrik, server, iklan, sewa, dll). Ini akan kita jadikan bahan untuk menyusun **Chart of Accounts (COA)** yang pas untuk bisnis Anda.
2.  **Cut-off Date (Tanggal Mulai):** Tentukan kapan sistem ini akan mulai digunakan secara resmi (misal: 1 Juli).
3.  **Saldo Awal (Opening Balance):** Pada tanggal mulai tersebut, kita butuh data akurat berapa saldo di rekening bank, berapa piutang yang belum ditagih, berapa sisa barang, dll untuk dimasukkan sebagai saldo awal sistem.
4.  **Pemetaan Sistem Saat Ini:** Catat sistem apa saja yang sekarang digunakan (misal: "Pembayaran pakai Midtrans", "Orderan masuk ke database MongoDB", "Gaji bayar manual pakai m-banking"). Ini penting untuk merancang alur otomatisasinya.

## 5. Langkah Implementasi Sistem *Custom* (Bertahap)

Karena Anda memutuskan untuk membangun sistem sendiri guna menekan biaya, kita akan melakukannya secara bertahap agar tidak mengganggu sistem yang sudah berjalan. Berikut adalah *roadmap* implementasinya:

### Fase 1: Database & Fondasi API (Backend)
*   **Database:** Membuat tabel `accounts`, `journal_entries`, dan `journal_lines` (seperti dijelaskan di poin 2) di *database* Anda.
*   **API Akun:** Membuat *endpoint* untuk menambah, mengubah, dan melihat daftar Chart of Accounts (COA).
*   **API Jurnal:** Membuat *endpoint* khusus untuk mencatat jurnal. API ini akan dilengkapi **validasi ketat** (Total Debit **harus persis sama** dengan Total Kredit) sebelum data disimpan ke *database*.

### Fase 2: Antarmuka Dasar & Input Manual (Frontend)
*   **Menu COA:** Menambahkan halaman di *dashboard* (`apps/dashboard`) untuk mengelola daftar akun.
*   **Jurnal Manual:** Membuat *form* input di *dashboard* bagi admin untuk mencatat transaksi manual (misal: bayar listrik, beli ATK, bayar gaji).
*   **Buku Besar:** Menampilkan riwayat transaksi untuk masing-masing akun.

### Fase 3: Otomatisasi Pemasukan (Integrasi Sistem)
*   Menghubungkan *flow* pesanan/pembayaran yang sudah ada di aplikasi Anda dengan API Jurnal.
*   *Goal:* Setiap kali ada uang masuk dari pelanggan, sistem langsung menembak API Jurnal untuk mencatat *Debit: Kas* dan *Kredit: Pendapatan*. Fitur ini akan menghemat banyak waktu rekonsiliasi.

### Fase 4: Modul Laporan Keuangan (Reporting)
*   Membangun *query* tingkat lanjut di *backend* untuk menjumlahkan saldo akun berdasarkan rentang waktu.
*   Menampilkan **Laporan Laba Rugi** (Pendapatan vs Beban) di *dashboard*.
*   Menampilkan **Neraca Saldo** dan **Laporan Posisi Keuangan (Balance Sheet)** untuk memantau kesehatan aset dan kewajiban bisnis secara *real-time*.

---
**Catatan:** Mengingat sistem ini dibangun sendiri, pada bulan pertama penerapan (saat cut-off date), sangat disarankan untuk tetap melakukan pengecekan manual (mencocokkan saldo di sistem dengan saldo riil di rekening bank) untuk memastikan logika *debit-kredit* di sistem sudah berjalan 100% akurat.
