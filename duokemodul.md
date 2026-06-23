# Flow Module Duoke

File referensi: `apps/bot2/src/modules/duoke/DuokeModule.ts`

Module **Duoke** ini berfungsi sebagai auto-reply untuk pesan masuk (chat) di platform Duoke (web.duoke.com). Berikut adalah penjelasan detail mengenai alur kerjanya:

## 1. Inisialisasi (Initialization)
- Saat module dijalankan, sistem akan memuat konfigurasi seperti interval loop (`loop_interval`) dan teks balasan (`reply_lines`).
- Module berjalan menggunakan **Playwright** untuk mengontrol browser secara otomatis (RPA).
- Target URL yang digunakan adalah halaman chat utama Duoke: `https://web.duoke.com/?lang=en#/dk/main/chat`.

## 2. Proses Utama / Looping (`executeLoop`)
Proses ini berjalan terus-menerus (berulang) berdasarkan interval waktu yang ditentukan. Alurnya adalah:
1. **Buka / Navigasi Halaman**: Bot akan membuka browser (jika belum terbuka) dan masuk ke halaman web Duoke.
2. **Sistem Auto-Refresh**: Untuk mencegah halaman *freeze* (beku) atau koneksi terputus, bot memiliki penghitung (`loopCount`). Setiap **300 putaran** (kurang lebih setiap 10 menit jika berjalan tiap 2 detik), bot akan otomatis melakukan *reload* halaman.

## 3. Pengecekan Sesi & Login
- **Cek Login**: Bot mengecek apakah halaman saat ini menampilkan form login (input email). 
  - Jika **belum login**, bot akan menampilkan peringatan (`⚠️ Belum Login Duoke. Silahkan login manual di browser bot!`) dan beristirahat selama 1 menit sebelum mengecek ulang. Fitur ini mewajibkan pengguna untuk login secara manual pertama kali di browser.
- **Simpan Sesi**: Jika sudah berhasil login, bot akan otomatis menyimpan status sesi login tersebut (`duoke_session`). Sehingga jika bot di-restart, tidak perlu login manual lagi.

## 4. Proses Scan Pesan Masuk (`scanAndReply`)
Ini adalah fungsi krusial dari module ini, bot akan memindai halaman untuk mencari pelanggan yang mengirim pesan baru:
1. **Membaca Database (Riwayat Balasan)**: Bot mengambil daftar username pelanggan yang *sudah dibalas hari ini* dari database lokal SQLite (`sys_kv_store`). Ini berguna agar bot tidak spam membalas orang yang sama berkali-kali di hari yang sama.
2. **Pindah ke Tab Unanswered**: Sebelum memindai, bot akan otomatis mengeklik tab/ikon "Unanswered" (`i.icon_unanswered`) agar daftar chat yang tampil difilter khusus yang belum terbalas saja, membuat proses scan lebih cepat dan efisien.
3. **Mencari Pesan Belum Terbaca (Unread)**: Bot memindai elemen-elemen HTML di daftar chat pelanggan yang sudah difilter untuk mencari:
   - Pelanggan yang memiliki tanda/badge notifikasi merah (*unread message*).
   - Nama dari pelanggan tersebut.
4. Bot kemudian mengumpulkan daftar username pelanggan tersebut yang unik agar tidak diproses ganda (dobel).

## 5. Eksekusi Balasan Otomatis
Untuk setiap pelanggan yang memiliki pesan belum terbaca:
1. **Validasi**: Bot mengecek kembali, apakah pelanggan ini ada di daftar riwayat hari ini? Jika sudah pernah dibalas hari ini, bot akan melewatkannya (skip) dan lanjut ke pelanggan berikutnya.
2. **Buka Chat**: Bot melakukan klik pada nama pelanggan untuk membuka jendela percakapan (chat).
3. **Cek Status Pesanan**: Bot akan mengecek panel/tab "Order" di sebelah kanan. 
   - Jika ada status **"Ready to Ship"**, bot akan menggunakan teks balasan khusus (diambil dari `reply_ready_to_ship` di konfigurasi). 
   - Jika ada status **"Unpaid"**, bot akan menggunakan teks balasan khusus (diambil dari `reply_unpaid` di konfigurasi).
   - Jika tidak ada status khusus tersebut, bot akan menggunakan teks balasan reguler (`reply_lines`).
4. **Ketik & Kirim**: 
   - Bot menunggu hingga area ketik teks (*textarea*) muncul (maksimal menunggu 8 detik).
   - Jika teks balasan mengandung pemisah `||` (contoh: `"Pesan A || Pesan B"`), bot akan membaginya dan mengirimkannya sebagai beberapa baris pesan terpisah.
   - Bot mengetik pesan, lalu otomatis menekan `Enter` untuk mengirim, dengan jeda ketik 0.5 detik antar pesan.
5. **Simpan Riwayat**: Setelah berhasil terkirim, nama pelanggan tersebut langsung dicatat ke dalam database SQLite (`saveRepliedUser`). Nama tersebut di-tag dengan tanggal hari ini agar bot tidak mengulangi balasan ke orang yang sama hari ini.

## 6. Penanganan Error (Error Handling)
Semua fungsi dibungkus dalam mekanisme pencegahan error (`try-catch`). Jika ada satu pelanggan yang error saat mau dibalas, bot hanya akan mencatat pesan error tersebut dan tetap melangkah memproses pelanggan selanjutnya tanpa membuat keseluruhan bot menjadi *crash* atau mati.
