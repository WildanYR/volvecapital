# Rencana Implementasi: Kustomisasi Tampilan Setelah Redeem

Dokumen ini menjelaskan rencana untuk menambahkan fitur kustomisasi tampilan halaman redeem di dashboard. Admin akan dapat memilih field mana saja yang ditampilkan kepada pengguna setelah voucher berhasil di-redeem.

## 1. Perubahan Basis Data

Menambahkan kolom `redeem_display_config` pada tabel `product_variant`. Kolom ini akan menyimpan konfigurasi dalam format JSON.

**Struktur JSON:**
```json
{
  "show_email": boolean,
  "show_password": boolean,
  "show_profile_name": boolean,
  "show_expired_at": boolean,
  "show_copy_template": boolean,
  "show_buyer_portal": boolean
}
```

## 2. Perubahan Backend (API)

- **Model (`apps/api/src/database/models/product-variant.model.ts`)**:
  - Tambahkan field `redeem_display_config` (DataType.JSONB).
- **Public Service (`apps/api/src/modules/public/public.service.ts`)**:
  - Pastikan data `redeem_display_config` ikut terkirim saat mengambil detail voucher atau setelah redeem.
- **Voucher/Product DTOs**:
  - Update DTO untuk validasi input baru dari dashboard.

## 3. Perubahan Dashboard (Frontend)

- **Schema (`apps/dashboard/src/components/forms/common/schemas/product-variant-form.schema.ts`)**:
  - Tambahkan validasi untuk field-field checkbox baru.
- **Form (`apps/dashboard/src/components/forms/product-variant.form.tsx`)**:
  - Tambahkan section baru "Konfigurasi Tampilan Halaman Redeem".
  - Gunakan Checkbox untuk setiap pilihan (Email, Password, Nama Profil, Masa Aktif, Instruksi, Tombol Portal).
- **Service**:
  - Update `product.service.ts` untuk mengirim data konfigurasi ke backend.

## 4. Perubahan Halaman Redeem (Landing Page)

- **Page (`apps/landingpage/src/app/redeem/page.tsx`)**:
  - Ambil konfigurasi dari `result.voucher.product_variant.redeem_display_config`.
  - Gunakan kondisional rendering (`&&`) untuk setiap elemen UI yang relevan.
  - Jika konfigurasi kosong (null/undefined), tampilkan semua sebagai default (fallback).

---

## Pertanyaan Klarifikasi

Sebelum saya mulai mengimplementasikan kodenya, mohon konfirmasi beberapa hal berikut:

1. **Lingkup Konfigurasi**: Apakah konfigurasi ini sebaiknya per **Varian Produk** (misal: Netflix Harian vs Netflix Bulanan bisa beda) atau per **Produk** secara global (semua varian Netflix sama)? *Saran: Per Varian lebih fleksibel.*
2. **Email Notification**: Apakah settingan ini juga harus berlaku untuk isi **Email Konfirmasi** yang dikirim ke user, atau khusus untuk **halaman di website** saja?
3. **Default Value**: Jika saya menambahkan varian baru, apakah default-nya semua field langsung tampil?
4. **Label Field**: Apakah Anda hanya ingin menyembunyikan/menampilkan field saja, atau suatu saat ingin bisa mengubah labelnya juga? (Misal: "Email / Username" diganti jadi "ID Akun"). Jika iya, saya bisa sekalian siapkan struktur JSON yang mendukung label custom.
5. **Buyer Portal**: Untuk tombol "Portal Email OTP", apakah itu juga ingin diatur per varian? (Saat ini sepertinya hanya muncul jika `accessToken` ada).

Ditunggu feedback-nya ya!
