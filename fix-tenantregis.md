# Arsitektur Implementasi Registrasi Tenant (Scalable) - Updated

Tujuan: Mengotomatisasi pembuatan tenant baru tanpa konfigurasi manual, menggunakan flow registrasi modern (Email & Password), dan isolasi data per schema database.

## 1. Perubahan Arsitektur Database

### Master Schema (Shared)
- **Tabel `tenant`**: 
  - `id` (Primary Key, string/slug dari username)
  - `name` (Nama tampilan tenant)
  - `status` (active, pending, suspended)
  - `created_at`, `updated_at`
- **Tabel `tenant_owner`**: 
  - `id` (UUID)
  - `tenant_id` (FK ke `tenant.id`)
  - `email` (Unique, untuk login)
  - `password` (Hashed)
  - `is_verified` (Boolean, untuk flow konfirmasi email)

### Tenant Schema (Isolated)
Setiap registrasi akan men-trigger pembuatan schema PostgreSQL baru dengan nama sesuai `username` (contoh: `CREATE SCHEMA "tokomaju"`).

---

## 2. Workflow Registrasi & Aktivasi

1. **Input Data**: User memasukkan `username` (calon nama tenant), `email`, dan `password`.
2. **Username Validation**: Sistem mengecek apakah `username` sudah dipakai sebagai nama tenant atau schema.
3. **Email Verification**: 
   - Sistem mengirimkan kode/link konfirmasi ke email user.
   - Status tenant sementara `pending`.
4. **Provisioning (Setelah Verifikasi)**:
   - Membuat schema database baru berdasarkan `username`.
   - Menjalankan migrasi tabel (Product, Voucher, dll) ke dalam schema tersebut.
   - **Sample Data**: Memasukkan 1 data contoh (misal: 1 Voucher Tutorial) agar dashboard tidak kosong.
5. **Success**: User diarahkan ke dashboard dan otomatis login.

---

## 3. Analisis: Shared Login vs Subdomain

Berdasarkan pertanyaan Anda, berikut adalah perbandingannya untuk membantu Anda memutuskan:

| Fitur | **Shared Login (app.volvecapital.com)** | **Subdomain (tenant.volvecapital.com)** |
| :--- | :--- | :--- |
| **Kemudahan** | Lebih mudah dikelola (1 SSL, 1 DNS). | Lebih kompleks (Wildcard SSL, Wildcard DNS). |
| **Branding** | User merasa menggunakan platform Volve. | User merasa memiliki portal sendiri. |
| **Teknis** | Sistem mendeteksi tenant dari Email login. | Sistem mendeteksi tenant dari URL. |
| **SEO** | Terpusat di domain utama. | Tersebar di banyak subdomain. |

**Saran:**
Jika landing page Anda sudah menggunakan subdomain (misal: `promo.volvecapital.com`), maka menggunakan **Shared Login** di `app.volvecapital.com` adalah pilihan paling efisien dan rapi. 
- `volvecapital.com`: Untuk Landing Page Utama / Branding.
- `app.volvecapital.com`: Untuk Login & Dashboard semua tenant.
- `*.volvecapital.com`: Untuk Landing Page spesifik / Campaign.

---

## 4. Rencana Tahapan Kerja

1. **Step 1 (Database)**: Update migration untuk struktur `master` yang baru (tabel `tenant` & `tenant_owner`).
2. **Step 2 (Backend)**: Buat `TenantProvisioningService` yang bertanggung jawab:
   - `CREATE SCHEMA`
   - Run Migrations via Code.
   - Insert 1 Sample Data.
3. **Step 3 (Auth)**: Buat flow registrasi baru (Register -> Verify Email -> Create Tenant).
4. **Step 4 (Dashboard)**: Update halaman Login & Register agar mendukung flow Email & Password.

---

## 5. Pertanyaan Lanjutan (Klarifikasi Terakhir)

1. **Email Service**: Untuk mengirim kode verifikasi, apakah kita akan menggunakan SMTP yang sudah ada atau ingin saya buatkan mock (simulasi) dulu?
2. **Subdomain Fix**: Apakah Anda setuju menggunakan **Shared Login** di `app.volvecapital.com` untuk mempermudah manajemen SSL dan DNS? 
3. **Sample Data**: Apa data contoh yang paling berguna untuk user baru? (Contoh: "Voucher Tutorial Cara Pakai").

---
*Setelah Anda menjawab 3 hal di atas, saya akan langsung mulai melakukan coding pada Step 1.*
