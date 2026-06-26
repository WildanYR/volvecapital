# Implementasi Auto-Journal untuk HPP / Modal Akun

Dokumen ini merangkum rancangan implementasi jurnal otomatis (Auto-Journal) setiap kali ada penambahan "Modal" (HPP) pada suatu akun, baik melalui jalur **Edit Akun (Modal Awal)** maupun **Detail Finansial (Riwayat Modal)**.

## 1. Analisis Masalah Saat Ini
Saat ini, ketika Anda menambahkan "Nominal Modal" di sebuah akun (misal Rp 54.000 untuk beli akun Netflix), sistem hanya mencatatnya sebagai angka riwayat saja. **Sistem belum tahu:**
1. Uang Rp 54.000 itu diambil dari Kas/Bank mana? (Kredit)
2. Uang tersebut harus dicatat sebagai Beban/HPP apa di laporan laba rugi? (Debit)

Oleh karena itu, agar Auto-Journal bisa bekerja, kita perlu menambahkan input "Kas/Bank" dan "Akun Beban/HPP" saat proses penambahan modal.

## 2. Rencana Perubahan (Action Plan)

### A. Perubahan Database (Migration)
Kita perlu menambahkan 2 kolom baru pada tabel `account_capital` (tabel yang menyimpan riwayat modal):
- `payment_coa_id` (STRING) -> Untuk menyimpan ID akun Kas/Bank yang digunakan.
- `expense_coa_id` (STRING) -> Untuk menyimpan ID akun Beban / HPP.

### B. Perubahan Frontend (Dashboard)
1. **Jalur Detail Finansial (`financial-detail-dialog.tsx`)**:
   - Saat mengklik "Tambah Modal", akan ditambahkan 2 *dropdown* baru:
     - **"Dibayar dari Kas/Bank"** (Pilih akun aset, misal: Kas BCA, Saldo Seabank).
     - **"Kategori HPP/Beban"** (Pilih akun beban, misal: HPP Netflix).
2. **Jalur Edit Akun (`account/$slug.tsx`)**:
   - Pada input "Modal Awal Akun", juga ditambahkan 2 *dropdown* yang sama (Kas/Bank & HPP).

### C. Perubahan Backend (API & Akuntansi)
1. **Modul `account.service.ts`**:
   - Mengambil data `payment_coa_id` dan `expense_coa_id` yang dikirim dari Frontend.
   - Setelah sukses menyimpan ke tabel riwayat modal, sistem akan memanggil `AccountingService`.
2. **Modul `accounting.service.ts`**:
   - Membuat fungsi baru, misalnya `autoJournalCapital(tenantId, capitalId, transaction)`.
   - Logika Jurnal yang akan dibuat:
     - **Debit:** Akun Beban/HPP (sebesar Nominal Modal).
     - **Kredit:** Akun Kas/Bank (sebesar Nominal Modal).
   - *Memo Jurnal*: "Pembelian/Penambahan Modal Akun: [Email Akun]".

---

**Pertanyaan Keputusan Desain:**
Saat ini ada 2 opsi bagaimana Akun HPP ini dipilih:
1. **Dipilih manual setiap kali menambah modal**: Anda harus memilih Kas dan HPP di *dropdown* setiap kali menginput nominal modal. (Lebih detail/fleksibel).
2. **Di-setting Otomatis (Global)**: Kita buatkan menu "Pemetaan HPP" di Pengaturan Akuntansi, sehingga Anda hanya perlu mengatur 1 kali saja (Misal: Semua modal masuk ke "104 - Saldo Seabank" dan "501 - HPP Netflix"). Nanti waktu nambah modal, Anda cuma ketik nominalnya saja seperti sekarang.
