# Rancangan Implementasi Modul Akuntansi Profesional

Dokumen ini menjelaskan arsitektur dan langkah-langkah untuk membangun modul akuntansi berstandar profesional (Siklus Penuh / *Full-Cycle Accounting*) di dalam aplikasi Anda. Modul ini dirancang agar dapat diskalakan (*scalable*) dan memenuhi standar akuntansi (PSAK/IFRS) seperti yang digunakan oleh perusahaan menengah hingga besar.

---

## 1. Arsitektur Database (Schema)

Untuk skala profesional, kita tidak hanya menyimpan jurnal, tetapi juga mengunci periode transaksi (*Period Closing*) dan melacak saldo setiap periode agar laporan keuangan dapat di-generate dengan sangat cepat tanpa perlu menjumlahkan jutaan baris jurnal setiap saat.

### Tabel Utama:
1.  **`coa` (Chart of Accounts)**
    *   `id`, `code`, `name`, `type` (ASET, KEWAJIBAN, MODAL, PENDAPATAN, HPP, BEBAN)
    *   `normal_balance` (DEBIT, KREDIT)
    *   `is_active` (boolean) - akun bisa dinonaktifkan tapi tidak dihapus jika sudah ada histori.
    *   `parent_id` - untuk mendukung struktur akun bertingkat (*nested / hierarchical accounts*).

2.  **`journal_entries` (Header Jurnal)**
    *   `id`, `transaction_date` (Tanggal Transaksi)
    *   `reference_number` (Contoh: INV-001, otomatis/manual)
    *   `description` (Keterangan)
    *   `status` (DRAFT, POSTED, VOID) - *Jurnal profesional mendukung sistem DRAFT sebelum di-POSTING ke Buku Besar.*
    *   `source` (AUTO_LANDING, AUTO_SHOPEE, MANUAL, ADJUSTMENT, CLOSING)

3.  **`journal_lines` (Detail Jurnal)**
    *   `id`, `journal_entry_id`, `coa_id`
    *   `debit` (Decimal), `credit` (Decimal)
    *   `memo` (Catatan per baris opsional)

4.  **`accounting_periods` (Periode Akuntansi)**
    *   `id`, `period_name` (Misal: "Juli 2026")
    *   `start_date`, `end_date`
    *   `is_closed` (boolean) - Jika *True*, tidak ada jurnal yang boleh ditambah/diubah pada rentang tanggal ini (Tutup Buku).

5.  **`account_balances` (Saldo Berjalan per Periode - *Opsional untuk Performa*)**
    *   `period_id`, `coa_id`
    *   `beginning_balance`, `debit_mutation`, `credit_mutation`, `ending_balance`
    *   *Sangat berguna saat aplikasi sudah memiliki jutaan transaksi.*

---

## 2. Alur Siklus Akuntansi (Fitur yang Perlu Dibangun)

Berikut adalah siklus yang harus dilewati (*Business Flow*) yang nantinya akan diwujudkan dalam bentuk menu di Dashboard (*Frontend*).

### A. Tahap 1: Pencatatan Transaksi (Jurnal)
Sistem harus mendukung 2 cara pencatatan:
*   **Jurnal Otomatis (Integrasi):** Ketika ada *Webhook* pembayaran sukses dari DOKU (Landing Page) atau order dari Shopee/WA divalidasi oleh Bot, *backend API* otomatis membuat *Journal Entry* dengan status `POSTED`.
*   **Jurnal Manual (Menu Input Jurnal):** Antarmuka bagi tim *Finance* untuk mencatat transaksi yang tidak berasal dari sistem order, seperti:
    *   Pembayaran tagihan listrik/air/internet.
    *   Pembelian aset (Laptop, Meja).
    *   Pembayaran gaji karyawan.

### B. Tahap 2: Buku Besar (General Ledger) & Buku Pembantu
*   **Buku Besar (*General Ledger*):** Halaman yang menampilkan filter *Dropdown Akun* dan *Rentang Tanggal*. Sistem akan menampilkan tabel riwayat mutasi (Debit & Kredit) dari akun tersebut beserta kolom **Saldo Berjalan (Running Balance)**.
*   **Buku Pembantu (*Sub-Ledger*) - *Pro Feature*:** Fitur untuk melacak Piutang (Siapa saja yang belum bayar?) dan Hutang (Ke vendor mana kita harus bayar?).

### C. Tahap 3: Neraca Saldo (Trial Balance)
*   **Halaman Neraca Saldo:** Halaman krusial bagi akuntan. Sistem akan melisting **SEMUA COA** beserta saldo akhirnya pada bulan tersebut. 
*   Di bagian paling bawah tabel, **Total Debit** dan **Total Kredit** harus seimbang (*balance*). Jika tidak seimbang, sistem memberikan *warning* warna merah.

### D. Tahap 4: Jurnal Penyesuaian (Adjusting Entries)
*   Di akhir bulan, akuntan akan membuka menu **Jurnal Penyesuaian** (secara teknis mirip menu Input Jurnal Manual, namun di-tag sebagai `source: ADJUSTMENT`).
*   Digunakan untuk mencatat: Penyusutan server/aset, beban dibayar di muka (sewa VPS 1 tahun dipecah per bulan), atau rekonsiliasi selisih kas.

### E. Tahap 5: Laporan Keuangan (Financial Statements)
Halaman sentral bagi Owner / Management. Terdiri dari 3 pilar:
1.  **Laporan Laba Rugi (Income Statement):** Pendapatan - HPP - Beban Operasional = Laba Bersih.
2.  **Neraca (Balance Sheet):** Menampilkan perbandingan Aset (Harta) di sisi kiri, dengan Kewajiban (Hutang) + Modal di sisi kanan.
3.  **Laporan Arus Kas (Cash Flow Statement) - *Pro Feature*:** Menganalisis ke mana tepatnya uang Kas (Likuiditas) mengalir. Dibagi menjadi arus kas Operasi, Investasi, dan Pendanaan.

### F. Tahap 6: Tutup Buku (Period-End Closing)
*   **Menu Tutup Buku:** Tombol sakti yang ditekan setiap akhir bulan atau akhir tahun.
*   **Yang dilakukan sistem di latar belakang (API):**
    1.  Mengecek apakah Neraca Saldo seimbang.
    2.  Mengunci `accounting_periods` bulan tersebut (`is_closed = true`). Begitu dikunci, API Jurnal akan me-*reject* (melempar *error*) permintaan modifikasi jurnal di tanggal lampau.
    3.  Membuat **Jurnal Penutup (Closing Entries)** otomatis: Mengenolkan saldo akun Pendapatan dan Beban, lalu memindahkan selisihnya ke akun **Modal (Laba Ditahan / Retained Earnings)**.
    4.  Membuka periode (bulan) baru dan menetapkan Saldo Akhir bulan lalu menjadi Saldo Awal bulan baru.

---

## 3. Strategi Implementasi Bertahap (Roadmap Code)

Membangun sistem *Full-Cycle* sekaligus akan sangat memakan waktu. Berikut rekomendasi fase pengerjaannya (*Sprint Plan*):

*   **Sprint 1: Fondasi & Automasi (Dasar)**
    *   Setup Model Database (`COA`, `JournalEntry`, `JournalLine`).
    *   API & UI: Master COA (CRUD).
    *   API Jurnal & Integrasi Webhook (Mencatat pemasukan otomatis secara mutlak agar tidak ada yang terlewat).
*   **Sprint 2: Visibilitas & Koreksi (Buku Besar)**
    *   UI: Jurnal Manual (Untuk pengeluaran).
    *   UI: Buku Besar / Ledger (Filter per akun).
    *   UI: Neraca Saldo (Trial Balance).
*   **Sprint 3: Reporting & Keamanan Data**
    *   Query Aggregation untuk Laba Rugi & Neraca.
    *   Fitur Batal/Void Jurnal (Jurnal profesional tidak dihapus dari *database* menggunakan `DELETE`, melainkan di-`VOID` atau dibalik saldonya untuk rekam jejak audit / *audit trail*).
*   **Sprint 4: Enterprise Features (Tutup Buku)**
    *   Tabel `accounting_periods`.
    *   Logika *Closing Period* & Penguncian Transaksi.
    *   Pembuatan Saldo Awal Otomatis untuk bulan berikutnya.

## 4. Keunggulan Arsitektur Ini
1.  **Audit Trail Kuat:** Pembuatan sistem status DRAFT -> POSTED -> VOID mencegah kecurangan data (Fraud).
2.  **Performance:** Adanya tabel saldo per periode membuat *loading* laporan laba rugi menjadi hitungan milidetik meskipun transaksi Anda nantinya mencapai ratusan ribu.
3.  **Standar Perpajakan:** Output laporannya sudah bisa dibaca oleh Konsultan Pajak tanpa perlu di-ekspor dan diolah ulang di Excel.
