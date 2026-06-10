Saya ingin menambahkan fitur Role & Permission Management pada dashboard website saya.

Konteks:
Website saya memiliki dashboard admin. Saya ingin bisa membuat role berbeda-beda, lalu menentukan role tersebut boleh mengakses menu/fitur tertentu atau tidak.

Tujuan utama:
1. Admin bisa membuat role baru.
2. Admin bisa mengatur permission/akses untuk setiap role.
3. User yang memiliki role tertentu hanya bisa mengakses fitur yang diizinkan.
4. Jika user tidak punya permission ke fitur tertentu:
   - Tombol/menu tetap boleh terlihat, tetapi disabled.
   - Warna tombol/menu menjadi abu-abu.
   - Tidak bisa diklik.
   - Opsional: tampilkan tooltip “Anda tidak memiliki akses”.
5. Backend tetap wajib memvalidasi permission, jangan hanya frontend.
6. Jika user memaksa akses lewat URL/API tanpa permission, sistem harus menolak dengan response 403 Forbidden.

Fitur yang saya inginkan:
- Halaman daftar role.
- Tombol tambah role.
- Form tambah/edit role:
  - Nama role
  - Deskripsi role
  - email (untuk login ke dashboard)
  - password (untuk login ke dashboard)
  - Daftar permission dalam bentuk checkbox
- Halaman detail role.
- Assign role ke user.  
- Middleware/guard permission di backend.
- Helper permission di frontend, misalnya can("order.create"), can("user.manage"), dll.
- Komponen reusable untuk membungkus tombol/menu agar otomatis disabled jika tidak punya akses.

Contoh permission:
- dashboard.view
- user.view
- user.create
- user.edit
- user.delete
- role.view
- role.create
- role.edit
- role.delete
- product.view
- product.create
- product.edit
- product.delete
- transaction.view
- transaction.create
- transaction.edit
- transaction.delete
- report.view
- setting.view
- setting.edit

Contoh behavior:
- Jika role “Staff CS” hanya punya akses transaction.view dan dashboard.view, maka menu lain seperti Voucher Generator, product, Setting, dan tombol edit/delete harus disabled atau berwarna abu-abu.
- Jika role “Admin” punya semua permission, semua menu dan tombol aktif.
- Jika role “Viewer” hanya punya akses melihat data, maka tombol tambah/edit/delete disabled.
 
Tolong implementasikan fitur ini dengan struktur yang rapi, scalable, dan aman.

Instruksi teknis:
1. Cek dulu struktur project saya.
2. Identifikasi stack yang digunakan, baik frontend maupun backend.
3. Jangan merusak fitur yang sudah ada.
4. Buat database migration/schema yang diperlukan.
5. Buat tabel role, permission, role_permission, dan user_role jika belum ada.
6. Jika struktur user sudah punya kolom role, sesuaikan dengan struktur terbaik.
7. Implementasikan validasi permission di backend.
8. Implementasikan pengecekan permission di frontend.
9. Buat reusable component:
   - PermissionGate
   - ProtectedButton
   - ProtectedMenuItem
10. Buat contoh penggunaan di beberapa tombol/menu dashboard.
11. Pastikan UI tetap rapi dan konsisten dengan design dashboard yang sudah ada.
12. Tambahkan seed default:
   - Super Admin: semua akses
   - Admin: akses utama
   - Staff CS: akses dashboard dan transaksi
   - Viewer: hanya melihat data
13. Buat dokumentasi singkat cara menambah permission baru.

Output yang saya mau:
- Kode lengkap sesuai struktur project.
- Migration/schema database.
- API endpoint untuk role dan permission.
- Middleware permission backend.
- Helper permission frontend.
- Contoh implementasi pada sidebar/menu dan tombol action.
- Penjelasan singkat file apa saja yang dibuat/diubah.