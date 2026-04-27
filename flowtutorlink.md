# Flow Penggunaan Link Tutorial Dinamis

Dokumen ini menjelaskan bagaimana cara menghubungkan proses **Redeem** dengan **Halaman Tutorial** sehingga tombol `$$portal_url` bisa berfungsi otomatis.

## Skenario Utama: Tombol "Lihat Panduan" Setelah Redeem

Agar user tidak perlu login lagi saat di halaman tutorial, kita harus mengirimkan `token` dan `tenant` melalui URL.

### 1. Konfigurasi di Dashboard Admin
Saat Anda membuat Tutorial (misal: "Cara Login & Cek OTP"), Anda akan mendapatkan **Slug**.
Contoh slug: `panduan-cek-otp`.

### 2. Implementasi di Halaman Redeem (Landing Page)
Setelah user berhasil memasukkan kode voucher, halaman akan menampilkan detail akun. Di sinilah kita menaruh tombol bantuan.

**Logika Pembuatan Link:**
```javascript
const tutorialSlug = "panduan-cek-otp"; // Slug yang Anda buat
const tutorialLink = `/tutorial/${tutorialSlug}?token=${accessToken}&tenant=${tenantId}`;
```

### 3. Pengalaman Pengguna (User Journey)
1.  **Redeem**: User memasukkan kode voucher di halaman `/redeem`.
2.  **Success**: Detail akun muncul, dan di bawahnya terdapat tombol emas bertuliskan **"Lihat Panduan Penggunaan"**.
3.  **Klik**: User mengklik tombol tersebut dan diarahkan ke `/tutorial/panduan-cek-otp?token=TOKEN_USER&tenant=ID_TENANT`.
4.  **Tutorial**: Halaman tutorial terbuka. Karena ada token di URL, maka langkah yang memiliki placeholder `$$portal_url` akan memunculkan tombol **"Buka Portal Email"**.
5.  **Selesai**: User bisa mengikuti langkah sambil sesekali mengklik tombol portal untuk cek OTP tanpa kehilangan konteks tutorial.

---

## Opsi Penempatan Link

Anda memiliki 2 cara untuk memberikan link ini ke user:

### Opsi A: Melalui Tombol Otomatis (Sangat Direkomendasikan)
Saya bisa menambahkan kolom **"Pilih Tutorial"** pada setiap **Produk Variant** di dashboard. Jika dipilih, maka di halaman redeem akan muncul tombol "Lihat Panduan" secara otomatis yang mengarah ke tutorial tersebut lengkap dengan tokennya.

### Opsi B: Melalui Instruksi Manual
Anda bisa menuliskan link di kolom "Instruksi" produk, namun cara ini kurang efektif karena Anda harus mengetik manual dan link-nya tidak bisa dinamis membawa token per user.

---

**Rekomendasi Saya:**
Jika Anda setuju, saya bisa mengimplementasikan **Opsi A**. Jadi di dashboard saat edit Produk Variant, akan ada pilihan *"Tutorial Terkait"*. Jika diisi, tombol panduan akan muncul otomatis setelah user redeem.
