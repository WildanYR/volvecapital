# Implementasi Saved Bank Account + Email OTP Verification

## Latar Belakang

Sistem withdrawal saat ini memperbolehkan siapa saja yang punya akses dashboard untuk memasukkan rekening tujuan secara bebas saat request WD. Ini sangat rawan: jika dashboard bocor, orang bisa langsung request WD ke rekening mana saja.

Solusinya adalah:
1. Tenant harus **mendaftarkan rekening bank** terlebih dahulu.
2. Pendaftaran rekening memerlukan **verifikasi OTP via email** owner.
3. Hanya rekening yang sudah terverifikasi yang bisa dipakai untuk WD.
4. Form WD cukup pilih dari daftar rekening tersimpan.

---

## User Flow

```
[Wallet Page]
  └─> Tombol "Kelola Rekening" → halaman /dashboard/wallet/bank-account
        └─> Klik "Tambah Rekening"
              └─> Isi form: Nama Bank, No Rekening, Nama Pemilik
                    └─> Submit → Backend kirim OTP (6 digit) ke email owner
                          └─> Modal muncul: "Masukkan OTP yang dikirim ke email@..."
                                └─> Submit OTP → Rekening tersimpan dengan status VERIFIED
                                      └─> Rekening muncul di daftar

[Request WD]
  └─> Pilih dari dropdown rekening tersimpan (sudah verified)
        └─> Isi nominal → Submit
```

---

## Proposed Changes

---

### Fase 1: Database — Tabel `tenant_bank_account` (per-tenant schema)

#### [NEW] Migration: `apps/api/migrations/tenant/YYYYMMDD_add_tenant_bank_account.ts`

Buat tabel baru di **tenant schema**:

```sql
CREATE TABLE IF NOT EXISTS tenant_bank_account (
  id             VARCHAR(255) PRIMARY KEY,
  bank_name      VARCHAR(100) NOT NULL,
  account_number VARCHAR(50) NOT NULL,
  account_holder VARCHAR(255) NOT NULL,
  is_verified    BOOLEAN NOT NULL DEFAULT FALSE,
  otp_code       VARCHAR(10),
  otp_expires    TIMESTAMP,
  created_at     TIMESTAMP DEFAULT NOW(),
  updated_at     TIMESTAMP DEFAULT NOW()
);
```

#### [NEW] `apps/api/src/database/models/tenant-bank-account.model.ts`

Sequelize model untuk tabel di atas, didaftarkan ke `PostgresProvider`.

---

### Fase 2: Backend — BankAccount Module

#### [NEW] `apps/api/src/modules/bank-account/bank-account.module.ts`
#### [NEW] `apps/api/src/modules/bank-account/bank-account.service.ts`
#### [NEW] `apps/api/src/modules/bank-account/bank-account.controller.ts`
#### [NEW] `apps/api/src/modules/bank-account/dto/`

**Endpoint yang dibuat:**

| Method | Path | Guard | Deskripsi |
|--------|------|-------|-----------|
| `GET` | `/bank-accounts` | `VcAuthGuard` | List rekening VERIFIED milik tenant |
| `POST` | `/bank-accounts` | `VcAuthGuard` | Tambah rekening → simpan unverified + kirim OTP ke email owner |
| `POST` | `/bank-accounts/:id/verify` | `VcAuthGuard` | Verifikasi OTP → set `is_verified: true` |
| `DELETE` | `/bank-accounts/:id` | `VcAuthGuard` | Hapus rekening |

**Logic OTP:**
- Generate 6 digit random: `Math.floor(100000 + Math.random() * 900000).toString()`
- Expire: **10 menit** sejak dibuat
- Dikirim via `MailerService` (nodemailer) ke email dari `tenant_owner` table di master schema
- Setelah berhasil verifikasi, kolom `otp_code` dan `otp_expires` di-null-kan

#### [MODIFY] `apps/api/src/app.module.ts`

Daftarkan `BankAccountModule`.

---

### Fase 3: Backend — Update WithdrawalService

#### [MODIFY] `apps/api/src/modules/withdrawal/withdrawal.service.ts`

Method `createRequest` diupdate:
- **Input lama**: `bank_name`, `account_number`, `account_holder`
- **Input baru**: `bank_account_id: string`
- Validasi: rekening ada, milik tenant, dan `is_verified: true`
- **Snapshot**: salin data bank ke `bank_info` di `withdrawal_request` (untuk audit historis)

#### [MODIFY] `apps/api/src/modules/withdrawal/dto/create-withdrawal.dto.ts`

Ganti 3 field bank menjadi `bank_account_id: string`.

---

### Fase 4: Frontend — Halaman Kelola Rekening

#### [NEW] `apps/dashboard/src/routes/dashboard/wallet/bank-account/index.tsx`

Halaman `/dashboard/wallet/bank-account`:
- Tabel daftar rekening: Nama Bank | No. Rekening | Nama Pemilik | Status (VERIFIED badge) | Aksi (Hapus)
- Tombol **"Tambah Rekening"** → dialog 2 tahap:
  - **Tahap 1**: Form (dropdown bank, nomor rekening, nama pemilik)
  - **Tahap 2** (setelah submit): Input OTP 6 digit + countdown timer 10 menit
- Tombol **"Hapus"** dengan konfirmasi alert

#### [NEW] `apps/dashboard/src/services/bank-account.service.ts`

Service frontend untuk endpoint `/bank-accounts`.

---

### Fase 5: Frontend — Update Wallet Page & WD Form

#### [MODIFY] `apps/dashboard/src/routes/dashboard/wallet/index.tsx`

- Ganti 3 field bank di form WD dengan **Select dropdown** rekening tersimpan
- Format opsi: `BCA - 1234567890 (Budi Santoso)`
- Tambahkan link **"+ Tambah/Kelola Rekening"** → `/dashboard/wallet/bank-account`
- Jika belum ada rekening: tampilkan empty state dengan CTA ke halaman kelola rekening

---

### Daftar Bank (Update)

```ts
const bankOptions = [
  { value: 'BCA',      label: 'BCA' },
  { value: 'BNI',      label: 'BNI' },
  { value: 'BRI',      label: 'BRI' },
  { value: 'MANDIRI',  label: 'Mandiri' },
  { value: 'BSI',      label: 'BSI' },
  { value: 'PERMATA',  label: 'Permata' },
  { value: 'CIMB',     label: 'CIMB Niaga' },
  { value: 'SEABANK',  label: 'SeaBank' },   // ← BARU
  { value: 'JAGO',     label: 'Bank Jago' },
  { value: 'DANAMON',  label: 'Danamon' },
]
```

> **Catatan DOKU**: Kode bank yang dikirim ke DOKU harus sesuai kode resmi mereka. SeaBank kemungkinan `SEABANK` atau `SEA`. Perlu dicek di dokumentasi DOKU Payout saat implementasi.

---

## Open Questions

> [!IMPORTANT]
> **Layanan Email (OTP)**: Apakah sudah ada `MailerService` / `nodemailer` yang terkonfigurasi di project API? Jika belum, perlu setup baru (SMTP credentials di `.env`).

> [!IMPORTANT]
> **Email Tujuan OTP**: OTP akan dikirim ke email yang ada di tabel `tenant_owner` (master schema). Apakah ini sudah benar, atau ada email lain yang perlu digunakan?

> [!NOTE]
> **Data WD Lama**: Withdrawal request yang sudah tersimpan di DB tidak perlu dimigrasikan — `bank_info` tetap sebagai JSON snapshot. Hanya request **baru** yang wajib pakai `bank_account_id`.

---

## Verification Plan

### Automated
- `pnpm --filter @volvecapital/api test:e2e`

### Manual
1. Buka `/dashboard/wallet` → klik "Kelola Rekening"
2. Tambah rekening → cek email OTP masuk (10 menit)
3. Verifikasi OTP → rekening muncul di daftar dengan badge VERIFIED
4. Kembali ke Wallet → Request WD → pilih rekening dari dropdown → berhasil
5. Coba request WD tanpa rekening → muncul pesan "tambahkan rekening dulu"
6. Coba verifikasi OTP yang salah → muncul error
7. Coba verifikasi OTP yang sudah expired → muncul error
