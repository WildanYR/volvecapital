# Implementasi Fitur Sistem Tutorial (Dynamic Guide)

Fitur ini akan memungkinkan admin membuat konten edukasi/panduan untuk user dengan format langkah-demi-langkah (horizontal cards) yang bisa dikelola sepenuhnya dari dashboard.

## 1. Database Schema (Tenant Level)
Kita akan membuat tabel baru `tutorial` di level tenant untuk menyimpan data tutorial.

**Table: `tutorial`**
- `id`: UUID (Primary Key)
- `title`: String (Judul tutorial)
- `slug`: String (Unique, untuk URL)
- `subtitle`: Text (Deskripsi singkat tutorial)
- `is_published`: Boolean (Status publikasi)
- `steps`: JSONB (Array berisi detail langkah-langkah)
  - Struktur Step: `{ label: string, title: string, description: string, image_url: string }`
- `created_at` & `updated_at`: Timestamp

## 2. Rencana Backend (API)
- Membuat module `tutorial` baru.
- **Admin Endpoints**: CRUD (Create, Read, Update, Delete) tutorial.
- **Public Endpoints**:
  - `GET /public/tutorial`: Mengambil daftar tutorial yang sudah dipublish.
  - `GET /public/tutorial/:slug`: Mengambil detail satu tutorial berdasarkan slug.

## 3. Rencana Dashboard (Admin UI)
- **Menu Baru**: `Pengaturan` > `Tutorial`.
- **Tutorial List**: Halaman untuk melihat semua tutorial yang sudah dibuat.
- **Tutorial Editor**:
  - Input untuk Judul, Subjudul, dan Slug.
  - **Dynamic Field Array**: Interface untuk menambah/menghapus langkah-langkah.
  - Input URL gambar untuk setiap langkah (Pratinjau gambar otomatis jika link valid).
  - Preview sederhana tampilan tutorial sebelum dipublish.

## 4. Rencana Landing Page (Public UI)
- **Halaman Daftar (`/tutorial/`)**: Grid card yang menampilkan judul & subjudul tutorial yang tersedia.
- **Halaman Detail (`/tutorial/:slug`)**:
  - Header dengan Judul & Subjudul.
  - List langkah-langkah menggunakan **Horizontal Card Design**:
    - **Kiri**: Image (Rounded, Shadow, Aspect Ratio yang konsisten).
    - **Kanan**: Label kecil (uppercase, bold), Judul langkah, dan Deskripsi.

---

## Klarifikasi & Pertanyaan
Sebelum saya lanjut ke tahap teknis/pengodingan, mohon informasikan beberapa hal berikut:

1. **Otomatisasi Slug**: Apakah slug URL (misal: `/tutorial/cara-beli`) ingin dibuat otomatis dari judul atau Anda ingin bisa mengisi manual agar lebih fleksibel?
2. **Urutan Langkah**: Apakah Anda membutuhkan fitur *drag-and-drop* untuk mengatur ulang urutan langkah, atau cukup urutan berdasarkan saat input saja?
3. **Desain List Tutorial**: Untuk halaman `/tutorial/` (daftar semua tutorial), apakah ingin tampilan yang premium seperti grid card dengan icon, atau list sederhana saja?
4. **Thumbnail Utama**: Selain gambar di setiap langkah, apakah Tutorial ini butuh "Gambar Utama" (cover image) untuk ditampilkan di halaman daftar tutorial?

jawabannya :
1. otomatisasi slug ya 
2. ya saya mau bisa ada fitur drag and drop untuk mengatur ulang urutan langkah 
3. tampilan yang premium ya 
4. butuh thumbnail utama (embed link aja)