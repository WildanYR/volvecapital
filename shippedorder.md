# Implementasi Pengkondisian Status "Shipped"

Berdasarkan analisa dari file `shipped.md`, fitur ini akan membaca harga dan waktu pesanan saat pelanggan memiliki status "Shipped". Bot kemudian akan menentukan jenis produk yang dibeli dan menghitung selisih waktu untuk membalas dengan teks yang sesuai.

## 1. Penambahan Konfigurasi di `config.toml`
Kita perlu menambahkan 8 variabel balasan baru di `config.toml` pada bagian `[modules]` duoke:

```toml
Shipped_reply_harian = "mohon ditunggu sebentar ya kak, pesanan akan segera diproses"
Shipped_reply_habis_harian = "Mohon maaf kak durasinya sudah habis ya kak. Kakak order yang di etalase harian, ya? Mohon cek lagi deskripsinya, karena batas waktunya hanya 22-24 jam ya kak 🙏 || Silahkan CO lagi kak atau ke W aja lebih murah cuma 5k \n\nklik ==> s.id/LangganandiWea \nkalo gabisa diklik copy aja lalu paste di browser web"

Shipped_reply_mingguan = "mohon ditunggu sebentar ya kak, pesanan akan segera diproses"
Shipped_reply_habis_mingguan = "Mohon maaf kak durasinya sudah habis ya kak. Kakak order yang di etalase mingguan, ya? Mohon cek lagi deskripsinya, karena batas waktunya hanya 7 hari ya kak 🙏 || Silahkan CO lagi kak atau ke W aja lebih murah cuma 20k \n\nklik ==> s.id/LangganandiWea \nkalo gabisa diklik copy aja lalu paste di browser web"

Shipped_reply_sharing_bulanan = "mohon ditunggu sebentar ya kak, pesanan akan segera diproses"
Shipped_reply_habis_sharing_bulanan = "Mohon maaf kak durasinya sudah habis ya kak. Kakak order yang di etalase bulanan, ya? Mohon cek lagi deskripsinya, karena batas waktunya hanya 25-30 hari ya kak 🙏 || Silahkan CO lagi kak atau ke W aja lebih murah cuma 35k \n\nklik ==> s.id/LangganandiWea \nkalo gabisa diklik copy aja lalu paste di browser web"

Shipped_reply_bulanan = "mohon ditunggu sebentar ya kak, pesanan akan segera diproses"
Shipped_reply_habis_bulanan = "Mohon maaf kak durasinya sudah habis ya kak. Kakak order yang di etalase bulanan, ya? Mohon cek lagi deskripsinya, karena batas waktunya hanya 27-30 hari ya kak 🙏 || Silahkan CO lagi kak atau ke W aja lebih murah cuma 50k \n\nklik ==> s.id/LangganandiWea \nkalo gabisa diklik copy aja lalu paste di browser web"
```

## 2. Penambahan Locator di `locators.ts`
Kita akan menambahkan locator untuk membaca elemen-elemen baru:
- **Status Shipped**: `getShippedTag = (page: Page) => page.locator('#pane-order .el-tag:has-text("Shipped")')`
- **Harga Pembelian**: `getPaymentAmount = (page: Page) => page.locator('.order_item_buyer .fw_700').first()`
- **Waktu Pembayaran**: `getPaymentTime = (page: Page) => page.locator('.order_item_time').first()`

## 3. Logika Kode di `DuokeModule.ts`
Jika bot mendeteksi status "Shipped":
1. Bot membaca teks harga (misal: `8,610.00 IDR`), menghapus karakter non-angka, lalu mengubahnya menjadi nominal (`8610`).
2. Bot menentukan paket berlangganan:
   - `< 15000` = Harian
   - `15001 - 30000` = Mingguan
   - `30001 - 45000` = Sharing Bulanan
   - `> 45000` = Bulanan Private
3. Bot membaca tanggal pemesanan (misal: `2026/06/23 12:58`).
4. Bot menghitung rentang waktu antara waktu saat ini dengan waktu pemesanan.
5. Bot membandingkan waktu yang sudah berlalu dan memilih teks balasan yang tepat.

## 4. Rincian Batas Waktu & Zona Waktu (Terkonfirmasi)
- **Harian**: Batas waktu 22 Jam.
- **Mingguan**: Batas waktu 7 Hari.
- **Sharing Bulanan**: Batas waktu 25 Hari.
- **Bulanan Private**: Batas waktu 25 Hari.
- **Zona Waktu**: Pengolahan tanggal dan waktu akan selalu menggunakan standar Waktu Indonesia Barat (WIB / UTC+07:00).
- **Format Pesan**: Simbol `||` akan memecah pesan menjadi beberapa *bubble chat* (terkirim terpisah), sementara teks biasa akan tergabung dalam satu pesan. Tanda *Enter/newline* yang ditulis di konfigurasi akan diketik sebagai baris baru dalam satu *bubble chat*.

---

> [!IMPORTANT]
> ## Menunggu Persetujuan
> Rancangan kode sudah disempurnakan sesuai dengan jawabanmu. Jika rencana eksekusi ini sudah 100% pas dengan keinginanmu, silakan klik **Approve/Setuju** dan saya akan langsung menuliskannya ke dalam *source code* bot!
