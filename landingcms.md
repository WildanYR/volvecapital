# Implementasi Landing Page CMS (Volve Capital)

Dokumen ini berisi rencana implementasi fitur kustomisasi Landing Page yang dapat diatur melalui Admin Dashboard.

## 1. Arsitektur Data (Backend - apps/api)

Kita akan menggunakan tabel `tenant_setting` yang sudah ada untuk menyimpan konfigurasi landing page dalam format JSON string.

### Key Pengaturan:
- `LANDING_HERO`: Data Hero section (Title, Subtitle, Buttons, Badge, Social Proof).
- `LANDING_FEATURES`: Array of Features (Icon, Title, Description).
- `LANDING_TESTIMONIALS`: Array of Testimonials (Name, Role, Content, Stars, Initial).
- `LANDING_FAQ`: Array of FAQ (Question, Answer).
- `LANDING_NAVBAR`: Konfigurasi Navbar (Logo Text/Icon, Navigation Links, Feature Toggles).
- `LANDING_FOOTER`: Konfigurasi Footer (Address, Email, Social Media).
- `LANDING_THEME`: Pengaturan warna primer.

### Perubahan API:
- **`SettingService`**: Menambahkan metode `updateBulk` untuk memperbarui banyak key sekaligus.
- **`SettingController`**: Menambahkan endpoint `PATCH /setting/bulk` untuk efisiensi pembaruan dari Dashboard.

## 2. Admin Dashboard (apps/dashboard)

Membuat halaman pengaturan baru di `/dashboard/setting/landing` dengan pembagian section sebagai berikut:

### UI Components:
- **Hero Editor**: Form untuk teks statis dan pengaturan Social Proof.
- **Dynamic List Editor**: Komponen reusable untuk mengelola list (Features, Testimonials, FAQ) yang mendukung tambah, hapus, dan edit item.
- **Icon Selector**: Input untuk memilih icon (menggunakan nama Lucide Icon atau URL Image).
- **Color Picker**: Untuk menentukan warna primer brand tenant.
- **Preview (Optional/Phase 2)**: Menampilkan preview kecil perubahan sebelum disimpan.

## 3. Landing Page (apps/landingpage)

### Integrasi Data:
- Fetch semua key `LANDING_*` saat halaman dimuat (Server-side rendering atau Client-side dengan loading state).
- Mengganti semua teks dan data hardcoded di komponen React dengan data dari API.
- Jika data tidak ditemukan di API, gunakan nilai default yang ada sekarang.

### Komponen Baru:
- **`Faq.tsx`**: Membuat komponen FAQ baru dengan gaya Accordion yang modern dan responsif.

## 4. Shared Types (packages/shared-types)

Mendefinisikan interface yang konsisten agar Backend, Dashboard, dan Landing Page memiliki struktur data yang sama:
- `LandingHeroConfig`
- `LandingFeatureItem`
- `LandingTestimonialItem`
- `LandingFaqItem`
- `LandingNavbarConfig`
- `LandingFooterConfig`

---

# Pertanyaan Klarifikasi

Sebelum saya memulai koding, ada beberapa hal yang perlu saya pastikan:

1. **Pemilihan Icon**: Untuk bagian "Social Proof" dan "Features", apakah Anda ingin user bisa memilih dari daftar icon yang saya sediakan (Lucide Icons), atau cukup memasukkan link gambar/embed?
2. **Detail FAQ**: Anda meminta FAQ disesuaikan dengan produk. Apakah saya harus membuat daftar FAQ default yang relevan dengan bisnis voucher/premium (misal: "Bagaimana cara redeem?", "Berapa lama prosesnya?") sebagai placeholder awal?
3. **Navigasi Navbar**: "Navigasi nya juga bisa di edit" -> Apakah user bisa menambah link custom ke website lain, atau hanya mengatur link internal yang sudah ada (Home, Products, Redeem, Tutorial)?
4. **Warna Tema**: Apakah kustomisasi warna hanya terbatas pada warna primer saja, atau user butuh kontrol lebih detail seperti warna background, teks, dll? (Rekomendasi: Warna primer saja agar desain tetap harmonis).
5. **Bahasa**: Apakah Landing Page ini direncanakan untuk mendukung multi-bahasa nantinya, atau tetap dalam Bahasa Indonesia?

jawaban : 
1. cukup memasukan link embed nya saja untuk icon nya 
2. tolong buatkan **data default** (seperti benefit Shopee Ads yang Anda contohkan) dan bisa di hapus dan di tambah juga ya
3. berdasarkan url tenant nya misal tenant_name.localhost:3001
4. saya tidak ada untuk mengubah teman ya jadi tema nya biarkan aja jangan dirubah
5. tetap dalam bahasa indonesia aja
