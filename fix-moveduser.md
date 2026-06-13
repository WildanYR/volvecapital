# Dokumentasi Perbaikan Fitur Pindah Akun & Selipkan User (Smart Rekomendasi)

## 1. Penyebab Bug "User yang Diselipkan Tidak Muncul"
Masalah utama bermula dari pencarian akun pada fitur **"Selipkan User"** di `InsertUserModal`. Pencarian ini memanggil endpoint `getAllAccount` di backend. 

Sebelumnya, jika operator memasukkan kata kunci pencarian berupa nama (mengisi filter `user`), backend akan mengabaikan filter keamanan `{ status: 'active' }`. Hal ini menyebabkan *user* yang sebenarnya sudah berstatus `expired` ikut muncul sebagai pilihan di UI Modal (karena sistem UI mengira mereka masih aktif).

Ketika *user* (yang ternyata sudah kedaluwarsa ini) berhasil dipindahkan ke akun tujuan, *user* tersebut tidak akan ditampilkan di layar (karena `$slug.tsx` dan `MoveUserModal` secara ketat hanya merender komponen untuk *user* yang memiliki status aktif).

**Solusi yang diterapkan:**
Memodifikasi fungsi pencarian di `account.service.ts` agar **selalu** memfilter *user* yang berstatus `active` meskipun sedang dalam mode pencarian berdasar nama:
```typescript
where: filter?.user 
  ? { name: { [Op.iLike]: `%${filter.user}%` }, status: 'active' } 
  : { status: 'active' }
```

---

## 2. Implementasi Aturan Baru Smart Rekomendasi
Fitur **Smart Rekomendasi** (`getAccountUserMoveRecommendations`) telah dirombak untuk mematuhi semua *business rules* berikut secara mutlak:

### A. Aturan Global (Berlaku untuk Semua Varian)
- **Akun Aktif Saja**: Akun dengan status `enable` (akun murni baru yang masih kosong) **tidak akan direkomendasikan**. Aturan `status: { [Op.ne]: 'enable' }` diaktifkan di seluruh cabang.
- **Limit Maksimal 2 Selipan (Screenlimit Prevention)**: Untuk menghindari risiko terkena *screenlimit* Netflix, akun tujuan hanya dapat menampung maksimal 2 *user* tambahan di luar batas maksimal (`totalMaxUsers`). Jika `totalActiveUsers >= totalMaxUsers + 2`, akun tersebut secara otomatis didiskualifikasi dari daftar rekomendasi.

### B. Aturan Khusus Varian Harian (isDaily)
Kriteria akun dikategorikan "Harian" adalah jika namanya mengandung kata `harian` atau `duration <= 1`. Jika ya, aturannya adalah:
- **Tidak Boleh Lintas Varian**: Rekomendasi akun tujuan wajib memiliki `product_variant_id` yang **sama persis** dengan varian akun asal.
- **Minimal 5 Jam Terpakai**: Hanya akun yang waktu dimulainya (*batch_start_date*) sudah berjalan minimal 5 jam yang lalu yang akan ditampilkan.

### C. Aturan Khusus Varian Selain Harian
- **Boleh Lintas Varian**: Rekomendasi akan mencakup berbagai varian akun (selama masih lolos pengecekan batas batas kuota 2 *user* selipan dan bukan akun `enable`).
- **Prioritas Berdasarkan Tanggal Kedaluwarsa Terdekat**: Rekomendasi akan diurutkan secara otomatis (di-`sort`) mencari akun yang memiliki tanggal kedaluwarsa (`batch_end_date`) paling mendekati tanggal kedaluwarsa dari *user* yang ingin dipindahkan.

Dokumentasi ini dibuat pada tanggal 13 Juni 2026.
