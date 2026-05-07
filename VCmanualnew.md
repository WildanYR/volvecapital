# Implementasi Template Salin Voucher (Configurable)

Rencana implementasi fitur template salin otomatis pada Voucher Generator agar mempermudah pengiriman instruksi ke pembeli.

## 📋 Fitur Utama
1. [x] **Konfigurasi Template**: Field di Dashboard untuk mengatur teks template.
2. [x] **Dynamic Placeholders**:
   - `$$product`: Nama Produk & Varian.
   - `$$voucher`: Kode Voucher.
   - `$$batasklaim`: Tanggal Kadaluarsa (Format Indonesia).
   - `$$linkredeem`: Link landing page redeem dengan auto-fill kode.
3. [x] **Tombol Salin Cepat**: Menambahkan opsi salin lengkap di modal detail voucher dan setelah generate.

---

## 🛠️ Rencana Teknis

### 1. Database & API (Tenant Setting)
- Menggunakan table `tenant_setting` untuk menyimpan key `VOUCHER_COPY_TEMPLATE`.
- Jika belum ada, sistem akan menggunakan *default template* yang disesuaikan dengan contoh dari user.

### 2. Dashboard - Halaman Pengaturan
Menambahkan section baru di `/dashboard/setting` untuk mengedit template ini.
```markdown
Contoh Default Template:
Terima kasih telah melakukan pembelian di Digital Premium. Berikut adalah detail voucher Anda:

Produk : $$product
Kode Voucher : $$voucher
Batas Klaim : $$batasklaim
Link redeem : $$linkredeem

Cara Redeem Voucher:
1. Klik tombol "Redeem Voucher" di bawah ini.
...dst
```

### 3. Dashboard - Voucher Generator
- Mengupdate logic `handleCopy` di `apps/dashboard/src/routes/dashboard/voucher-generator/index.tsx`.
- Mengambil data setting template dari API.
- Melakukan string replacement sebelum disalin ke clipboard.

---

## ❓ Pertanyaan & Klarifikasi

Sebelum saya mulai mengimplementasikan kodenya, mohon konfirmasi beberapa hal berikut:

1. **Per Produk atau Global?**
   Apakah template ini ingin diterapkan secara global (sama untuk semua produk), atau Anda ingin template yang berbeda-beda untuk setiap varian produk? (Saran: Global dulu untuk tahap awal).

2. **Format Link Redeem?**
   Untuk `$$linkredeem`, saya akan membuatnya otomatis menjadi `https://digitalpremium.id/redeem?code=VC-XXXX`. Apakah link ini sudah benar atau ada link lain?

3. **Tombol Salin Baru?**
   Apakah Anda ingin tombol "Salin" yang sekarang ada tetap hanya menyalin **Kodenya Saja**, lalu kita tambah tombol baru bernama **"Salin Lengkap"**? Atau Anda ingin tombol "Salin" yang sekarang langsung menyalin **Seluruh Template**?

4. **Lokasi Setting?**
   Di mana lokasi terbaik menurut Anda untuk menaruh input konfigurasi template ini? 
   - A. Di halaman **Pengaturan Aplikasi** (bersama setting WA).
   - B. Langsung di halaman **Voucher Generator** (di bawah statistik) agar mudah diubah-ubah sambil generate.

Mohon arahannya agar implementasi sesuai dengan kenyamanan penggunaan Anda.
