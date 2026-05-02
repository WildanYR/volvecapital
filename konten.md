# Perencanaan Fitur Artikel (Blog/News)

Fitur ini akan diimplementasikan menyerupai sistem **Tutorial** yang sudah ada, namun disesuaikan untuk kebutuhan konten artikel/berita (seperti update film terbaru).

## 1. Arsitektur Data (Backend)
- **Model Baru**: `Article`
- **Fields**:
  - `id`: UUID
  - `tenantId`: Relasi ke Tenant
  - `title`: Judul Artikel
  - `slug`: URL unik (misal: /blog/update-netflix-mei)
  - `subtitle`: Deskripsi singkat untuk kartu di halaman daftar
  - `thumbnailUrl`: Gambar utama artikel
  - `content`: Isi artikel (Format Markdown atau HTML)
  - `category`: Kategori artikel (misal: Netflix, Disney+, News)
  - `isPublished`: Status draf atau publikasi
  - `createdAt / updatedAt`: Penanda waktu

## 2. Dashboard UI
- **Halaman Daftar Artikel**: Tabel untuk melihat, mengedit, dan menghapus artikel.
- **Editor Artikel**: 
  - Form untuk input Judul, Slug (auto-generate), dan Thumbnail.
  - Editor teks (Rich Text atau Markdown editor) untuk menulis isi artikel secara panjang lebar.

## 3. Landing Page UI
- **Halaman `/blog` (atau `/berita`)**: Menampilkan grid kartu artikel terbaru.
- **Halaman `/blog/[slug]`**: Halaman detail artikel dengan desain premium yang bersih dan mudah dibaca.

---

## Pertanyaan Klarifikasi (Mohon Dijawab)

1. **Format Konten**: Apakah Anda ingin isi artikelnya berupa **Langkah-Langkah** (seperti Tutorial yang ada gambarnya satu-satu) atau berupa **Teks Panjang** (seperti blog pada umumnya yang bisa disisipi gambar di tengah-tengah)?
2. **Nama URL**: Mana yang Anda lebih suka untuk nama halamannya: `/blog`, `/article`, atau `/news`?
3. **Kategori**: Apakah artikel ini perlu dikelompokkan berdasarkan kategori (misal: Film Netflix, Film Disney+, Tips & Trik)?
4. **Komentar**: Apakah Anda membutuhkan fitur komentar di bawah artikel, atau cukup baca saja?
5. **Dashboard**: Apakah di Dashboard Anda ingin ada tombol "Buat Artikel Baru" di sidebar, tepat di bawah menu Tutorial?

---
