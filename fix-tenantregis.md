# Arsitektur Implementasi Registrasi Tenant (Scalable)

Tujuan: Mengotomatisasi pembuatan tenant baru tanpa konfigurasi manual di `.env` atau database, serta memberikan antarmuka registrasi yang profesional.

## 1. Perubahan Arsitektur Database

### Master Schema (Shared)
Saat ini, tabel `tenant` hanya memiliki `id` dan `secret`. Kita perlu menambahkan entitas untuk pemilik tenant:
- **Tabel `tenant_owner`**: Menyimpan `email`, `password` (hashed), dan relasi ke `tenant_id`. Ini digunakan untuk login dashboard utama.
- **Tabel `tenant`**: Menambahkan field `status` (active, pending, suspended) dan `plan` (jika nanti ada fitur berlangganan).

### Tenant Schema (Isolated)
Setiap registrasi akan men-trigger pembuatan schema PostgreSQL baru secara otomatis (contoh: `tenant_nama_user`).

---

## 2. Workflow Registrasi (Backend)

1. **Validation**: Cek keunikan `tenant_name` dan `email` di master schema.
2. **Provisioning**: 
   - Insert data ke `master.tenant` dan `master.tenant_owner`.
   - Eksekusi perintah SQL: `CREATE SCHEMA "tenant_id"`.
   - Menjalankan **Tenant Migrations** secara otomatis pada schema baru tersebut untuk membuat tabel-tabel produk, voucher, dll.
3. **Auto-Login**: Setelah berhasil, API mengembalikan JWT token yang sudah berisi `tenant_id` sehingga user langsung diarahkan ke dashboard.

---

## 3. Workflow Login (Modern)

User login menggunakan **Email & Password**. Sistem akan mencari di `master.tenant_owner` untuk mendapatkan `tenant_id` terkait, lalu men-set `search_path` database ke schema tenant tersebut.

---

## 4. Rencana Tahapan Kerja

1. **Step 1**: Update Migration Master (Tambah tabel `tenant_owner`).
2. **Step 2**: Buat `ProvisioningService` di Backend untuk menghandle otomatisasi `CREATE SCHEMA` dan migrasi otomatis.
3. **Step 3**: Buat Endpoint API `/auth/register-tenant`.
4. **Step 4**: Buat UI Page `/register-tenant` di Dashboard (Vite).
5. **Step 5**: Update Flow Login agar tidak lagi meminta "Secret" secara manual, melainkan cukup Email & Password.

---

## 5. Pertanyaan Klarifikasi (Mohon Dijawab)

Sebelum saya mulai mengoding, mohon konfirmasi beberapa hal berikut agar arsitekturnya tepat sasaran:

1. **Nama Tenant (ID)**: Apakah nama tenant yang diinput user akan dijadikan **Schema Name** di database? (Contoh: user input "TokoMaju", maka database punya schema "tokomaju"). Ini penting untuk isolasi data.
2. **Migrasi Otomatis**: Apakah saat registrasi, sistem boleh langsung menjalankan semua migrasi yang ada di folder `apps/api/migrations/tenant`? (Ini adalah cara paling scalable).
3. **Login Flow**: Apakah Anda ingin login tetap di `localhost:3000/login` untuk semua orang (shared login), atau nantinya ada rencana menggunakan subdomain (seperti `tokomaju.volvecapital.com`)?
4. **Default Data**: Apakah tenant baru harus langsung punya data contoh (seperti 1 tutorial default atau 1 produk contoh) agar user tidak bingung saat pertama masuk?
5. **Secret Key**: Apakah `secret` (App Id/Secret) yang sekarang ada di `.env` ingin tetap dipertahankan untuk kebutuhan API luar, atau ingin dibuatkan otomatis (random string) saat registrasi?

---
*Tuliskan jawaban Anda di bawah ini atau beri tahu saya jika ada bagian arsitektur yang ingin diubah.*
