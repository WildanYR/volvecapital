# Rencana Implementasi Auto Upgrade Netflix Premium

Dokumen ini merinci perubahan kode yang akan dilakukan untuk fitur Auto Upgrade.

## 1. Dashboard (UI & Trigger)
**File:** `apps/dashboard/src/routes/dashboard/accounts/index.tsx`
- **Action**: Tambahkan tombol "Upgrade" di kolom aksi.
- **Warna**: `bg-purple-600` (agar kontras dengan Reset/Reload).
- **Function**: Memanggil fungsi `handleTask('AUTO_UPGRADE', accountId)`.

## 2. API (Backend Task Dispatcher)
**File:** `apps/api/src/modules/bot/bot.gateway.ts` & `shared-types`
- **Action**: Tambahkan enum `AUTO_UPGRADE` ke dalam list task yang didukung.
- **Payload**: Mengirimkan data akun (email, pass) ke bot yang sedang aktif.

## 3. Bot (Automation Engine)
**File:** `apps/bot2/src/modules/netflix/NetflixModule.ts`

### Alur Detail Bot:
1. **Navigasi Awal**: `page.goto('https://www.netflix.com/changeplan')`.
2. **Login Check**:
   - Jika ada form email, berarti belum login.
   - Redirect ke `/loginhelp`, masukkan email, minta link.
   - Tunggu email masuk via GAS (Gmail API).
   - Klik link login -> otomatis masuk ke session.
3. **Deteksi Plan Saat Ini**:
   - `label[data-uia*="plan-selection+option+"]`
   - Map: `4120` (Mobile), `4001` (Basic), `3088` (Standard).
4. **Upgrade Execution**:
   - Klik `label[data-uia="plan-selection+option+3108"]` (Premium).
   - Klik `button[data-uia="cta-change-plan"]`.
5. **Handling Konfirmasi & OTP**:
   - Jika muncul button `action-button`, langsung klik (Tanpa Verifikasi).
   - Jika muncul `account-mfa-button-OTP_EMAIL+label`, klik lalu:
     - Masuk ke loop pengecekan email GAS (Subject: "Kode verifikasimu").
     - Ekstrak 6 digit angka.
     - Input ke `challengeOtp`.
     - Klik Submit.
6. **Final Check**:
   - Pastikan muncul pesan sukses atau kembali ke halaman akun dengan plan Premium.

## ❓ Pertanyaan Terbuka:
- **Delay Email**: Kadang email OTP Netflix butuh waktu 10-30 detik. Berapa lama bot harus menunggu sebelum dianggap *timeout*? (Saran: 60 detik).
- **Log Gagal**: Jika saldo/kartu di akun Netflix tidak cukup untuk upgrade, bot akan mendapatkan error "Payment Method Failed". Apakah status ini perlu ditampilkan spesifik di dashboard?
