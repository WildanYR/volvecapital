# Rencana Implementasi: Fitur Pindah Pengguna (Move User) & Riwayat Pindah

## Latar Belakang Masalah
Saat ini, jika sebuah akun bermasalah (misalnya `abc@email.com` gagal login), admin memindahkan pengguna (User B) ke akun lain (misalnya `def@email.com`) secara manual (hanya memberikan email/password baru ke pengguna). Sistem tidak pernah mencatat perpindahan ini, sehingga admin kehilangan *audit trail* (jejak riwayat) di mana pengguna tersebut sebelumnya berada, dan sulit melacak pengguna.

## Solusi Praktis yang Diusulkan
Alih-alih menyalin data secara manual, kita akan membuat fitur **"Move User"**. 
Pengguna (User B) beserta **semua data durasinya (tanggal expired, status, dll) tetap dipertahankan**. Kita hanya mengubah "ikatan" ke akun mana dan ke profil mana ia terhubung. Untuk mengatasi masalah jejak riwayat, kita akan membuat tabel baru khusus untuk mencatat sejarah perpindahan ini.

> [!TIP]
> **Kenapa cara ini paling praktis?**
> Memindahkan ID Profil dan ID Akun dari data pengguna secara langsung memastikan bahwa semua transaksi dan sisa durasi tetap menempel pada pengguna tersebut. Tabel riwayat tambahan akan menyelesaikan masalah tidak adanya *audit trail* tanpa mengacaukan atau menduplikasi data yang sudah ada.

---

## Rincian Perubahan (Proposed Changes)

### 1. Database (Model Baru & Migrasi)
Kita akan membuat tabel baru untuk mencatat jejak perpindahan.

#### [NEW] `apps/api/src/database/models/account-user-move-history.model.ts`
Berisi kolom-kolom:
- `id` (Primary Key)
- `account_user_id` (Relasi ke AccountUser)
- `from_account_id` & `from_profile_id` (Asal)
- `to_account_id` & `to_profile_id` (Tujuan)
- `reason` (Alasan perpindahan, *opsional*)
- `created_at` (Waktu dipindah)

> *Catatan: Tabel ini juga harus dimasukkan ke dalam `src/database/postgres.provider.ts` (untuk multi-tenant) dan dibuatkan skrip migrasinya.*

### 2. Backend API
#### [MODIFY] `apps/api/src/modules/account/account.controller.ts` & `account.service.ts`
- Membuat endpoint baru `POST /account-user/:id/move`.
- **Logika:**
  1. Cari data `AccountUser` berdasarkan ID.
  2. Simpan profil lamanya ke dalam `AccountUserMoveHistory`.
  3. Perbarui `account_id` dan `account_profile_id` dari `AccountUser` tersebut ke target yang dipilih.
  4. **Jangan sentuh `expired_at`**, sehingga durasi aslinya masih akan tetap mengikuti durasi profil lama.

### 3. Frontend Dashboard
#### [MODIFY] `apps/dashboard/src/components/account-profile.tsx` (atau file terkait yang menampilkan daftar User)
- Tambahkan **Tombol / Menu "Pindah Akun (Move)"** pada setiap baris/kartu pengguna.

#### [NEW] `apps/dashboard/src/components/move-user-modal.tsx`
- Modal (Popup) yang akan muncul ketika tombol "Pindah Akun" diklik.
- **Isi Modal:**
  - Nama Pengguna & Sisa Durasi (untuk konfirmasi).
  - *Dropdown/Search* untuk mencari Akun tujuan (misal: `def@email.com`).
  - *Dropdown* untuk memilih Profil tujuan di dalam akun tersebut (misal: Profil A).
    > Jika Profil A sudah ada orangnya, admin tetap dapat memilihnya (nyelip / gabung).
  - Kolom teks `Catatan/Alasan` (opsional).
  - Tombol **Simpan Kepindahan**.

#### [MODIFY] `apps/dashboard/src/components/account-user-history.tsx` (opsional)
- Bisa ditambahkan tab "Riwayat Pindah" di profil pengguna tersebut agar admin bisa melihat bahwa "User B dulunya ada di akun `abc@email.com` dan dipindah karena error."

---

## Pertanyaan / Konfirmasi
Sebelum saya mulai mengetikkan kodenya, mohon konfirmasi beberapa hal berikut:
1. Apakah struktur tabel riwayat di atas sudah sesuai dengan kebutuhan "Track Record" yang kamu inginkan?
2. Untuk modal di _frontend_, apakah kamu ingin admin wajib mengisi **Alasan Pindah**, atau dibiarkan opsional saja?
3. Saat mencari akun tujuan, apakah difilter khusus untuk **produk/varian yang sama** (misal sesama Netflix Harian), atau admin bebas memindahkannya lintas varian (misal dari Netflix Harian dipindah ke Netflix Bulanan)?