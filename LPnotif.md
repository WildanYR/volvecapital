# Konsep Implementasi Notifikasi Landing Page (Local State)

Dokumen ini merangkum rencana implementasi sistem notifikasi pada landing page yang disimpan secara lokal di browser user.

## 1. Arsitektur State Management
Kita akan menggunakan custom hook `useNotification` yang terintegrasi dengan `localStorage` untuk memastikan data tetap ada meskipun halaman di-refresh.

### Struktur Data Notifikasi
Setiap notifikasi akan memiliki struktur sebagai berikut:
```typescript
interface Notification {
  id: string;
  type: 'PURCHASE_HISTORY' | 'PENDING_PAYMENT';
  title: string;
  description: string;
  timestamp: number;
  isRead: boolean;
  data: {
    productName?: string;
    variantName?: string;
    price?: number;
    paymentUrl?: string; // Khusus untuk pending payment
    voucherDetails?: any; // Detail voucher jika sudah berhasil
    orderId?: string;
  };
}
```

## 2. Integrasi UI (Navbar & Popover)
- **Navbar Icon**: Menambahkan icon lonceng (`Bell`) di sebelah tombol "MULAI BELI" atau di area menu mobile.
- **Badge**: Menampilkan dot merah jika ada notifikasi yang belum dibaca (`isRead: false`).
- **Popover/Modal**: Saat icon diklik, akan muncul dropdown atau modal yang menampilkan daftar notifikasi dengan desain premium (glassmorphism, smooth animations).

## 3. Alur Logika (Triggers)

### A. Pending Payment (Doku Popup Close)
1. Saat user menekan "Bayar Sekarang", sistem akan membuat order dan mendapatkan `payment_url`.
2. Jika user menutup modal pembayaran (Doku Jokul) atau menutup modal checkout sebelum membayar:
   - Trigger fungsi `addNotification`.
   - Simpan sebagai tipe `PENDING_PAYMENT`.
   - Berikan aksi "Selesaikan Pembayaran" yang akan mengarahkan kembali ke `payment_url`.

### B. Riwayat Pembelian (Success History)
1. Karena kita menggunakan local state, trigger terbaik adalah saat user dialihkan ke halaman "Success" atau saat sistem mendeteksi pembayaran berhasil (callback).
2. Data pembelian (Nama produk, voucher, dll) akan ditambahkan ke array notifikasi.
3. User bisa melihat kembali detail voucher mereka kapan saja melalui icon notifikasi ini.

## 4. Pertanyaan Klarifikasi
Sebelum lanjut ke pengodingan, ada beberapa hal yang perlu saya pastikan:

1. **Deteksi Pembayaran Berhasil**: Apakah saat ini ada halaman khusus setelah pembayaran berhasil (misal: `/payment/success`)? Jika ada, saya bisa menaruh logika "Simpan ke History" di sana. Jika tidak, bagaimana cara sistem memberitahu user bahwa pembayaran sudah sukses di landing page?
2. **Pending Payment Action**: Saat user mengeklik notifikasi "Pending Payment", apakah Anda ingin itu membuka kembali modal checkout dengan data yang lama, atau langsung redirect ke URL pembayaran Doku?
3. **Pembersihan Data**: Apakah perlu ada fitur "Hapus Semua Notifikasi" atau otomatis terhapus setelah jangka waktu tertentu (misal 30 hari)?
4. **Keamanan**: Karena data voucher disimpan di `localStorage`, ini akan terlihat jika seseorang membuka DevTools. Apakah ini bisa diterima untuk kenyamanan user (tanpa login)?

---

**Rencana Langkah Selanjutnya:**
1. Membuat hook `useNotification`.
2. Memodifikasi `navbar.tsx` untuk menambahkan icon dan popover.
3. Menambahkan trigger di `checkout-modal.tsx` untuk menangkap event "Pending".
4. (Opsional) Membuat halaman/komponen success handler jika belum ada.


jawaban :
1. sudah ada halaman sukses nya kok di `app/success/page.tsx' apakah ini yang kamu maksud?
2. membuka kembali modal checkout dengan data yang lama
3. biarkan tersimpan selamanya di browser user (aman kan voucher nya ada masa expired nya juga)
4. iya aman kok karena voucher nya ada masa expired nya juga
