Saya ingin menambahkan Sistem Absensi Karyawan WFH yang terintegrasi dengan Role & Permission Management yang sudah ada di website saya.

=================================================================
KONTEKS BISNIS
=================================================================

Website ini digunakan untuk operasional bisnis digital premium (Customer Service, Admin, dan Staff).

Sistem kerja menggunakan WFH (Work From Home).

Tujuan utama sistem absensi:

1. Mengetahui siapa yang sedang bekerja.
2. Mengetahui siapa yang telat.
3. Mengetahui siapa yang belum masuk kerja.
4. Mengetahui siapa yang sedang libur.
5. Mengetahui jam mulai kerja.
6. Mengetahui jam selesai kerja.
7. Menghitung total durasi kerja.
8. Membuat laporan absensi harian, mingguan, dan bulanan.
9. Membantu owner memonitor kedisiplinan karyawan WFH.

=================================================================
SHIFT KERJA
=================================================================

Shift 1
- Jam Masuk: 07:00 WIB
- Jam Pulang: 15:00 WIB

Shift 2
- Jam Masuk: 15:00 WIB
- Jam Pulang: 23:00 WIB

Timezone:
Asia/Jakarta (WIB)

=================================================================
ATURAN ABSENSI
=================================================================

Flow Absensi:

1. Karyawan login ke dashboard.
2. Sistem menampilkan shift hari ini.
3. Karyawan klik tombol "Start Shift".
4. Sistem mencatat waktu masuk.
5. Sistem menghitung keterlambatan jika ada.
6. Selama bekerja status menjadi:
   - Working

7. Saat selesai kerja:
   - Klik tombol "End Shift"

8. Sistem mencatat:
   - Waktu pulang
   - Total jam kerja
   - Status pulang lebih awal atau tidak

9. Setelah berhasil:
   - Status menjadi Completed

=================================================================
TOLERANSI KETERLAMBATAN
=================================================================

Default:
10 menit

Contoh:

Shift:
07:00 WIB

Masuk:
07:08 WIB

Status:
On Time

Masuk:
07:11 WIB

Status:
Late

Late Minutes:
11

Nilai toleransi harus bisa diubah dari halaman pengaturan admin.

=================================================================
STATUS ABSENSI
=================================================================

not_started
working
completed
late
early_leave
late_and_early_leave
missing_checkout
absent
weekly_off

=================================================================
ATURAN CHECK IN
=================================================================

Karyawan hanya boleh:

- Start Shift 1 kali per hari
- End Shift 1 kali per hari

Tidak boleh:

- Double Start
- Double End

Jika sudah Start maka tombol Start otomatis disabled.

=================================================================
ATURAN CHECK OUT
=================================================================

Karyawan hanya bisa End Shift jika:

- Sudah melakukan Start Shift

Jika belum Start:

- Tombol End disabled

=================================================================
PULANG LEBIH AWAL
=================================================================

Contoh:

Shift selesai:
15:00

Karyawan End:
14:30

Maka:

Status:
early_leave

Early Leave Minutes:
30

=================================================================
LUPA CHECK OUT
=================================================================

Jika karyawan Start Shift tetapi sampai hari berganti belum melakukan End Shift maka:

Status:
missing_checkout

Muncul notifikasi di dashboard admin.

=================================================================
SISTEM LIBUR KARYAWAN
=================================================================

Setiap karyawan mendapatkan:

- 1 hari libur setiap minggu

Karyawan bebas memilih hari libur tetapnya.

Hari yang boleh dipilih:

- Senin
- Selasa
- Rabu
- Kamis

Hari yang TIDAK BOLEH dipilih:

- Jumat
- Sabtu
- Minggu

Karena bisnis tetap ramai pada akhir pekan dan membutuhkan CS standby.

=================================================================
PENGATURAN HARI LIBUR
=================================================================

Karyawan memiliki menu:

"Jadwal Libur Saya"

Fitur:

- Melihat hari libur aktif
- Mengajukan perubahan hari libur
- Melihat status pengajuan

Contoh:

Libur setiap:
- Senin

atau

Libur setiap:
- Kamis

=================================================================
BATAS LIBUR HARIAN
=================================================================

Karena jumlah CS terbatas, saya ingin ada pengaturan:

Maximum Employee Off Per Day

Default:

1

Artinya:

Jika hari Senin sudah dipilih oleh 1 karyawan maka:

Karyawan lain tidak boleh memilih Senin.

Harus memilih hari lain.

Nilai ini harus bisa diubah oleh admin.

=================================================================
PERUBAHAN JADWAL LIBUR
=================================================================

Jika karyawan ingin mengganti hari libur:

- Membuat pengajuan
- Menunggu approval admin

Admin dapat:

- Approve
- Reject

Simpan histori perubahan.

=================================================================
INTEGRASI LIBUR DENGAN ABSENSI
=================================================================

Jika hari tersebut adalah jadwal libur karyawan:

Maka sistem otomatis:

Status:
weekly_off

Pada hari tersebut:

- Tombol Start Shift tidak muncul
- Tombol End Shift tidak muncul
- Tidak dianggap terlambat
- Tidak dianggap alpha
- Tidak masuk perhitungan absent

Dashboard karyawan menampilkan:

"Hari ini adalah jadwal libur Anda"

=================================================================
PERMISSION BARU
=================================================================

attendance.view
attendance.start
attendance.end
attendance.manage
attendance.report

shift.view
shift.manage

weeklyoff.view
weeklyoff.manage
weeklyoff.approve

=================================================================
FITUR KARYAWAN
=================================================================

Menu:
Absensi Saya

Halaman menampilkan:

1. Shift hari ini
2. Jam masuk shift
3. Jam pulang shift
4. Status hari ini
5. Waktu check-in
6. Waktu check-out
7. Tombol Start Shift
8. Tombol End Shift

Widget:

- Status Hari Ini
- Total Hadir Bulan Ini
- Total Telat Bulan Ini
- Total Jam Kerja Bulan Ini

Riwayat Absensi:

Filter:

- Hari
- Minggu
- Bulan

=================================================================
FITUR ADMIN
=================================================================

Menu:
Manajemen Absensi

Admin dapat melihat:

- Semua karyawan
- Status real-time

Dashboard Admin:

Widget:

1. Sedang Bekerja
2. Belum Absen
3. Terlambat Hari Ini
4. Libur Hari Ini
5. Missing Checkout

Contoh:

Sedang Bekerja: 2
Belum Absen: 1
Libur Hari Ini: 1
Terlambat: 0

=================================================================
LAPORAN ABSENSI
=================================================================

Filter:

- Tanggal
- Minggu
- Bulan
- Tahun
- Nama Karyawan
- Shift

Rekap:

- Total Hari Kerja
- Total Hari Libur
- Total Hadir
- Total Telat
- Total Pulang Cepat
- Total Alpha
- Total Missing Checkout
- Total Jam Kerja

Contoh:

Nama:
Anang

Periode:
Juni 2026

Hari Kerja: 26
Hari Libur: 4
Total Hadir: 26
Total Telat: 2
Total Pulang Cepat: 1
Alpha: 0
Total Jam Kerja: 208 Jam

=================================================================
EXPORT DATA
=================================================================

Admin dapat export:

- CSV
- Excel

=================================================================
DATABASE
=================================================================

Buat migration/schema yang scalable.

TABLE shifts

- id
- name
- start_time
- end_time
- timezone
- is_active
- created_at
- updated_at

TABLE user_shifts

- id
- user_id
- shift_id
- effective_date
- is_default
- created_at
- updated_at

TABLE attendances

- id
- user_id
- shift_id
- attendance_date
- start_time
- end_time
- status
- late_minutes
- early_leave_minutes
- total_work_minutes
- work_summary
- created_at
- updated_at

TABLE weekly_off_schedules

- id
- user_id
- off_day
- is_active
- approved_by
- approved_at
- created_at
- updated_at

TABLE weekly_off_requests

- id
- user_id
- current_off_day
- requested_off_day
- status
- approved_by
- approved_at
- note
- created_at
- updated_at

TABLE attendance_settings

- id
- late_tolerance_minutes
- max_off_per_day
- created_at
- updated_at

=================================================================
SEED DATA
=================================================================

Shift 1

07:00
15:00

Shift 2

15:00
23:00

Settings:

late_tolerance_minutes = 10

max_off_per_day = 1

=================================================================
API YANG DIBUTUHKAN
=================================================================

Employee:

GET /attendance/me/today
POST /attendance/start
POST /attendance/end
GET /attendance/me/history

Admin:

GET /admin/attendance
GET /admin/attendance/report

CRUD /admin/shifts

GET /admin/weekly-off
POST /admin/weekly-off/approve
POST /admin/weekly-off/reject

POST /admin/users/:id/shift

=================================================================
VALIDASI BACKEND
=================================================================

Backend wajib memvalidasi:

- Permission
- Shift aktif
- Hari libur
- Double check-in
- Double check-out
- Keterlambatan
- Pulang lebih awal

Jangan hanya mengandalkan validasi frontend.

Jika user memaksa akses API tanpa permission:

Return:

403 Forbidden

=================================================================
INSTRUKSI IMPLEMENTASI
=================================================================

1. Cek struktur project saya terlebih dahulu.
2. Identifikasi stack frontend dan backend yang digunakan.
3. Jangan merusak fitur Role & Permission yang sudah ada.
4. Integrasikan dengan sistem Role & Permission yang sudah dibuat.
5. Buat migration database.
6. Buat API.
7. Buat UI dashboard karyawan.
8. Buat UI dashboard admin.
9. Buat laporan absensi.
10. Buat dokumentasi singkat penggunaan sistem.
11. Jelaskan file apa saja yang dibuat dan diubah.
12. Gunakan best practice yang scalable karena nanti jumlah karyawan bisa bertambah.

Output yang saya inginkan:
- Kode lengkap sesuai struktur project.
- Database migration/schema.
- API endpoint.
- UI absensi karyawan.
- UI manajemen absensi admin.
- UI pengaturan hari libur.
- Integrasi Role & Permission.
- Dokumentasi implementasi.