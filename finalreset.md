# Rencana Implementasi: Netflix Account Post-Reset Automation (V3)

Dokumen ini merinci logika tambahan setelah reset password berhasil untuk mengatur status akun (Enable/Disable) dan switch varian secara otomatis.

## 1. Logika Penentuan Status (Enable/Disable)

Penentuan status akun didasarkan pada `subscription_expiry` (Tanggal Berakhir Langganan) dengan aturan sebagai berikut:

*   **Kondisi 1: Sudah Lewat Tanggal**
    *   Jika `currentTime > subscription_expiry` -> **DISABLE**.
*   **Kondisi 2: H-1 Berakhir (Hari Terakhir)**
    *   Jika hari ini adalah hari terakhir (`expiryDate - 1 day`):
        *   Sebelum jam 15:00 -> **ENABLE**.
        *   Sesudah jam 15:00 -> **DISABLE**.
*   **Kondisi 3: Masih Aktif (Jauh dari hari berakhir)**
    *   Jika hari ini masih jauh sebelum `expiryDate - 1 day` -> **ENABLE**.

## 2. Logika Auto Switch Varian

Semua akun yang masuk ke proses reset password akan dicek variannya:
*   Jika varian saat ini **BUKAN** "Harian" (misal: Mingguan, Bulanan, dll) -> Ubah otomatis ke **"Harian"**.
*   Jika varian saat ini sudah **"Harian"** -> Tetap **"Harian"**.

## 3. Alur Teknis di Bot (NetflixModule)

1.  **Penerimaan Data**: Bot menerima `subscription_expiry` dan `current_variant` dari payload task.
2.  **Kalkulasi**:
    *   Gunakan library `date-fns` atau `dayjs` untuk membandingkan waktu secara akurat.
    *   Tentukan `finalStatus` (1 untuk Enable, 0 untuk Disable).
    *   Tentukan `finalVariant` (Harian).
3.  **Update API**: Memperbarui fungsi `notifyApiSuccess` untuk mengirimkan data tambahan:
    ```typescript
    {
      accountId: string;
      newPassword: string;
      status: number;  // 1 atau 0
      variant: string; // "Harian"
    }
    ```
4.  **Logging Detail**: Mencatat hasil akhir ke console dengan format:
    `[netflix] RESET SUKSES | Email: abc@email.com | Pass: abc123 | Status: ENABLE (Belum H-1) | Variant: SWITCHED (Mingguan -> Harian)`

## 4. Tugas Pengembangan (To-Do List)

*   [ ] Update interface `ResetPasswordPayload` di Bot untuk mendukung field baru.
*   [ ] Implementasi fungsi `calculateAccountState()` untuk logika tanggal & jam 15:00.
*   [ ] Modifikasi `updateNetflixAccountStatus` (API Client di Bot) agar mengirim status & variant.
*   [ ] Update Controller/Service di `apps/api` (Backend) agar bisa memproses data status & variant yang dikirim Bot.
*   [ ] Uji coba log output agar sesuai dengan keinginan USER.
