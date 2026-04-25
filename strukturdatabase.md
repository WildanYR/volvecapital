# 🗄️ Struktur Database — Volve Capital

> **Database**: PostgreSQL  
> **ORM**: Sequelize + Sequelize-TypeScript  
> **Arsitektur**: Multi-Tenant dengan PostgreSQL Schema per tenant

---

## 🏛️ Arsitektur Multi-Tenant

Proyek ini menggunakan **PostgreSQL Schema-based Multi-Tenancy**:

```
PostgreSQL Database: volvecapital
├── Schema: master          ← Data global (tenant registry, task queue, syslog, email message)
│   ├── tenant
│   ├── task_queue
│   ├── syslog
│   └── email_message
│
├── Schema: papapremium     ← Data bisnis tenant "papapremium"
│   ├── email
│   ├── product
│   ├── product_variant
│   ├── platform_product
│   ├── account
│   ├── account_profile
│   ├── account_user
│   ├── account_modifier
│   ├── transaction
│   ├── transaction_item
│   ├── revenue_statistics
│   ├── product_sales_statistics
│   ├── peak_hour_statistics
│   └── platform_statistics
│
└── Schema: [tenant_lain]   ← Setiap tenant punya schema sendiri
    └── (struktur sama seperti papapremium)
```

---

## 🌐 MASTER SCHEMA

### 1. `tenant`
Data registrasi dan autentikasi setiap tenant (klien bisnis).

| Kolom | Tipe | Constraint | Keterangan |
|-------|------|-----------|------------|
| `id` | VARCHAR | PK, NOT NULL | ID unik tenant (nama slug, cth: `papapremium`) |
| `secret` | VARCHAR | NOT NULL | Secret key untuk generate JWT token |
| `created_at` | TIMESTAMP | NOT NULL | Waktu dibuat |
| `updated_at` | TIMESTAMP | NOT NULL | Waktu diupdate |

---

### 2. `task_queue`
Antrian tugas yang akan dieksekusi oleh bot (sistem otomasi Shopee).

| Kolom | Tipe | Constraint | Keterangan |
|-------|------|-----------|------------|
| `id` | VARCHAR | PK | ID tugas (Snowflake ID) |
| `execute_at` | TIMESTAMP | NOT NULL | Waktu tugas dijadwalkan berjalan |
| `subject_id` | VARCHAR | NOT NULL | ID subjek yang dikerjakan (misal: order ID) |
| `context` | VARCHAR | NOT NULL | Konteks tugas (misal: `SEND_ACCOUNT`) |
| `payload` | TEXT | NOT NULL | Data JSON berisi detail tugas |
| `status` | VARCHAR | NULLABLE | `QUEUED` / `DISPATCHED` / `COMPLETED` / `FAILED` |
| `error_message` | TEXT | NULLABLE | Pesan error jika status `FAILED` |
| `attempt` | INTEGER | NULLABLE | Jumlah percobaan eksekusi |
| `tenant_id` | VARCHAR | FK master.tenant.id, NOT NULL | Pemilik tugas |
| `created_at` | TIMESTAMP | NOT NULL | Waktu dibuat |
| `updated_at` | TIMESTAMP | NOT NULL | Waktu diupdate |

---

### 3. `syslog`
Log sistem untuk monitoring dan debugging API.

| Kolom | Tipe | Constraint | Keterangan |
|-------|------|-----------|------------|
| `id` | BIGINT | PK, AUTO_INCREMENT | |
| `level` | VARCHAR | NOT NULL | `INFO` / `WARN` / `ERROR` / `DEBUG` |
| `context` | VARCHAR | NOT NULL | Nama modul/class yang mencatat log |
| `message` | TEXT | NOT NULL | Isi pesan log |
| `stack` | TEXT | NULLABLE | Stack trace jika error |
| `tenant_id` | VARCHAR | FK master.tenant.id, NULLABLE | Tenant terkait (opsional) |
| `created_at` | TIMESTAMP | NOT NULL | Waktu log dicatat (tidak ada `updated_at`) |

> **Catatan**: Tabel ini hanya punya `created_at`, tidak ada `updated_at`.

---

### 4. `email_message`
Inbox email yang diterima oleh sistem (email receiver otomatis dari bot).

| Kolom | Tipe | Constraint | Keterangan |
|-------|------|-----------|------------|
| `id` | BIGINT | PK, AUTO_INCREMENT | |
| `tenant_id` | VARCHAR | NOT NULL | ID tenant penerima email |
| `from_email` | VARCHAR | NOT NULL | Alamat pengirim email |
| `subject` | VARCHAR | NOT NULL | Subjek email |
| `email_date` | TIMESTAMP | NOT NULL | Waktu email dikirim (dari header email) |
| `parsed_context` | VARCHAR | NOT NULL | Konteks yang berhasil dideteksi (misal: `RESET_PASSWORD`) |
| `parsed_data` | TEXT | NOT NULL | Data JSON hasil parsing email (misal: link reset, OTP) |
| `created_at` | TIMESTAMP | NOT NULL | Waktu record dibuat |
| `updated_at` | TIMESTAMP | NOT NULL | Waktu record diupdate |

---

## 🏢 TENANT SCHEMA (per-klien)

> Semua tabel berikut ada di masing-masing schema tenant. Setiap tenant (klien) punya data terisolasi.

---

### 5. `email`
Daftar akun email yang digunakan untuk streaming (Netflix, Spotify, dll).

| Kolom | Tipe | Constraint | Keterangan |
|-------|------|-----------|------------|
| `id` | BIGINT | PK, AUTO_INCREMENT | |
| `email` | VARCHAR | NOT NULL | Alamat email akun |
| `password` | VARCHAR | NULLABLE | Password email (untuk login otomatis) |
| `created_at` | TIMESTAMP | NOT NULL | |
| `updated_at` | TIMESTAMP | NOT NULL | |

**Relasi:** 1 email → banyak account

---

### 6. `product`
Produk yang dijual oleh tenant (misal: Netflix, Spotify, Disney+).

| Kolom | Tipe | Constraint | Keterangan |
|-------|------|-----------|------------|
| `id` | BIGINT | PK, AUTO_INCREMENT | |
| `name` | VARCHAR | NOT NULL | Nama produk (misal: "Netflix") |
| `slug` | VARCHAR | NOT NULL, UNIQUE | URL-friendly name (misal: "netflix") |
| `created_at` | TIMESTAMP | NOT NULL | |
| `updated_at` | TIMESTAMP | NOT NULL | |

**Relasi:** 1 product → banyak product_variant

---

### 7. `product_variant`
Varian/paket dari sebuah produk (misal: Netflix 1 Bulan, Netflix 3 Bulan).

| Kolom | Tipe | Constraint | Keterangan |
|-------|------|-----------|------------|
| `id` | BIGINT | PK, AUTO_INCREMENT | |
| `name` | VARCHAR | NOT NULL | Nama varian (misal: "1 Bulan", "3 Bulan") |
| `duration` | BIGINT | NOT NULL | Durasi akses dalam hari |
| `interval` | BIGINT | NOT NULL | Interval pengecekan/renewal dalam jam |
| `cooldown` | BIGINT | NOT NULL | Cooldown setelah reset dalam menit |
| `copy_template` | TEXT | NULLABLE | Template pesan yang dikirim ke buyer saat akun diberikan |
| `product_id` | BIGINT | FK product.id, NOT NULL | Produk induk |
| `created_at` | TIMESTAMP | NOT NULL | |
| `updated_at` | TIMESTAMP | NOT NULL | |

**Relasi:** banyak product_variant → 1 product, 1 product_variant → banyak platform_product + account

---

### 8. `platform_product`
Mapping produk varian ke platform penjualan (Shopee, Tokopedia, dll).

| Kolom | Tipe | Constraint | Keterangan |
|-------|------|-----------|------------|
| `id` | BIGINT | PK, AUTO_INCREMENT | |
| `name` | VARCHAR | NOT NULL | Nama produk di platform (bisa beda dari nama internal) |
| `platform` | VARCHAR | NOT NULL | Nama platform (`shopee`, `tokopedia`, dll) |
| `platform_product_id` | VARCHAR | NULLABLE | ID produk di platform eksternal |
| `product_variant_id` | BIGINT | FK product_variant.id, NOT NULL | Varian produk yang dimapping |
| `created_at` | TIMESTAMP | NOT NULL | |
| `updated_at` | TIMESTAMP | NOT NULL | |

---

### 9. `account`
Akun streaming utama yang dikelola dan disewakan ke customer.

| Kolom | Tipe | Constraint | Keterangan |
|-------|------|-----------|------------|
| `id` | BIGINT | PK, AUTO_INCREMENT | |
| `account_password` | VARCHAR | NOT NULL | Password akun streaming |
| `subscription_expiry` | TIMESTAMP | NOT NULL | Tanggal kadaluarsa langganan akun |
| `status` | VARCHAR | NULLABLE | `active` / `ready` / `disable` |
| `billing` | VARCHAR | NULLABLE | Info billing (kartu, metode bayar, dll) |
| `label` | VARCHAR | NULLABLE | Label/catatan manual untuk akun |
| `batch_start_date` | TIMESTAMP | NULLABLE | Tanggal mulai batch pengelolaan |
| `batch_end_date` | TIMESTAMP | NULLABLE | Tanggal selesai batch pengelolaan |
| `freeze_until` | TIMESTAMP | NULLABLE | Akun dibekukan sampai tanggal ini |
| `pinned` | BOOLEAN | NULLABLE | Apakah akun di-pin di dashboard |
| `email_id` | BIGINT | FK email.id, NOT NULL | Email akun streaming |
| `product_variant_id` | BIGINT | FK product_variant.id | Varian produk untuk akun ini |
| `created_at` | TIMESTAMP | NOT NULL | |
| `updated_at` | TIMESTAMP | NOT NULL | |

**Enum status:**
- `active` — Sedang dipakai user
- `ready` — Aktif tapi belum dipakai user
- `disable` — Akun dinonaktifkan

**Relasi:** 1 account → banyak account_profile + account_user + account_modifier

---

### 10. `account_profile`
Profile/slot dalam akun streaming (Netflix punya beberapa profile per akun).

| Kolom | Tipe | Constraint | Keterangan |
|-------|------|-----------|------------|
| `id` | BIGINT | PK, AUTO_INCREMENT | |
| `name` | VARCHAR | NOT NULL | Nama profile di platform streaming |
| `max_user` | INTEGER | NOT NULL, DEFAULT 1 | Maksimal user yang bisa memakai profile ini |
| `allow_generate` | BOOLEAN | NOT NULL, DEFAULT true | Apakah profile bisa di-assign ke user baru |
| `metadata` | TEXT | NULLABLE | Data tambahan dalam format JSON |
| `account_id` | BIGINT | FK account.id, NOT NULL | Akun induk |
| `created_at` | TIMESTAMP | NOT NULL | |
| `updated_at` | TIMESTAMP | NOT NULL | |

**Relasi:** 1 account_profile → banyak account_user

---

### 11. `account_user`
User/penyewa yang sedang menggunakan profile akun tertentu.

| Kolom | Tipe | Constraint | Keterangan |
|-------|------|-----------|------------|
| `id` | BIGINT | PK, AUTO_INCREMENT | |
| `name` | VARCHAR | NOT NULL | Nama customer/penyewa |
| `status` | VARCHAR | NULLABLE | `active` / `expired` |
| `expired_at` | TIMESTAMP | NULLABLE | Waktu akses berakhir |
| `account_id` | BIGINT | FK account.id, NOT NULL | Akun yang digunakan |
| `account_profile_id` | BIGINT | FK account_profile.id, NOT NULL | Profile yang digunakan |
| `created_at` | TIMESTAMP | NOT NULL | |
| `updated_at` | TIMESTAMP | NOT NULL | |

**Relasi:** 1 account_user → 1 transaction_item (opsional)

---

### 12. `account_modifier`
Modifier/pengaturan tambahan yang diterapkan pada akun tertentu.

| Kolom | Tipe | Constraint | Keterangan |
|-------|------|-----------|------------|
| `id` | BIGINT | PK, AUTO_INCREMENT | |
| `modifier_id` | VARCHAR | NOT NULL | ID jenis modifier (identifier tipe pengaturan) |
| `metadata` | TEXT | NOT NULL | Data konfigurasi modifier dalam format JSON |
| `enabled` | BOOLEAN | NOT NULL, DEFAULT true | Apakah modifier aktif |
| `account_id` | BIGINT | FK account.id, NOT NULL | Akun yang memiliki modifier ini |
| `created_at` | TIMESTAMP | NOT NULL | |
| `updated_at` | TIMESTAMP | NOT NULL | |

---

### 13. `transaction`
Data transaksi penjualan dari berbagai platform.

| Kolom | Tipe | Constraint | Keterangan |
|-------|------|-----------|------------|
| `id` | VARCHAR | PK, NOT NULL | ID transaksi dari platform (Shopee order ID, dll) |
| `customer` | VARCHAR | NOT NULL | Nama/ID pembeli di platform |
| `platform` | VARCHAR | NOT NULL | Platform asal transaksi (`shopee`, `tokopedia`, dll) |
| `total_price` | INTEGER | NOT NULL | Total harga dalam satuan Rupiah |
| `created_at` | TIMESTAMP | NOT NULL | |
| `updated_at` | TIMESTAMP | NOT NULL | |

**Relasi:** 1 transaction → banyak transaction_item

---

### 14. `transaction_item`
Item detail dari sebuah transaksi (tiap item = 1 slot akun yang dijual).

| Kolom | Tipe | Constraint | Keterangan |
|-------|------|-----------|------------|
| `id` | BIGINT | PK, AUTO_INCREMENT | |
| `name` | VARCHAR | NOT NULL | Nama item yang dibeli (nama produk) |
| `transaction_id` | VARCHAR | FK transaction.id, NOT NULL | Transaksi induk |
| `account_user_id` | BIGINT | FK account_user.id, NULLABLE | User akun yang di-assign (null jika belum diproses) |
| `created_at` | TIMESTAMP | NOT NULL | |
| `updated_at` | TIMESTAMP | NOT NULL | |

---

### 15. `email_subject`
Daftar pola subject email yang dikenali sistem untuk auto-parsing.

| Kolom | Tipe | Constraint | Keterangan |
|-------|------|-----------|------------|
| `id` | BIGINT | PK, AUTO_INCREMENT | |
| `context` | VARCHAR | NOT NULL | Konteks yang dikenali (misal: `RESET_PASSWORD`, `OTP`) |
| `subject` | VARCHAR | NOT NULL | Pola subject email (bisa exact match atau substring) |
| `created_at` | TIMESTAMP | NOT NULL | |
| `updated_at` | TIMESTAMP | NOT NULL | |

---

### 16. `revenue_statistics` *(Agregasi)*
Statistik pendapatan harian/bulanan.

| Kolom | Tipe | Constraint | Keterangan |
|-------|------|-----------|------------|
| `date` | DATE | PK, NOT NULL | Tanggal statistik |
| `type` | VARCHAR | PK, NOT NULL | Periode: `daily` / `monthly` |
| `total_revenue` | INTEGER | NOT NULL | Total pendapatan (Rupiah) |
| `transaction_count` | INTEGER | NOT NULL | Jumlah transaksi |
| `created_at` | TIMESTAMP | NOT NULL | |
| `updated_at` | TIMESTAMP | NOT NULL | |

> **Primary Key Komposit**: `(date, type)`

---

### 17. `product_sales_statistics` *(Agregasi)*
Statistik penjualan per produk varian.

| Kolom | Tipe | Constraint | Keterangan |
|-------|------|-----------|------------|
| `date` | DATE | PK, NOT NULL | Tanggal statistik |
| `type` | VARCHAR | PK, NOT NULL | Periode: `daily` / `monthly` |
| `product_variant_id` | BIGINT | PK, NOT NULL | ID varian produk |
| `items_sold` | INTEGER | NOT NULL | Jumlah item terjual |
| `created_at` | TIMESTAMP | NOT NULL | |
| `updated_at` | TIMESTAMP | NOT NULL | |

> **Primary Key Komposit**: `(date, type, product_variant_id)`

---

### 18. `peak_hour_statistics` *(Agregasi)*
Statistik jam transaksi terbanyak.

| Kolom | Tipe | Constraint | Keterangan |
|-------|------|-----------|------------|
| `date` | DATE | PK, NOT NULL | Tanggal statistik |
| `type` | VARCHAR | PK, NOT NULL | Periode: `daily` / `monthly` |
| `hour` | INTEGER | PK, NOT NULL | Jam (0-23) |
| `transaction_count` | INTEGER | NOT NULL | Jumlah transaksi di jam tersebut |
| `created_at` | TIMESTAMP | NOT NULL | |
| `updated_at` | TIMESTAMP | NOT NULL | |

> **Primary Key Komposit**: `(date, type, hour)`

---

### 19. `platform_statistics` *(Agregasi)*
Statistik transaksi per platform penjualan.

| Kolom | Tipe | Constraint | Keterangan |
|-------|------|-----------|------------|
| `date` | DATE | PK, NOT NULL | Tanggal statistik |
| `type` | VARCHAR | PK, NOT NULL | Periode: `daily` / `monthly` |
| `platform` | VARCHAR | PK, NOT NULL | Nama platform |
| `transaction_count` | INTEGER | NOT NULL | Jumlah transaksi dari platform ini |
| `created_at` | TIMESTAMP | NOT NULL | |
| `updated_at` | TIMESTAMP | NOT NULL | |

> **Primary Key Komposit**: `(date, type, platform)`

---

## 🔗 Diagram Relasi (ERD)

```
MASTER SCHEMA
──────────────────────────────────────────────
tenant
  ├──< task_queue        (tenant_id)
  └──< syslog            (tenant_id, optional)

email_message            (tenant_id, bukan FK formal)


TENANT SCHEMA (per-klien)
──────────────────────────────────────────────

product
  └──< product_variant
            ├──< platform_product
            └──< account
                    ├── email              (email_id)
                    ├──< account_profile
                    │         └──< account_user
                    │                   └──> transaction_item
                    │                             └──> transaction
                    ├──< account_user      (account_id)
                    └──< account_modifier

email_subject              (standalone)
revenue_statistics         (standalone, agregasi)
product_sales_statistics   (standalone, agregasi)
peak_hour_statistics       (standalone, agregasi)
platform_statistics        (standalone, agregasi)
```

---

## 📊 Ringkasan Tabel

| # | Tabel | Schema | Fungsi |
|---|-------|--------|--------|
| 1 | `tenant` | master | Registry klien bisnis |
| 2 | `task_queue` | master | Antrian tugas bot otomasi |
| 3 | `syslog` | master | Log sistem API |
| 4 | `email_message` | master | Inbox email otomatis |
| 5 | `email` | tenant | Akun email streaming |
| 6 | `product` | tenant | Produk (Netflix dll) |
| 7 | `product_variant` | tenant | Varian/paket produk |
| 8 | `platform_product` | tenant | Mapping produk ke marketplace |
| 9 | `account` | tenant | Akun streaming utama |
| 10 | `account_profile` | tenant | Profile dalam akun streaming |
| 11 | `account_user` | tenant | Penyewa aktif per profile |
| 12 | `account_modifier` | tenant | Pengaturan tambahan akun |
| 13 | `transaction` | tenant | Data transaksi penjualan |
| 14 | `transaction_item` | tenant | Item detail dalam transaksi |
| 15 | `email_subject` | tenant | Pola parsing email masuk |
| 16 | `revenue_statistics` | tenant | Statistik pendapatan |
| 17 | `product_sales_statistics` | tenant | Statistik penjualan produk |
| 18 | `peak_hour_statistics` | tenant | Statistik jam puncak |
| 19 | `platform_statistics` | tenant | Statistik per platform |

---

## ⚙️ Catatan Teknis

- **ID Type**: Mayoritas menggunakan `BIGINT AUTO_INCREMENT`. Tabel `transaction` menggunakan `VARCHAR` (ID dari platform eksternal). `task_queue` menggunakan Snowflake ID (VARCHAR).
- **Timestamps**: Semua tabel punya `created_at` dan `updated_at`, **kecuali** `syslog` yang hanya punya `created_at`.
- **Multi-Tenant Isolation**: Setiap query selalu didahului `SET search_path TO "{tenant_id}"` sebelum eksekusi — data antar tenant 100% terisolasi.
- **Tabel Statistik**: Pakai **composite primary key** dan di-upsert saat transaksi baru masuk — bukan insert baru.
- **`copy_template`**: Template pesan WhatsApp/Shopee chat yang dikirim otomatis ke buyer berisi info akun yang diberikan.
- **`account_modifier`**: Sistem plugin untuk menambahkan perilaku khusus pada akun (misal: notifikasi khusus, jadwal reset berbeda).
- **`email_message`**: Disimpan di master schema (bukan tenant schema) karena bot email berjalan global, bukan per-tenant.
