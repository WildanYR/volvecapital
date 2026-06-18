# Rancangan Sistem Lembur (Overtime System) WFH

Karena sistem kamu menggunakan model WFH (Work From Home) dengan shift tetap, fitur lembur harus didesain agar jelas, terekam, dan dapat divalidasi oleh Admin.

Berikut adalah rancangan implementasi sistem lembur yang bisa diterapkan di Volve Capital:

## 1. Alur Kerja (Workflow) Lembur

Ada dua jenis alur yang umum dipakai:

### A. Lembur Terencana (Pre-Approved Overtime) - **Direkomendasikan**
1. Karyawan tahu hari ini akan lembur (misalnya ada tumpukan tiket CS).
2. Karyawan menekan tombol **"Ajukan Lembur"** di dashboard sebelum shift selesai.
3. Mengisi *form* durasi (misal: 2 jam) dan *reason* (alasan).
4. Admin menerima notifikasi dan melakukan **Approve/Reject**.
5. Jika di-*approve*, jam *auto-checkout* karyawan otomatis mundur sesuai tambahan jam lembur. Karyawan klik "End Shift" setelah lemburnya selesai.

### B. Lembur Dadakan (Post-Approved Overtime)
1. Shift karyawan habis di jam 15:00, tapi dia lanjut kerja sampai jam 17:00 tanpa lapor dulu.
2. Saat jam 17:00 dia klik "End Shift". Karena melewati batas shift, sistem menandai ada kelebihan waktu 2 jam.
3. Karyawan harus mengisi form **"Klaim Lembur"** untuk 2 jam tersebut beserta alasannya.
4. Admin mengecek hasil kerja selama 2 jam itu, lalu klik **Approve/Reject**.
5. Jika di-*approve*, 2 jam itu masuk ke laporan *Total Overtime Hours*.

> **Saran**: Gunakan alur **B (Post-Approved)** atau gabungan keduanya karena WFH sering kali dinamis dan kadang karyawan baru lapor setelah pekerjaannya benar-benar beres.

## 2. Penyesuaian Database (Schema)

Lebih baik membuat tabel terpisah untuk lembur daripada sekadar menambahkan kolom di tabel `attendances` agar riwayat persetujuan (approval) terekam jelas.

**Tabel `overtime_requests`**
```sql
- id (UUID/Int)
- user_id (Relasi ke dashboard_users)
- attendance_date (Tanggal lembur)
- duration_minutes (Durasi lembur dalam menit)
- reason (Alasan lembur, wajib diisi karyawan)
- status (ENUM: 'pending', 'approved', 'rejected')
- approved_by (user_id admin yang menyetujui)
- approved_at (Timestamp kapan disetujui)
- created_at
- updated_at
```

**Penyesuaian di tabel `attendances` (Opsional)**
- Tambahkan kolom `approved_overtime_minutes` (Integer, default 0). Diisi otomatis ketika admin menekan *Approve* pada *Overtime Request*.

## 3. Penyesuaian Fitur yang Sudah Ada

### A. Fitur Auto Checkout (Penting!)
Sistem auto-checkout yang baru kita buat membatasi maksimum telat *checkout* adalah 1 jam. Jika ada lembur, ini akan bentrok.
- **Solusi**: Saat cron job `processAutoCheckout` berjalan, sistem harus mengecek apakah karyawan ini punya pengajuan lembur di hari yang sama.
- Jika YA dan di-*approve*, maka perhitungan auto-checkoutnya adalah: `shift_end_time` + `duration_minutes` + 1 jam toleransi lupa.

### B. Dashboard Karyawan
- Tombol/Menu **"Klaim Lembur"** (hanya muncul jika jam kerja aktual melebihi jam shift).
- Menu **"Riwayat Lembur"** untuk melihat status pengajuan (Pending/Approved/Rejected).

### C. Dashboard Admin
- Widget **"Pending Overtime Approval"** (Notifikasi pengajuan lembur yang butuh persetujuan).
- Halaman **Manajemen Lembur** untuk meninjau, menyetujui, atau menolak klaim lembur.

### D. Laporan (Reporting)
- Tambahan kolom **"Total Jam Lembur"** pada rekap laporan absensi bulanan.

---

## 4. Langkah-Langkah Pengerjaan Jika Ingin Diimplementasikan

1. **Database Migration**: Membuat migration untuk tabel `overtime_requests` dan menambah kolom `approved_overtime_minutes` di `attendances`.
2. **API Backend**:
   - `POST /attendance/overtime/request` (Karyawan ajukan lembur)
   - `GET /attendance/overtime/me` (Riwayat lembur karyawan)
   - `GET /admin/overtime/requests` (List pengajuan untuk admin)
   - `POST /admin/overtime/approve/:id` (Admin menyetujui)
   - `POST /admin/overtime/reject/:id` (Admin menolak)
3. **Cron Job Update**: Memodifikasi `attendance-cron.service.ts` agar membaca batas jam lembur sebelum menendang *auto checkout*.
4. **UI Karyawan & Admin**: Membuat form dan tabel pengajuan lembur di frontend.

Jika rancangan ini dirasa cocok, kasih tahu saya, nanti kita bisa mulai *coding* dari bagian database dan Backend API-nya!
