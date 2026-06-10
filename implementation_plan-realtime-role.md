# Sinkronisasi Permission Real-time (On-Refresh)

Saat ini, *permission* user Dashboard (staff) disisipkan ke dalam token JWT dan disimpan di `localStorage` hanya pada saat login. Oleh karena itu, jika admin mengubah hak akses sebuah role, user yang sedang login masih menggunakan token dan state lama sampai ia melakukan login ulang.

Agar perubahan permission bisa langsung diterapkan hanya dengan me-*refresh* halaman, kita perlu membuat mekanisme di mana aplikasi frontend mengambil ulang (*refetch*) data profile dan permission dari database setiap kali aplikasi di-muat ulang.

## Proposed Changes

### Backend (NestJS API)

#### [MODIFY] [dashboard-user.controller.ts](file:///C:/Users/leste/.gemini/antigravity-ide/brain/6858ee9a-48fc-4784-9740-c16f1693deb9/apps/api/src/modules/dashboard-user/dashboard-user.controller.ts)
- Tambahkan endpoint baru `GET /dashboard-user/me`.
- Endpoint ini akan menggunakan `req.user.id` (ID staff yang sedang login) dan `req.tenant_id` untuk mengambil data staff terbaru beserta *role* dan *permission*-nya dari database.
- Karena ini endpoint untuk diri sendiri, kita tidak akan memerlukan *permission guard* spesifik (seperti `user.view`), cukup memastikan user tersebut sudah *authenticated*.

#### [MODIFY] [dashboard-user.service.ts](file:///C:/Users/leste/.gemini/antigravity-ide/brain/6858ee9a-48fc-4784-9740-c16f1693deb9/apps/api/src/modules/dashboard-user/dashboard-user.service.ts)
- Buat method `getMe(id: string, tenantId: string)` yang akan membungkus logika pencarian user berdasarkan ID dan me-return format payload yang sama dengan `login` (menyertakan list array string *permissions*).

---

### Frontend (Dashboard React)

#### [MODIFY] [auth.provider.tsx](file:///C:/Users/leste/.gemini/antigravity-ide/brain/6858ee9a-48fc-4784-9740-c16f1693deb9/apps/dashboard/src/context-providers/auth.provider.tsx)
- Tambahkan sebuah `useEffect` di dalam `AuthProvider` yang berjalan sekali saat komponen di-mount.
- Efek ini akan mengecek apakah ada state `tenant` di `localStorage` dan apakah *role*-nya adalah `DASHBOARD_USER` (bukan owner).
- Jika ya, maka aplikasi akan melakukan *fetch* ke endpoint `/dashboard-user/me` di *background*.
- Hasil *fetch* (permissions dan profile terbaru) akan digunakan untuk memperbarui `localStorage` dan state React `tenant`.
- Jika request ke `/me` gagal (misalnya karena akun dihapus atau dinonaktifkan oleh admin), maka aplikasi akan otomatis melakukan *logout* secara paksa untuk keamanan.

## Verification Plan

1. Login sebagai sub-akun (staff) yang hanya memiliki akses ke satu halaman (misal: Produk).
2. Login sebagai *Owner* di browser berbeda dan ubah *role* staff tersebut dengan menambahkan izin baru (misal: Dashboard View).
3. Di browser staff, cukup lakukan *refresh* halaman (F5).
4. Pastikan menu Dashboard kini bisa diakses tanpa harus logout dan login ulang.

## User Review Required

Apakah rancangan pembaruan permission otomatis saat *refresh* halaman ini sesuai dengan ekspektasi Anda? Jika disetujui, saya akan mulai menulis kode untuk backend dan frontend.
