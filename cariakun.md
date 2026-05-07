# Penjelasan Sistem Pencarian & Generate Akun

Sistem pencarian dan penetapan akun (account assignment) pada platform ini dirancang untuk bekerja secara otomatis saat user melakukan **Redeem Voucher**. Berikut adalah penjelasan mendalam mengenai alur dan logika pencariannya:

## 1. Arsitektur Akun & Profil
Sistem menggunakan struktur hirarki untuk memaksimalkan penggunaan satu akun:
- **Account (Akun Utama)**: Berisi data login (Email & Password) dan masa aktif langganan.
- **Account Profile (Profil/Slot)**: Di dalam satu akun utama terdapat beberapa profil (misal: Profil 1, Profil 2, dst).
- **Slot Capacity**: Setiap profil memiliki kapasitas maksimal (`max_user`).

## 2. Logika Pemilihan Akun (Kriteria Baru)
Saat user menekan tombol **"Redeem"**, sistem menjalankan logika pencarian dengan urutan prioritas sebagai berikut:

### A. Filter Kelayakan (Wajib)
Sistem hanya mencari akun yang:
- Memiliki `product_variant_id` yang sesuai.
- Status akun **bukan** `disable`.
- Masa berlaku langganan akun (`subscription_expiry`) belum habis.
- Akun sedang **tidak dibekukan** (`freeze_until` kosong).

### B. Urutan Prioritas (Sorting)
Sistem tidak mengambil akun secara acak, melainkan menggunakan urutan berikut:

1. **Prioritas Masa Aktif (Smart Expiry)**:
   Sistem mengutamakan akun yang masa langganannya akan segera habis (H-1 atau H-2). Akun diurutkan berdasarkan `subscription_expiry` secara **Ascending** (terdekat ke sekarang). Hal ini bertujuan agar slot pada akun yang hampir mati segera terisi penuh dan tidak ada sisa masa aktif yang mubazir.

2. **Sistem FIFO & Anti-Spam (Cooling System)**:
   Jika ada beberapa akun dengan masa aktif yang sama, sistem akan menggunakan prinsip **First In First Out (FIFO)** berdasarkan waktu akun tersebut di-enable/di-update.
   - Akun yang sudah lebih lama stand-by berstatus 'ready' akan didahulukan.
   - Akun yang baru saja di-reset atau baru di-enable akan diletakkan di urutan terakhir untuk memberikan waktu "istirahat" agar tidak terkena proteksi spam/login dari platform streaming.

## 3. Integrasi Landing Page, Bot, dan Dashboard
- **Landing Page**: Menjalankan logika pencarian otomatis di atas. User selalu mendapatkan akun terbaik sesuai prioritas efisiensi stok.
- **Dashboard**: Admin mengelola status akun (`ready`, `disable`, dll). Perubahan status menjadi `ready` akan memicu akun tersebut masuk ke antrian FIFO.
- **Bot**: Memastikan akun-akun yang bermasalah (password salah/expiry habis) segera di-disable agar tidak masuk dalam antrian pencarian otomatis.

## Ringkasan
Sistem mencari akun secara cerdas dengan memprioritaskan **akun yang hampir habis masa aktifnya** dan mengutamakan **akun yang sudah lama stand-by** untuk menghindari masalah spam pada akun yang baru di-reset.

---
*Terakhir diupdate: 7 Mei 2026 - Penambahan kriteria Prioritas Expiry & FIFO Anti-Spam.*
