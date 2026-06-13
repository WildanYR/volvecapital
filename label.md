# Rencana Implementasi Fitur Label Akun (Updated)

Berdasarkan kebutuhan, sistem label ini di-desain dengan ketentuan:
1. **Satu akun bisa memiliki banyak label** (Many-to-Many).
2. **Label bersifat spesifik per Varian Produk** (Setiap varian produk memiliki daftar labelnya masing-masing).

Berikut adalah blueprint implementasi teknisnya:

## 1. Perubahan Skema Database (Sequelize-Typescript)

*   **Model Baru: `Label`**
    *   `id`: Primary Key (BigInt/UUID)
    *   `name`: Nama label (contoh: "something went wrong")
    *   `color`: (Opsional) Kode warna untuk UI
    *   `product_variant_id`: Foreign Key ke `ProductVariant`. Ini memastikan label tersebut hanya muncul pada varian produk tempat ia dibuat.

*   **Model Pivot: `AccountLabel`** (Many-to-Many)
    *   `id`: Primary Key
    *   `account_id`: Foreign Key ke tabel `Account`
    *   `label_id`: Foreign Key ke tabel `Label`
    *   Tabel ini bertugas memetakan akun mana saja yang memiliki label apa saja. Satu akun bisa muncul beberapa kali di tabel ini dengan `label_id` yang berbeda.

*   **Pembaruan Model Existing**:
    *   Pembaruan relasi di file model `Account` agar me-load relasi `labels` (melalui `AccountLabel`).
    *   Pembaruan relasi di file model `ProductVariant` agar me-load daftar `labels` miliknya.

## 2. Pembaruan API Backend (NestJS)
*   **Modul Label (`LabelModule`)**:
    *   `POST /labels`: Endpoint untuk membuat label baru. Body request akan menerima `name`, `color`, dan `product_variant_id`.
    *   `GET /labels?product_variant_id=xxx`: Endpoint untuk mengambil daftar label yang khusus dimiliki oleh suatu varian produk tertentu.
    *   `DELETE /labels/:id`: Endpoint untuk menghapus label secara permanen (opsional).
*   **Assign/Unassign Label ke Akun (`AccountModule`)**:
    *   `POST /accounts/:accountId/labels`: Endpoint untuk menambahkan (assign) label ke sebuah akun. Body mengirimkan `label_id`.
    *   `DELETE /accounts/:accountId/labels/:labelId`: Endpoint untuk melepas (unassign) label tertentu dari akun.
*   **Modifikasi API Get Accounts**:
    *   Memperbarui endpoint `GET /accounts` agar mensupport parameter filter (misalnya `?label_ids=1,2,3`). Jika filter diberikan, API hanya akan me-return akun-akun yang terhubung dengan label tersebut di tabel pivot.
    *   Pastikan response Get Accounts ikut me-return/include array `labels` yang dimiliki masing-masing akun agar UI bisa menampilkannya.

## 3. Pembaruan Frontend (Dashboard Vite + React)
*   **Halaman Varian Produk (`/dashboard/account/slug`)**:
    *   **Filter & Daftar Label**: Di bagian atas tabel data akun, tambahkan daftar Badge (Chip) label yang dimiliki varian produk tersebut. Jika user mengklik salah satu label, maka tabel akun akan difilter.
    *   **Tombol & Modal "Tambah Label"**:
        *   Ada tombol "Tambah Label" di UI varian produk.
        *   Saat diklik memunculkan Modal berisi input `Label Name` dan submit.
        *   Saat submit, memanggil endpoint `POST /labels` dengan menyertakan ID Varian Produk saat ini.
*   **Manajemen Label pada Tabel Akun**:
    *   **Tampilan Label**: Pada baris (row) data setiap akun, tampilkan badge label apa saja yang sedang terpasang di akun tersebut.
    *   **Assign Label (Menambah)**: Sediakan tombol `+ Label` atau dropdown pada tiap akun untuk memasangkan label yang ada di varian produk tersebut ke akun ini. Saat dipilih, memanggil `POST /accounts/:accountId/labels`.
    *   **Unassign Label (Melepas)**: Pada badge label yang menempel di akun, berikan tombol silang kecil (`x`) yang jika diklik akan melepas label tersebut dengan memanggil `DELETE /accounts/:accountId/labels/:labelId`.

---
**Status:** Menunggu persetujuan (Approve) untuk memulai proses coding.