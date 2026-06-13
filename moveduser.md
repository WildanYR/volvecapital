# Rencana Implementasi: Fitur Pindah Pengguna (Move User) & Riwayat Pindah

## Latar Belakang Masalah
Saat ini admin kesulitan karena saat melakukan pindah pengguna (User B) dari satu akun (misal `abc@email.com`) ke akun lain (`def@email.com`), sistem tidak mencatat riwayat pemindahan tersebut. Akibatnya, admin kehilangan *audit trail*. Selain itu, pencarian akun pengganti dilakukan secara manual sehingga memakan waktu.

## Solusi yang Diusulkan
Pengguna (User B) beserta **data durasinya (tanggal expired, status, dll) akan tetap dipertahankan**. Kita hanya mengubah "ikatan" ke akun mana dan ke profil mana ia terhubung. 

---

## Rincian Perubahan (Proposed Changes)

### 1. Database (Model Baru & Migrasi)
Tabel riwayat untuk menyelesaikan masalah tidak adanya *track record*.

#### [NEW] `apps/api/src/database/models/account-user-move-history.model.ts`
Berisi kolom-kolom:
- `id` (Primary Key)
- `account_user_id` (Relasi ke AccountUser)
- `from_account_id` & `from_profile_id` (Asal)
- `to_account_id` & `to_profile_id` (Tujuan)
- `reason` (Alasan perpindahan - **Wajib Diisi**)
- `created_at` (Waktu dipindah)

> *Catatan: Tabel ini didaftarkan ke `src/database/postgres.provider.ts` dan dibuatkan skrip migrasinya.*

### 2. Backend API
#### A. Endpoint `POST /account-user/:id/move`
**Logika:**
1. Cari data `AccountUser` berdasarkan ID.
2. Wajibkan parameter `reason` (Alasan).
3. Simpan profil lamanya ke dalam `AccountUserMoveHistory`.
4. Perbarui `account_id` dan `account_profile_id` dari `AccountUser` tersebut ke target.
5. **Jangan ubah `expired_at`**, durasi aslinya tetap mengikuti durasi semula.

#### B. Endpoint `GET /account-user/:id/move-recommendations`
Memberikan 5 rekomendasi akun tujuan terbaik berdasarkan jenis varian akun asal:
- **Jika akun asal adalah Varian Harian (Daily):**
  1. Cari akun varian harian lain (email berbeda).
  2. Cari yang **belum ada selipan** (profil-profil di akun tersebut hanya diisi maksimal 1 orang asli, belum ada user "tumpangan").
  3. Sisa waktu aktif akun/profil tersebut minimal **5 jam** dari waktu saat ini.
- **Jika akun asal adalah Varian > 1 hari (Mingguan/Bulanan/Sharing):**
  1. Bebas lintas varian.
  2. Urutkan berdasarkan kedekatan **tanggal expired** akun asli dengan tanggal expired akun rekomendasi.
  3. Ambil 5 teratas yang paling mendekati.

### 3. Frontend Dashboard
#### [MODIFY] `apps/dashboard/src/components/account-profile.tsx`
- Tambahkan tombol **"Pindah Akun (Move)"** pada setiap kartu pengguna.

#### [NEW] `apps/dashboard/src/components/move-user-modal.tsx`
- Modal popup ketika tombol diklik.
- **Isi Modal:**
  1. **Informasi Pengguna:** Nama & Sisa Durasi asli.
  2. **Daftar Rekomendasi Pintar (Smart Recommendations):**
     - Menampilkan 5 akun rekomendasi dari API `move-recommendations` yang bisa diklik langsung.
  3. **Pencarian Manual:** Jika rekomendasi kurang cocok, admin tetap bisa mencari manual semua akun lintas varian.
  4. **Pilih Profil:** Pilih ke profil mana ia akan "diselipkan".
  5. **Alasan Pindah:** *Input* teks (*Wajib Diisi*).
  6. **Tombol Konfirmasi.**

#### [MODIFY] `apps/dashboard/src/components/account-user-history.tsx`
- Tambahkan tab/bagian "Riwayat Pindah" di modal detail pengguna agar admin bisa melihat jejak pelacakannya.

---

## Status Rencana
Sesuai arahan:
- Tabel riwayat: **Disetujui**
- Alasan pindah: **Wajib diisi**
- Perpindahan lintas varian: **Diperbolehkan bebas**
- Fitur Rekomendasi Akun: **Ditambahkan ke dalam *scope* pengerjaan**

Jika detail rekomendasi di atas sudah sesuai persis dengan bayanganmu, beritahu saya dan kita akan langsung mulai melakukan *coding* tahap demi tahap!
