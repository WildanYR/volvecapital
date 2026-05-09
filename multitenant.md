# Analisa Arsitektur Multi-Tenant

Project ini sudah **mendukung multi-tenancy** secara penuh (full support) menggunakan pendekatan **Shared Database, Separate Schema**. Ini adalah salah satu arsitektur multi-tenant paling robust untuk aplikasi SaaS karena memberikan isolasi data yang kuat namun tetap efisien dalam pengelolaan database.

---

## 1. Konsep Multi-Tenant di Project Ini

Konsep yang digunakan adalah pemisahan data berdasarkan **PostgreSQL Schema**.

### Bagaimana Cara Kerjanya?
1.  **Master Schema**: Terdapat satu schema utama (biasanya `master` atau `public`) yang menyimpan data global. Contohnya tabel `tenants` (daftar perusahaan/client) dan `task_queue`.
2.  **Tenant Schemas**: Setiap tenant baru (misal: `papapremium`, `client_b`) akan memiliki schema-nya sendiri. Di dalam schema ini terdapat tabel-tabel spesifik milik tenant tersebut seperti `accounts`, `transactions`, `products`, dsb.
3.  **Identifikasi Tenant**:
    *   **Frontend**: Mengambil ID tenant dari **subdomain** (contoh: `tenantid.domain.com`) atau query parameter.
    *   **Header**: Client mengirimkan header `x-tenant-id` pada setiap request ke API.
    *   **API Logic**: Saat request masuk, API membaca header tersebut dan memerintahkan database untuk "beralih" ke schema milik tenant tersebut menggunakan perintah `SET search_path TO "nama_tenant"`.

---

## 2. Implementasi Teknis Saat Ini

### Database (PostgreSQL)
*   **Isolasi**: Data antar tenant terpisah secara fisik di level schema. Tenant A tidak bisa melihat data Tenant B karena session database dibatasi hanya pada schema tertentu.
*   **Migrasi**: Terpisah antara `migrations/master` and `migrations/tenant`. Ketika ada fitur baru, migrasi dijalankan ke semua schema tenant secara otomatis.

### Backend (NestJS API)
*   **PostgresProvider**: Memiliki fungsi `setSchema(schema, transaction)` untuk berpindah konteks database.
*   **VcAuthGuard**: Melakukan validasi apakah `x-tenant-id` yang dikirim sesuai dengan data di token JWT dan memastikan tenant tersebut aktif di master record.
*   **Provisioning**: Terdapat `TenantProvisioningService` yang otomatis membuat schema baru dan menjalankan migrasi saat ada pendaftaran tenant baru.

### Frontend (Dashboard & Landing Page)
*   **Automatic Interceptor**: Menambahkan header `x-tenant-id` secara otomatis pada setiap request API.
*   **Subdomain Detection**: Landing page sudah bisa mendeteksi tenant dari URL secara dinamis.

---

## 3. Kelebihan & Kekurangan

### ✅ Kelebihan (Sudah Bagus)
1.  **Data Privacy Tinggi**: Sangat sulit terjadi kebocoran data antar tenant karena pemisahan di level database.
2.  **Skalabilitas Migrasi**: Kamu bisa melakukan perubahan struktur tabel hanya pada satu tenant atau semua tenant secara konsisten.
3.  **Clean Code**: Tidak perlu menambahkan kolom `tenant_id` di setiap tabel aplikasi, karena context sudah ditentukan di level session.

### ❌ Kekurangan & Hal yang Perlu Diperhatikan
1.  **Manual Schema Switching**: Saat ini, setiap service di API harus memanggil `this.postgresProvider.setSchema(tenantId, transaction)` secara manual. Ini berisiko jika developer lupa memanggilnya, aplikasi bisa salah mengambil data dari schema default (`public`).
2.  **Connection Pooling**: Jika tidak hati-hati, session database yang sudah di-set ke schema tertentu bisa "terbawa" ke request lain jika connection tidak di-reset saat dikembalikan ke pool. (Saat ini sudah ditangani lewat transaksi, tapi harus tetap waspada).
3.  **Noisy Neighbor**: Karena semua tenant berada di satu database fisik yang sama, jika satu tenant melakukan query yang sangat berat, tenant lain bisa ikut lemot.
4.  **Admin UI**: Belum terlihat adanya dashboard admin pusat yang komprehensif untuk memonitor seluruh tenant (status, penggunaan resource, dsb).

---

## 4. Rekomendasi Pengembangan

1.  **Automated Tenant Context**: Gunakan NestJS `Interceptor` atau `AsyncLocalStorage` untuk mengatur schema secara otomatis di awal request, sehingga developer tidak perlu memanggil `setSchema` secara manual di setiap fungsi service.
2.  **Rate Limiting per Tenant**: Implementasikan pembatasan request berdasarkan `tenant_id` agar satu tenant tidak bisa membanjiri server dengan request (mencegah *noisy neighbor*).
3.  **Centralized Logging**: Pastikan log sistem mencatat `tenant_id` agar saat terjadi error, kamu tahu tenant mana yang mengalami masalah tersebut.

---

**Kesimpulan**: Project kamu sudah memiliki fondasi multi-tenant yang sangat kuat dan profesional. Fokus selanjutnya adalah pada otomatisasi (DX - Developer Experience) dan keamanan tambahan (Rate limiting).
