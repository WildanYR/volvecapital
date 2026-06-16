# Rencana Implementasi Sistem Absensi WFH VolveCapital (UPDATED)

## 1. Analisis Kebutuhan
Berdasarkan dokumen `absen.md` dan konfirmasi terbaru, sistem absensi ini mencakup beberapa komponen utama:
- **Manajemen Shift**: Penetapan jam kerja (Shift 1 dan Shift 2) dan toleransi keterlambatan.
- **Tracking Kehadiran**: Check-in (Start Shift) dan Check-out (End Shift) dengan validasi ketat.
- **Manajemen Hari Libur (Weekly Off)**: 1 hari libur/minggu (Senin-Kamis), batasan kuota harian (`max_off_per_day` = 1) bersifat **Global** (seluruh perusahaan), dan approval Admin.
- **Pencegahan Lupa Absen (Mekanisme Ganda)**:
  1. **Frontend Auto-Redirect**: Karyawan yang login di hari kerja dan belum absen akan otomatis diarahkan ke halaman Absensi terlebih dahulu.
  2. **Backend Cron Job**: Berjalan setiap tengah malam WIB untuk menandai `missing_checkout` (jika tidak end shift) atau `absent` (jika tidak start shift di hari kerja non-libur).
- **Integrasi Role & Permission**: Penambahan permission baru dan mapping ke sistem Role & Permission yang sudah ada (`permissions`, `roles`, `role_permissions`).
- **Dashboard & Reporting**: UI untuk Karyawan (tracking pribadi) dan Admin (monitoring realtime, laporan komprehensif, export).

## 2. Rencana Arsitektur & Teknologi
- **Backend (`apps/api`)**: NestJS dengan **Sequelize (sequelize-typescript)**.
  - Modul baru: `AttendanceModule`, `ShiftModule`, `WeeklyOffModule`.
  - Cron Job menggunakan `@nestjs/schedule`.
  - Autentikasi memanfaatkan mekanisme yang sudah berjalan (Header `Authorization: VC <token>`), dimana `req.user` sudah memuat array `permissions` dan `role` untuk `DASHBOARD_USER`.
- **Frontend (`apps/dashboard`)**: Vite + React
  - *Route Middleware* baru untuk mencegat user dan redirect ke `/attendance/me` jika belum absen hari ini.
  - Halaman `Attendance`, `Shift Management`, dan `Weekly Off`.
- **Shared (`packages/shared-types`)**: Definisi interfaces dan enum (`AttendanceStatus`, DTOs) agar frontend & backend sinkron.

## 3. Tahapan Implementasi

### Fase 1: Skema Database & Seeding Permission
- Membuat migrasi Sequelize (Umzug) untuk tabel: `shifts`, `user_shifts`, `attendances`, `weekly_off_schedules`, `weekly_off_requests`, `attendance_settings`.
- Membuat file Model untuk setiap tabel (menggunakan `@Table` dari `sequelize-typescript`).
- Membuat Seeder untuk memasukkan daftar permission baru ke tabel `permissions`:
  - `attendance.view`, `attendance.start`, `attendance.end`, `attendance.manage`, `attendance.report`
  - `shift.view`, `shift.manage`
  - `weeklyoff.view`, `weeklyoff.manage`, `weeklyoff.approve`
- Mapping permission tersebut ke role (misal: Admin mendapat akses `.manage`/`.approve`/`.report`, Employee mendapat akses `.view`/`.start`/`.end`).

### Fase 2: Pengembangan API Backend (NestJS + Sequelize)
- **API Shift & Settings**: CRUD shift.
- **API Hari Libur**: Pengajuan libur, validasi kuota harian (Global), dan approval admin.
- **API Absensi**: Logic utama `Start Shift` dan `End Shift`, kalkulasi durasi kerja, status keterlambatan, dan pulang awal. Endpoint pengecekan status absensi hari ini (dipakai oleh frontend untuk redirect).
- **Cron Job**: Service scheduler yang mengeksekusi script update massal setiap jam 00:00 WIB untuk mendeteksi `missing_checkout` dan `absent`.

### Fase 3: Pengembangan UI Frontend (React)
- **Auto-Redirect Logic**: Implementasi di layout/router utama untuk mengecek status absen hari ini. Jika `not_started` dan bukan hari libur -> *Redirect to `/attendance/me`*.
- **Dashboard Karyawan**: Antarmuka untuk absensi, melihat jadwal libur, dan riwayat absensi.
- **Dashboard Admin**: Monitoring realtime, manajemen pengajuan libur, dan laporan komprehensif.

---
> [!NOTE]
> Semua pertanyaan klarifikasi sudah terjawab berdasarkan analisa project dan arahan dari Anda.
> Rencana implementasi sudah final dan selaras dengan *stack* saat ini (Sequelize, Passport-like JWT auth, @nestjs/schedule).

**Silakan berikan instruksi jika Anda ingin saya mulai mengimplementasikan kodenya! (Fase 1: Database & Models).**
