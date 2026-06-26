# Walkthrough: Fase 1 Implementasi Modul Akuntansi

Fase 1 (Database & Fondasi API Backend) telah berhasil diimplementasikan ke dalam *source code* backend NestJS. 

## Perubahan yang Dilakukan:

### 1. Pembuatan Model Database (Sequelize)
Untuk menghindari bentrok penamaan dengan model `Account` yang sudah Anda gunakan untuk penyewaan produk (Netflix, Spotify, dll), saya telah menamai model-model akuntansi ini secara spesifik:

*   [NEW] [coa.model.ts](file:///e:/latihan%20coding/1volvecapital/volvecapital/apps/api/src/database/models/coa.model.ts): Berisi struktur *Chart of Accounts* (Kode, Nama, Tipe, Saldo Normal).
*   [NEW] [journal-entry.model.ts](file:///e:/latihan%20coding/1volvecapital/volvecapital/apps/api/src/database/models/journal-entry.model.ts): Header untuk mencatat sebuah transaksi jurnal (Tanggal, Deskripsi).
*   [NEW] [journal-line.model.ts](file:///e:/latihan%20coding/1volvecapital/volvecapital/apps/api/src/database/models/journal-line.model.ts): Rincian jurnal yang merekam nilai `debit` dan `credit`.
*   [MODIFY] [postgres.provider.ts](file:///e:/latihan%20coding/1volvecapital/volvecapital/apps/api/src/database/postgres.provider.ts): Mendaftarkan ketiga model tersebut agar di-*load* oleh sistem *database*.

### 2. Modul API Akuntansi
Modul baru dibuat di dalam folder `apps/api/src/modules/accounting/`:

*   [NEW] [accounting.module.ts](file:///e:/latihan%20coding/1volvecapital/volvecapital/apps/api/src/modules/accounting/accounting.module.ts): Inisialisasi modul baru.
*   [NEW] [accounting.controller.ts](file:///e:/latihan%20coding/1volvecapital/volvecapital/apps/api/src/modules/accounting/accounting.controller.ts): *Endpoint* API untuk CRUD `Coa` dan pembuatan Jurnal.
*   [NEW] [accounting.service.ts](file:///e:/latihan%20coding/1volvecapital/volvecapital/apps/api/src/modules/accounting/accounting.service.ts): Logika bisnis, termasuk **validasi ketat** di mana *Total Debit* harus persis sama dengan *Total Kredit*. Jika ada selisih, API akan melempar *Error* (`BadRequestException`).
*   [MODIFY] [app.module.ts](file:///e:/latihan%20coding/1volvecapital/volvecapital/apps/api/src/app.module.ts): Mendaftarkan `AccountingModule` ke sistem utama NestJS.

## Validasi Fase 1
Logika utama sistem pembukuan berpasangan (*double-entry*) sudah berjalan di *backend*. Sistem tidak akan mengizinkan pencatatan jurnal yang nilainya tidak seimbang. 

---

## Fase 2 (Antarmuka Dashboard / Frontend)
Fase 2 telah berhasil diimplementasikan pada `apps/dashboard`. Sekarang Anda sudah memiliki tampilan visual untuk berinteraksi dengan sistem akuntansi baru ini tanpa perlu memanggil API secara manual.

### 1. File dan Struktur UI yang Ditambahkan
*   [NEW] [accounting.service.ts](file:///e:/latihan%20coding/1volvecapital/volvecapital/apps/dashboard/src/services/accounting.service.ts): Fungsi *fetch/axios* terpusat untuk memanggil API backend (`getCoa`, `createCoa`, `createJournalEntry`).
*   [NEW] [accounting/index.tsx](file:///e:/latihan%20coding/1volvecapital/volvecapital/apps/dashboard/src/routes/dashboard/accounting/index.tsx): Halaman utama akuntansi (diakses melalui `/dashboard/accounting`). Menampilkan tabel cantik berisi daftar *Chart of Accounts* dengan data asli yang Anda minta sebelumnya.
*   [NEW] [accounting/journal.tsx](file:///e:/latihan%20coding/1volvecapital/volvecapital/apps/dashboard/src/routes/dashboard/accounting/journal.tsx): Halaman khusus (diakses melalui `/dashboard/accounting/journal`) untuk mengisi Jurnal Manual. Terdapat validasi *real-time* di UI yang mencegah Anda menekan tombol *Submit* jika saldo *Debit* dan *Kredit* belum *balance*.
*   [MODIFY] [route.tsx](file:///e:/latihan%20coding/1volvecapital/volvecapital/apps/dashboard/src/routes/dashboard/route.tsx): Menambahkan menu navigasi "Akuntansi" dengan ikon Kalkulator pada bilah sisi (*sidebar*) dashboard.

### 2. Fitur Unggulan UI Jurnal Manual:
*   **Baris Dinamis:** Anda bisa menambah baris jurnal tanpa batas (minimal 2 baris).
*   **Auto-Zero:** Jika Anda mengisi angka di sisi *Debit*, sisi *Kredit* di baris tersebut akan otomatis di-nol-kan, dan sebaliknya, untuk mencegah *human error*.
*   **Total Kalkulasi Real-Time:** Menampilkan ringkasan total nilai Debit dan Kredit di bawah tabel. Warnanya akan berubah menjadi merah jika belum *balance*, dan hijau jika sudah seimbang.

---

## Fase 3 (Otomatisasi Jurnal Transaksi)
Pada fase ini, saya telah berhasil menghubungkan sistem penjualan produk Anda (di `TransactionService`) dengan modul `AccountingService`. 

### Logika yang Diimplementasikan
Setiap kali transaksi baru berhasil dibuat, sistem di *backend* akan secara **otomatis mencatat Jurnal**.
1. **Debit (Kas/Bank):** Mencatat sejumlah nilai `net_profit` ke akun Kas (Kode 101).
2. **Debit (Biaya Admin):** Jika terdapat biaya MDR atau Platform fee, sistem akan mendebit total biayanya ke akun Biaya Admin Bank (Kode 613 atau 610).
3. **Kredit (Pendapatan):** Mencatat `total_price` ke akun Pendapatan Produk Digital (Kode 406).

Pencatatan ini diletakkan dalam satu transaksi basis data (*database transaction* / `tx`). Jika jurnal gagal dicatat, ia tidak akan merusak riwayat transaksi utama (mencegah interupsi penjualan kepada pelanggan).

---

## Fase 4 (Laporan Keuangan) - Selesai! 🎉
Fase pamungkas ini telah selesai diimplementasikan. Modul akuntansi Anda kini bukan hanya sekadar tempat mencatat, melainkan *mesin analitik* yang lengkap.

### 1. Endpoint API (Backend) Baru
*   Membuat fungsi pengumpulan (*aggregation*) canggih di `AccountingService` (`getFinancialReports`) yang secara presisi menarik seluruh data dari `JournalLine` beserta COA terkait.
*   Rumus baku yang diimplementasikan:
    *   `Laba Bersih (Net Income) = Total Pendapatan - (Total HPP + Total Beban)`
    *   `Total Pasiva = Kewajiban + Modal + Laba Bersih`
    *   Neraca dinyatakan *seimbang* apabila `Total Aset == Total Pasiva`.

### 2. Antarmuka UI Laporan
*   [NEW] [reports.tsx](file:///e:/latihan%20coding/1volvecapital/volvecapital/apps/dashboard/src/routes/dashboard/accounting/reports.tsx): Anda kini bisa mengakses menu **Laporan Keuangan** langsung dari *dashboard* (terdapat tombol pintasan di halaman Daftar Akun).
*   **Fitur Filter Tanggal:** Seperti yang disetujui, Anda dapat menentukan `Tanggal Mulai` dan `Tanggal Akhir` untuk melihat performa bulan tertentu. Tanpa filter, sistem akan merekap seluruh performa (*All-time*).
*   **Tampilan Visual Interaktif:** Laporan ditampilkan dalam dua pilar (kartu) berdampingan: **Laba Rugi** di sebelah kiri (dengan nilai Laba Bersih yang disorot warna hijau/merah) dan **Neraca** di sebelah kanan (dilengkapi pendeteksi *warning* otomatis jika neraca tidak *balance*).

### Kesimpulan Keseluruhan
Sistem Pencatatan Keuangan dan Akuntansi kustom Anda kini telah terbangun utuh secara profesional di atas ekosistem NestJS dan React yang Anda miliki—tanpa perlu berlangganan *software* pihak ketiga!
