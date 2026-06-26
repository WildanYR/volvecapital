# Arsitektur Teknikal Modul Akuntansi

Dokumen ini merangkum rancangan arsitektur teknis dari Modul Akuntansi yang disesuaikan secara spesifik dengan struktur *codebase* dan teknologi (*tech stack*) yang saat ini sudah berjalan di *project* Volve Capital.

Tujuan utama dari arsitektur ini adalah **meneruskan *tech stack* yang ada**, sehingga kita **tidak perlu meng-install *dependency* tambahan** yang akan memberatkan aplikasi.

---

## 1. Teknologi Dasar (Existing Tech Stack)

Pengembangan modul ini akan mematuhi sepenuhnya standar *repository* Anda:
*   **Monorepo:** PNPM Workspaces (`apps/api` dan `apps/dashboard`).
*   **Backend:** NestJS + TypeScript.
*   **Database ORM:** Sequelize (dengan PostgreSQL).
*   **Arsitektur Multi-Tenant:** Menggunakan pendekatan `schema` PostgreSQL per *tenant* via `PostgresProvider`.
*   **Frontend:** React + Vite.
*   **State & Routing:** `@tanstack/react-query` untuk *data fetching* dan `@tanstack/react-router` untuk *file-based routing*.
*   **UI/Styling:** Tailwind CSS + Radix UI (shadcn/ui komponen seperti `Card`, `Button`, `Dialog`, `Table`) + Icon dari `lucide-react`.

---

## 2. Arsitektur Backend (apps/api)

Modul akuntansi akan dibuat secara terisolasi (*encapsulated*) dalam satu *module* NestJS agar rapi, yaitu `AccountingModule`.

### A. Database Models (Sequelize)
File-file model ini akan ditempatkan di `apps/api/src/database/models/`:
1.  `coa.model.ts`
2.  `journal-entry.model.ts`
3.  `journal-line.model.ts`
4.  `accounting-period.model.ts` (Ditambahkan saat fase *Period Closing*).

*Relasi yang digunakan:*
*   `JournalEntry` `hasMany` `JournalLine`
*   `JournalLine` `belongsTo` `JournalEntry`
*   `JournalLine` `belongsTo` `Coa`

### B. Module, Service, & Controller
Ditempatkan di `apps/api/src/modules/accounting/`:
1.  **`accounting.module.ts`**: Mengimpor modul *database* untuk tabel-tabel di atas.
2.  **`accounting.controller.ts`**: Menyediakan *endpoint* REST API seperti:
    *   `GET /accounting/coa`
    *   `POST /accounting/journal`
    *   `GET /accounting/ledger` (Buku Besar)
    *   `GET /accounting/reports` (Laporan Keuangan)
3.  **`accounting.service.ts`**: Menangani seluruh *Business Logic*.
    *   **Penting:** Semua *query* ke *database* di dalam *service* ini wajib menggunakan `this.postgresProvider.transaction()` dan `this.postgresProvider.setSchema(tenantId, tx)` untuk memastikan keamanan data antar *tenant*.
    *   Logika validasi *Double-Entry* (Total Debit = Total Kredit) diletakkan secara ketat di fungsi `createJournalEntry()`.

### C. Database Migration
Script pembuatan tabel akan diletakkan di dalam folder *tenant migrations*:
`apps/api/migrations/tenant/XXX-create-accounting-tables.ts`
Skrip ini akan menggunakan *Umzug* via fungsi `queryInterface.createTable` dan memastikan penambahan tabel terjadi di *schema* masing-masing *tenant*.

---

## 3. Arsitektur Frontend (apps/dashboard)

Antarmuka (*User Interface*) tidak akan menggunakan library *table* pihak ketiga yang berat (seperti ag-grid atau react-table) jika tidak mutlak diperlukan. Kita akan memaksimalkan tabel HTML bawaan dengan gaya Tailwind.

### A. Services Layer
File: `apps/dashboard/src/services/accounting.service.ts`
Berfungsi sebagai *wrapper* `fetch` untuk memanggil API dari `accounting.controller.ts`. Memanfaatkan `API_URL` dan `Auth Token` dari *Context*.

### B. File-Based Routing (@tanstack/react-router)
Routing akan diletakkan di `apps/dashboard/src/routes/dashboard/accounting/`:
1.  `index.tsx` -> Halaman Master COA (Daftar Akun) & *Entry point*.
2.  `journal.tsx` -> Halaman Input Jurnal Manual.
3.  `ledger.tsx` -> Halaman Buku Besar (General Ledger). Menampilkan mutasi per akun yang dipilih.
4.  `reports.tsx` -> Halaman *Dashboard* Laporan Keuangan (Laba Rugi & Neraca).

### C. State Management (@tanstack/react-query)
*   **Pengambilan Data:** Menggunakan `useQuery` dengan *query keys* seperti `['accounting-coa']`, `['accounting-ledger', coaId]`, `['accounting-reports', dates]`. Ini memberikan efek *caching* bawaan sehingga perpindahan halaman terasa instan.
*   **Manipulasi Data:** Menggunakan `useMutation` untuk *Submit* Jurnal, Tambah/Edit COA, dilanjutkan dengan `queryClient.invalidateQueries` agar tabel otomatis *refresh* tanpa perlu memuat ulang halaman (*reload*).

---

## 4. Alur Integrasi (Automasi Transaksi)

Agar pembukuan otomatis tercipta ketika ada pemasukan, kita tidak membongkar modul *payment* dari awal, melainkan hanya **menyisipkan panggilan fungsi (*inject/call*)** ke `AccountingService`.

### Skenario 1: Pembayaran via Landing Page (DOKU)
*Lokasi: `apps/api/src/modules/public/public.service.ts` (Webhook `handlePaymentNotify`)*
Ketika status pembayaran DOKU menjadi `SUCCESS`:
```typescript
// Setelah mengupdate status Voucher menjadi PAID
await this.accountingService.createJournalEntry(tenantId, {
    date: new Date(),
    reference: orderId,
    description: `Penjualan otomatis: ${productName}`,
    lines: [
        { coa_code: '101', debit: grossAmount, credit: 0 }, // Kas di Bank (Bertambah)
        { coa_code: '401', debit: 0, credit: grossAmount }  // Pendapatan (Bertambah)
    ]
}, dbTransaction); // Menggunakan transaksi database yang sama agar atomic
```

### Skenario 2: Pembayaran via Shopee (Bot / RPA)
*Lokasi: `apps/api/src/modules/transaction/transaction.service.ts` (Fungsi `create`)*
Ketika bot Shopee melempar data transaksi baru ke sistem:
```typescript
// Setelah TransactionItem dibuat dan stok Akun dialokasikan
await this.accountingService.createJournalEntry(tenantId, {
    date: new Date(),
    reference: transactionId,
    description: `Penjualan otomatis Shopee: ${customerName}`,
    lines: [
        { coa_code: '102', debit: netProfit, credit: 0 }, // Piutang Shopee (Bertambah)
        { coa_code: '610', debit: platformFee, credit: 0 }, // Beban Admin Shopee (Bertambah)
        { coa_code: '401', debit: 0, credit: grossAmount }  // Pendapatan (Bertambah)
    ]
}, tx); // Transaksi terikat (Rollback jika gagal)
```

## Kesimpulan
Arsitektur di atas memastikan:
1.  **Ringan & Bersih:** Tidak ada NPM *package* baru yang membebani `package.json`.
2.  **Aman secara Konkurensi:** Memanfaatkan `Transaction` dari PostgreSQL di setiap lapisan sehingga jika ada *error* (misal Jurnal gagal tercatat), seluruh *flow* (termasuk pembuatan order) akan ikut di-*rollback*.
3.  **Terisolasi:** Kode Akuntansi tidak mengotori modul *Transaction* atau *Public*, melainkan hanya dipanggil ketika dibutuhkan melalui *Dependency Injection* NestJS.
