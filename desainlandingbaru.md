# Dokumen Implementasi Landing Page Baru (Volve Capital)

Dokumen ini berisi spesifikasi teknis finalized untuk merombak tampilan landing page menjadi lebih premium, bersih, dan mobile-friendly.

## 1. Konsep Desain (Aesthetics)
- **Tema**: Ultra Dark Mode.
- **Warna Utama**: 
  - Background: `#050505` (Deep Black)
  - Accent: `#FFB800` (Gold/Amber) untuk tombol dan highlight.
  - Secondary Accent: `#121212` untuk card background.
- **Efek Visual**:
  - **Glassmorphism**: Penggunaan `backdrop-blur-md` pada navbar dan card.
  - **Dynamic Blobs**: Background dengan efek blur dinamis yang bergerak pelan.
  - **Animations**: `framer-motion` untuk *fade-in*, *stagger*, dan *hover transitions*.

## 2. Struktur Komponen UI

### A. Global Layout (`layout.tsx` & `globals.css`)
- Implementasi font `Outfit` atau `Inter`.
- Konfigurasi Tailwind 4 custom theme untuk variabel warna.
- Komponen `BackgroundBlobs` yang membungkus seluruh aplikasi.

### B. Navbar (`navbar.tsx`)
- Desain melayang (*floating*) dengan *glassmorphism*.
- Logo di kiri, menu navigasi di tengah (Home, Produk, Redeem), dan tombol "Login Dashboard" di kanan.

### C. Hero Section (`hero.tsx`)
- **Badge**: `<motion.div>` dengan teks "Sistem Voucher Otomatis 24/7".
- **Headline**: "Akses Layanan Premium Seketika." (Gradien Emas ke Putih).
- **CTA**: 
  - Tombol Utama: "Mulai Sekarang" (Anchor ke Section Decision).
  - Tombol Sekunder: "Lihat Katalog".

### D. Decision Section (`decision-split.tsx`)
- Dua kontainer besar dengan icon `Key` (Redeem) dan `ShoppingCart` (Buy).
- Kontainer Kiri: "Sudah Punya Kode?" -> CTA ke `/redeem`.
- Kontainer Kanan: "Belum Punya Kode?" -> CTA ke `/product`.

### E. How It Works (`steps.tsx`)
- 3 Kolom/Baris:
  1. **Pilih Varian**: Pilih produk yang diinginkan.
  2. **Bayar Otomatis**: Pembayaran instan via Midtrans (QRIS, dll).
  3. **Gunakan Layanan**: Kode voucher otomatis dikirim & siap redeem.

### F. Product Showcase (`product-section.tsx`)
- Grid 3 kolom untuk produk "Top Selling".
- Filter berdasarkan field `is_popular` atau `order_count` tertinggi.
- Card produk menampilkan: Icon brand, nama produk, durasi, harga, dan tombol "Pilih Paket".

### G. Value Propositions (`features.tsx`)
- Grid ikonik: "Tanpa Login", "24 Jam", "Support WA", "Garansi Legal".

## 3. Spesifikasi Halaman Baru

### Halaman `/redeem`
- Interface minimalis terpusat.
- Input box besar untuk kode voucher.
- Integrasi API `GET /public/voucher/:code` untuk validasi.
- Tampilan detail akun (Email, Password, Masa Aktif) setelah sukses redeem.
- *Note: Belum ada redirect ke layanan resmi.*

### Halaman `/product`
- Grid katalog lengkap (Tanpa kategori produk).
- Search bar untuk mencari produk spesifik.
- Menggunakan `slug` untuk routing ke halaman detail.

### Halaman `/product/[slug]`
- Pemilihan varian (misal: 1 Bulan, 3 Bulan).
- Form ringkas untuk email/whatsapp (untuk pengiriman kode).
- Integrasi payment gateway (Midtrans Snap Popup di frontend menggunakan `snap_token`).

## 4. Alur Kerja Implementasi
1. **Fase 1: Dasar & Global Styles**
   - Update `globals.css` dengan desain sistem baru (Dark Mode, Gold Accent).
   - Buat komponen `BackgroundBlobs`.
2. **Fase 2: Komponen Landing Page**
   - Rombak `Navbar`, `Hero`, dan buat `DecisionSplit`.
   - Update `ProductGrid` untuk versi "Top 3".
3. **Fase 3: Halaman Fungsional**
   - Buat folder `app/redeem/page.tsx` dan pindahkan logika dari `RedeemSection`.
   - Buat folder `app/product/page.tsx` untuk katalog.
   - Buat folder `app/product/[slug]/page.tsx` untuk detail & checkout.
4. **Fase 4: Polishing**
   - Optimasi mobile (stacking cards, menu hamburger).
   - Penyesuaian durasi animasi `framer-motion`.

---
*Catatan: Implementasi tetap mendukung multi-tenant berbasis subdomain.*