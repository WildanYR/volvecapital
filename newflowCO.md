# 🚀 Rencana Implementasi Alur Checkout Baru (Popup Flow)

Dokumen ini menjelaskan rencana perubahan alur checkout dari yang sebelumnya bersifat statis di sisi kanan halaman produk, menjadi alur berbasis popup (modal) yang lebih interaktif dan terarah.

---

## 🛠️ Alur Kerja Baru

### 1. Seleksi Varian Produk & Validasi Awal
- **UI**: Halaman produk tetap menampilkan daftar varian.
- **Interaksi**: Buyer memilih salah satu varian.
- **Aksi**: Tombol **"Lanjutkan ke Pembayaran"** (Fixed di bawah atau di bagian akhir seleksi).
- **Validasi**: 
  - Jika tombol diklik tanpa memilih varian: Area seleksi varian akan **getar (shake animation)** dan muncul pesan error *"Silahkan pilih varian produk terlebih dahulu"*.

### 2. Popup "Checkout Form" (Modal Step 1)
Setelah varian dipilih dan tombol diklik, modal akan muncul dengan konten:
- **Header**: "Detail Pesanan"
- **Form Input**:
  - `Nama Lengkap` (Wajib)
  - `Alamat Email` (Wajib, format email)
  - `Nomor WhatsApp` (Wajib, format telepon)
- **Ringkasan Pesanan (Sisi Kanan/Bawah)**:
  - Nama Produk
  - Varian Produk yang dipilih
  - Harga Layanan
  - Biaya Admin (jika ada) TULIS BIAYA ADMIN GRATIS
  - **Total Bayar**
- **Footer Modal**: Tombol **"Bayar Sekarang"**.
- **Validasi**: Jika form belum lengkap saat diklik, modal akan **getar** dan muncul pesan error *"Silahkan isi form terlebih dahulu"*.

### 3. Popup "Konfirmasi Pembayaran" (Modal Step 2)
Setelah form diisi dan "Bayar Sekarang" diklik, muncul modal konfirmasi:
- **Icon**: Shield/Lock (Menandakan keamanan).
- **Judul**: "Pembayaran Aman"
- **Deskripsi**: "Anda akan dialihkan ke DOKU Gateway untuk menyelesaikan pembayaran secara aman."
- **Info Tagihan**: Kotak highlight berisi **TOTAL TAGIHAN**.
- **Tombol**:
  - **"Lanjutkan Pembayaran"**: Mengalihkan user ke URL DOKU.
  - **"Batalkan"**: Menutup modal konfirmasi dan kembali ke form.

### 4. Pengalihan & Halaman Sukses
- User menyelesaikan pembayaran di DOKU.
- User dialihkan kembali ke halaman `/success`.
- **Halaman Sukses Otomatis**: Menampilkan ringkasan transaksi dan **langsung memunculkan detail login** (Email, Password, Link Streaming, Masa Aktif) tanpa perlu input kode voucher lagi secara manual.
- **Email Notifikasi**: Sistem mengirimkan detail yang sama ke email buyer.

---

## 🎨 Detail Teknis (Framer Motion & Tailwind)

### Animasi Getar (Shake)
Menggunakan `framer-motion` untuk efek getar:
```typescript
const shakeAnimation = {
  x: [0, -10, 10, -10, 10, 0],
  transition: { duration: 0.4 }
};
```

### State Management
- `isCheckoutModalOpen`: boolean
- `isConfirmModalOpen`: boolean
- `selectedVariant`: ProductVariant | null
- `formData`: { name, email, whatsapp }

---

## ❓ Pertanyaan & Klarifikasi

Sebelum saya mulai mengoding, ada beberapa hal yang ingin saya pastikan:

1.  **Integrasi Pembayaran**: Di instruksi tertulis **DOKU**, tapi di screenshot referensi tertulis **Midtrans**. Mana yang ingin digunakan untuk teks di UI?
2.  **Validasi WhatsApp**: Apakah ada format khusus (misal: harus diawali 08/62) atau bebas asalkan angka?
3.  **Halaman Sukses**: Apakah data login ingin ditampilkan **langsung** saat user kembali dari DOKU? (Ini mengasumsikan backend melakukan auto-redeem setelah pembayaran sukses).
4.  **Tampilan Mobile**: Apakah Ringkasan Pesanan di dalam popup diletakkan di bawah form (stacking) atau tetap ingin ada di samping jika layar cukup lebar?

---

> **Catatan**: Jika rencana ini sudah oke, saya akan mulai memodifikasi `apps/landingpage/src/app/product/[slug]/page.tsx` dan membuat komponen Modal baru.

jawaban:
1. tetap di doku karena aku kan pakai gateway doku di project ku ini, di gambar itu hanya contoh aja
2. harus diawali 08 atau 62 ya
3. halaman sukses seperti flow yang ada saat ini aja, menampilkan voucher itu (masih sama dengan yang sekarang jangan auto redeem ya)
4. diletakkan di bawah form (stacking) jika mode ipad dan layar cukup besar boleh dikanan