# Dokumentasi Flow Reset Password Netflix

Dokumen ini menjelaskan alur kerja (workflow) modul `NetflixModule` pada bot untuk melakukan reset atau perubahan password akun Netflix secara otomatis.

## Overview
Modul ini menangani dua skenario utama:
1.  **Change Password (Kondisi Login)**: Mengubah password langsung dari pengaturan akun jika sesi masih aktif.
2.  **Reset Password (Kondisi Logged Out)**: Melakukan permintaan reset link melalui email jika sesi sudah habis, lalu menunggu link reset dikirimkan kembali ke bot.

---

## Alur Detail (Step-by-Step)

### 1. Inisialisasi & Persiapan
*   Bot menerima task `resetPassword` yang berisi data: `email`, `password` (lama), dan `newPassword` (baru).
*   Bot membuat **Browser Context** khusus untuk email tersebut agar sesi antar akun tidak saling tercampur.

### 2. Pengecekan Status Login
Bot membuka halaman `netflix.com/password` dan melakukan pengecekan cepat (race condition) untuk menentukan status:
*   Jika muncul input password lama -> **Status: Logged In**.
*   Jika diarahkan ke halaman Login -> **Status: Not Logged In**.

---

### 3. Skenario A: Not Logged In (Lupa Password)
Jika bot tidak dalam kondisi login, ia akan menjalankan alur "Forgot Password":
1.  **Request Reset**: Navigasi ke `netflix.com/LoginHelp`.
2.  **Input Email**: Memilih opsi "Email", memasukkan alamat email target, dan klik "Send Email".
3.  **Menunggu Reset Link**: 
    > [!IMPORTANT]
    > Pada tahap ini, bot akan **berhenti sejenak (Idle)** dan menunggu event eksternal bernama `NETFLIX_REQ_RESET_PASSWORD`. 
    > Ini berarti sistem lain (seperti sistem pembaca email/forwarder) harus mengirimkan link reset yang didapat dari email Netflix kembali ke bot.
4.  **Eksekusi Reset**: Setelah link diterima, bot membuka link tersebut.
5.  **Input Password Baru**: Memasukkan `newPassword` di kolom password baru dan konfirmasi.
6.  **Sign Out All Devices**: Bot akan selalu mencentang opsi *"Require all devices to sign in again with new password"* untuk memastikan semua user lama tertendang.
7.  **Submit**: Klik tombol "Save".

---

### 4. Skenario B: Logged In (Ubah Password Langsung)
Jika sesi masih aktif, alurnya lebih singkat:
1.  **Input Password**: Memasukkan `password` (lama), `newPassword` (baru), dan konfirmasi password baru.
2.  **Sign Out All Devices**: Mencentang opsi keluar dari semua perangkat.
3.  **Submit**: Klik tombol "Save".

---

### 5. Sinkronisasi ke Backend (API)
Setelah password berhasil diubah di website Netflix, bot akan mencoba mengupdate data di database utama aplikasi:
*   Bot memanggil API `updateNetflixAccountStatus`.
*   Mengirimkan `accountId` dan `newPassword` agar user di Dashboard bisa melihat password yang baru.

---

## Penanganan Error & Notifikasi
*   **Gagal Update API**: Jika password di Netflix sukses diubah tapi API gagal diupdate, bot akan memberikan log status `NEED_ACTION`. Anda harus mengubah password secara manual di dashboard agar tidak terjadi ketidakcocokan data.
*   **Gagal Reset**: Jika terjadi error (misal: link expired atau email tidak ditemukan), bot akan memberikan error `NEED_ACTION` yang meminta operator melakukan reset manual.

---

## Ringkasan Teknis
*   **Module File**: `apps/bot2/src/modules/netflix/NetflixModule.ts`
*   **Timeout Tunggu Email**: Dikonfigurasi di TaskManager (biasanya beberapa menit).
*   **Keamanan**: Menggunakan `sanitizeEmail` untuk penamaan folder session agar aman dari karakter ilegal di filesystem.
