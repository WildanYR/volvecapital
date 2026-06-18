# Konsep Implementasi Fitur Manual Book (Knowledge Base / SOP)

Fitur **Manual Book** ini bertujuan untuk menyediakan pusat informasi (Knowledge Base) internal di dalam dashboard. Owner dapat mengelola (CRUD) dokumen SOP, Product Knowledge, dan panduan lainnya, sementara Staff dapat membaca dokumen-dokumen tersebut dengan mudah.

## 1. Fitur Utama (Key Features)

*   **Manajemen Kategori:** Mengelompokkan manual book berdasarkan departemen atau topik (misal: "SOP CS", "Product Knowledge", "Panduan Aplikasi").
*   **Rich Text Editor (WYSIWYG):** Editor teks interaktif bagi Owner untuk menulis konten. Harus mendukung format teks dasar, Embed Gambar, dan Embed Video (YouTube / Vimeo via Iframe).
*   **Role-Based Access Control (RBAC):** Owner bisa edit/publish, Staff hanya Read-only untuk dokumen yang sudah Published.
*   **Pencarian (Search):** Fitur bagi staff untuk mencari panduan berdasarkan kata kunci.

---

## 2. Desain Database (Sequelize + PostgreSQL)

Berdasarkan arsitektur yang sudah ada di `apps/api` (menggunakan **Sequelize-TypeScript** dengan PostgreSQL), kita akan membuat dua Model baru. Kita tidak akan menggunakan Prisma atau TypeORM karena project ini memakai Sequelize.

### Model `Category` (`category.model.ts`)
*   `id` (UUID, Primary Key, Default `DataType.UUIDV4`)
*   `name` (String, AllowNull false)
*   `slug` (String, Unique)
*   `description` (Text, AllowNull true)
*   Relasi: `@HasMany(() => ManualBook)`

### Model `ManualBook` (`manual-book.model.ts`)
*   `id` (UUID, Primary Key, Default `DataType.UUIDV4`)
*   `categoryId` (ForeignKey ke `Category.id`)
*   `authorId` (ForeignKey ke tabel `User` yang sudah ada, opsional)
*   `title` (String, AllowNull false)
*   `slug` (String, Unique)
*   `content` (Text, untuk menyimpan struktur HTML konten editor)
*   `status` (Enum/String: `'DRAFT'` | `'PUBLISHED'`, Default `'DRAFT'`)
*   Relasi: `@BelongsTo(() => Category)`

---

## 3. Desain API (Backend - NestJS)

Di `apps/api`, kita akan membuat `ManualBookModule` dengan memanfaatkan tools bawaan project:

*   **Validasi (DTOs):** Menggunakan `class-validator` (seperti `@IsString()`, `@IsEnum()`) dan `class-transformer` yang sudah terinstall untuk `CreateManualBookDto` dan `UpdateManualBookDto`.
*   **Endpoints:**
    *   `GET /manual-books` (Bisa difilter via Query Params, Staff hanya lihat yang `status=PUBLISHED`)
    *   `GET /manual-books/:slug` (Untuk dibaca secara detail)
    *   `POST /manual-books` (Hanya Owner)
    *   `PUT /manual-books/:id` (Hanya Owner)
    *   `DELETE /manual-books/:id` (Hanya Owner)

---

## 4. Desain Frontend (Dashboard - Vite + React 19)

Berdasarkan hasil analisa dari `apps/dashboard/package.json`, project ini menggunakan **Tailwind CSS v4**, **Radix UI**, **TanStack Router**, dan **TanStack Query**. Kita akan memaksimalkan library yang sudah ada agar tidak memberatkan project.

### A. Komponen & State Management
*   **UI Components:** Kita cukup menggunakan komponen `@radix-ui/react-*` yang sudah distyling dengan Tailwind (seperti *Dialog* untuk hapus/confirm, *Select* untuk pilih kategori, *Tabs* untuk layout).
*   **Routing:** Menambahkan route baru di `@tanstack/react-router` (contoh: `/manual-books`, `/manual-books/$slug`, `/admin/manual-books`).
*   **Data Fetching:** Memakai `@tanstack/react-query` untuk mengambil list data manual book dari API backend.
*   **Form Management:** Memakai `@tanstack/react-form` dipadukan dengan `zod` untuk validasi form pembuatan artikel.

### B. Rich Text Editor (Satu-satunya Penambahan Package)
Saat ini belum ada library text editor di project. 
**Rekomendasi:** Kita akan menambahkan library **TipTap** (`@tiptap/react`, `@tiptap/starter-kit`, `@tiptap/extension-youtube`, `@tiptap/extension-image`). 
*Alasan:* TipTap adalah headless editor yang bisa didesain bebas menggunakan Tailwind CSS agar bentuknya bisa disamakan persis dengan UI desain Radix (Shadcn) kalian, tidak seperti library lain yang bawa styling sendiri sehingga merusak tema aplikasi.

---

## 5. Flow Kerja Embed YouTube & Gambar (Teknis)

**Embed YouTube:**
*   Di editor TipTap, aktifkan *Youtube Extension*.
*   Owner klik tombol "Add Video" dan paste link YouTube. Editor otomatis mengubah link itu jadi `<iframe>`.
*   Saat ditampilkan di halaman Staff (Reader), konten (HTML) dari backend tinggal diparsing menggunakan attribute react `dangerouslySetInnerHTML` di dalam tag container biasa.

**Gambar:**
*   Kita bisa pakai URL eksternal biasa (Image Extension TipTap).
*   Jika project ini mensyaratkan user bisa *upload gambar dari komputer*, maka di backend NestJS kita tambahkan fungsi kecil `POST /upload` untuk menerima file, simpannya, dan me-return URL gambarnya.

---

## Kesimpulan
Project ini sudah punya pondasi modern yang sangat rapi. Kita **tidak perlu menginstall library aneh-aneh**. Cukup tambahkan model Sequelize di NestJS, dan install library `tiptap` untuk editor di Frontend. Semua elemen form, routing, state, dan styling akan menggunakan bawaan (TanStack, Zod, Radix, Tailwind) yang sudah kamu siapkan di project.
