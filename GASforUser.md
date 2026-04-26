# Perencanaan Implementasi: Buyer Email Portal

Dokumen ini merinci alur dan arsitektur untuk memberikan akses terbatas kepada pembeli (buyer) agar dapat melihat kode OTP/Link Netflix secara mandiri setelah redeem voucher.

---

## 1. Alur Pengguna (User Flow)

1. **Redeem**: Buyer memasukkan kode voucher di Landing Page.
2. **Validasi**: Sistem memvalidasi voucher dan mengembalikan data akun (email, password, profil).
3. **Akses Link**: Di halaman sukses redeem, muncul tombol **"Pantau OTP / Akses Link"**. Tombol ini berisi link unik (contoh: `/portal/v/[UNIQUE_TOKEN]`).
4. **Otentikasi Portal**: Saat link diklik, sistem mengecek:
   - Apakah token valid?
   - Apakah masa aktif voucher (durasi) masih berlaku?
   - Akun email mana yang dikaitkan dengan redeem ini?
5. **Tampilan Data**: Jika valid, Buyer akan melihat tabel berisi pesan email terbaru, **HANYA** untuk email akun miliknya dan **HANYA** subjek yang diizinkan oleh admin.

---

## 2. Arsitektur Teknis

### A. Backend (API)
*   **Unique Token**: Menambahkan kolom `access_token` (UUID) pada tabel `voucher_redeem` saat buyer melakukan redeem.
*   **Public API Endpoint**: Membuat endpoint baru `/public/email-access/:token` yang tidak memerlukan login admin, tapi divalidasi berdasarkan UUID tersebut.
*   **Security Logic**: 
    - Mencari data redeem berdasarkan token.
    - Cek `voucher.expired_at` atau durasi dari `redeemed_at`.
    - Query ke tabel `email_message` difilter berdasarkan `from_email` (email akun netflix) dan `parsed_context` yang diizinkan.

### B. Dashboard (Admin Management)
*   **Subject Permission**: Menambahkan toggle/checkbox pada menu **Email Subject Management** (yang baru kita buat) untuk menandai subjek mana yang "Boleh Dilihat Buyer".
*   **Voucher Monitoring**: Admin bisa melihat token akses buyer jika diperlukan untuk bantuan teknis.

### C. Frontend (Buyer Portal)
*   Membuat halaman baru di aplikasi **Landing Page** (bukan dashboard admin) agar buyer merasa tetap berada di situs yang sama.
*   Menggunakan **Socket.io** agar ketika OTP masuk ke Gmail, halaman buyer otomatis ter-update tanpa perlu refresh.

---

## 3. Struktur Data (Rencana Perubahan)

1. **Tabel `master.email_subject`**:
   - Tambah kolom `is_public` (boolean): Menentukan apakah subjek ini bisa dilihat buyer atau hanya internal admin.

2. **Tabel `voucher_redeem`**:
   - Tambah kolom `access_token` (string/uuid).

---

## 4. Pertanyaan Klarifikasi (Mohon Dijawab)

1. **Masa Aktif**: Apakah akses email ini harus mati **tepat** saat masa aktif voucher habis (misal: 30 hari), atau ada toleransi waktu tambahan?
2. **Keamanan Link**: Apakah link unik (UUID) sudah cukup, atau buyer perlu memasukkan kembali kode voucher mereka sebagai "password" untuk masuk ke portal tersebut?
3. **Real-time**: Apakah buyer perlu fitur "Real-time" (otomatis muncul tanpa refresh) atau cukup tombol "Refresh" manual saja?
4. **Limitasi**: Apakah perlu dibatasi berapa kali buyer bisa membuka portal tersebut dalam sehari?

---

**Status: Menunggu Feedback & Jawaban Klarifikasi.**

jawaban : 
1. gaada toleransi harus tapt ya
2. token sudah cukup,
3. perlu fitur real-time,
4. perlu dibatasi sehari 10x akses


