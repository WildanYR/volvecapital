# New Implementation: Enhancement Bot Netflix

## 1. Analisa Isu Timeout (Waiting for Event)
**Masalah:** Sering terjadi timeout saat menunggu link reset password meskipun email dari Netflix sudah terkirim / berhasil.
**Penyebab:** Ini adalah masalah *Race Condition*. Saat ini kode dijalankan secara sekuensial:
1. Klik tombol "Send Email" (`await sendButton.click()`)
2. Set up listener untuk menunggu event link (`await this.waitForTaskEvent(...)`)
Jika API sistem lain yang memproses email sangat cepat mengirim respon event kembali, sedangkan Playwright memakan waktu lebih lama untuk menyelesaikan status `click()`, maka *event link* keburu ditembakkan sebelum bot Netflix sempat membuka telinga (mendengarkan event). Event jadi hilang, dan bot menunggu selamanya hingga timeout.
**Solusi:** Kita akan mengubah urutan asinkronnya. Bot akan "membuka telinga" (set listener) *sebelum* tombol diklik.

## 2. Retry Logic untuk Error "Something went wrong"
Bot akan mengecek kemunculan teks error "something went wrong" atau "terjadi kesalahan" setelah melakukan *submit* form reset. Jika teks ini terdeteksi, bot akan mengulang proses dari awal (Buka halaman reset -> isi email -> send) maksimal 3 kali. Jika masih gagal pada percobaan ketiga, bot akan dihentikan paksa (throw error) dengan pesan minta panduan reset manual.

## 3. Auto Switch Enable/Disable Berdasarkan Tanggal Subs (Langganan)
**Logika yang diminta:**
- Jika `subsEnd` selesai hari ini & waktu lokal < 15:00  => **enable**
- Jika `subsEnd` selesai hari eni & waktu lokal >= 15:00 => **disable**

## 4. Auto Switch Varian 
**Logika yang diminta:**
Jika waktu reset tiba dan varian saat ini adalah "mingguan" atau "bulanan", maka switch otomatis ke "harian".

---

## ⚠️ PERTANYAAN KLAFIKASI (Mohon Dijawab) ⚠️

Untuk mengimplementasikan fitur 3 dan 4, saya butuh konfirmasi mengenai struktur data dari server backend Anda:

1. **Payload Data (Task):**
   Saat ini, di `ResetPasswordPayload` bot hanya menerima data: `id`, `email`, `password`, `newPassword`, dan `accountId`.
   Apakah server Anda akan mengirimkan field/tambahan properti `subsEnd` dan `currentVariant` di dalam payload task ini? (Ataukah bot harus menelepon API terlebih dahulu untuk mendapatkannya?)

2. **Nama Field Variant (API Update):** 
   Untuk auto switch varian, nilai apa yang pasti digunakan dalam sistem? Apakah murni text string `"harian"`, `"mingguan"`, `"bulanan"`, atau menggunakan bahasa inggris (`"daily"`, `"weekly"`, `"monthly"`)?
   Dan nama field-nya saat di-update ke API apakah `variant`?

3. **Nama Field Enable/Disable (API Update):**
   Bagaimana format data untuk status "enable/disable" saat bot melakukan `PATCH` ke database?
   Apakah menggunakan field `is_active` dengan value boolean (`true`/`false`), atau di-merge ke dalam field `status` dengan value (contoh: `'active'`, `'inactive'`)?

Tolong berikan detail struktur datanya agar saya bisa mengimplementasikannya tepat sesuai dengan database server Anda.
