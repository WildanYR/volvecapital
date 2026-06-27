# Panduan Memulai Pembukuan untuk Bisnis yang Sudah Berjalan

Memulai pembukuan (akuntansi) di tengah bisnis yang sudah berjalan memang terasa membingungkan, tapi sebenarnya sangat mudah jika kamu tahu konsep **Saldo Awal (*Opening Balance*)**. 

Karena sistem kita menggunakan *double-entry* (berpasangan), kita tidak bisa sembarang mengetik "Saldo BCA 10 juta". Kita harus tahu asal uang 10 juta itu dari mana (biasanya dianggap sebagai **Modal Awal** atau Laba Ditahan).

Berikut adalah ceklist langkah demi langkah yang harus kamu lakukan untuk memulai:

## Tahap 1: Persiapan & Rekap (Di Luar Sistem / Pakai Excel Dulu)
Jangan langsung input ke sistem. Lakukan *cut-off* (pilih satu tanggal mulai, misalnya 1 Juli 2026) dan rekap data riil di lapangan pada tanggal tersebut.

- `[ ]` **1. Tentukan Tanggal *Cut-Off***
  Sepakati tanggal mulai pembukuan. Misalnya "Mulai hari ini jam 00:00". Transaksi sebelum jam ini akan diakumulasikan sebagai Saldo Awal.
- `[ ]` **2. Opname Kas & Bank**
  Cek semua saldo rekening bank dan e-wallet yang dipakai bisnis secara *real-time*.
  *Contoh Catatan:* 
  * Seabank Anang: Rp 1.500.000
  * Kas Shopee: Rp 500.000
- `[ ]` **3. Opname Persediaan (Stok Akun Netflix dll)**
  Catat ada berapa akun yang masih *ready* (belum laku) dan berapa sisa harinya. Hitung total nilai modal (HPP) dari akun-akun tersebut.
  *Contoh Catatan:* 10 Akun Netflix Harian @ Rp 50.000 = Rp 500.000
- `[ ]` **4. Catat Utang / Piutang (Jika Ada)**
  Apakah ada pelanggan yang belum bayar? Atau kamu ngutang ke *supplier*?
- `[ ]` **5. Hitung Modal Awal (Sangat Penting!)**
  Gunakan rumus: **Total Aset (Kas + Persediaan + Piutang) dikurangi Total Utang = Modal Awal (Ekuitas).**
  *Contoh Kasus:* Total Kas (2jt) + Total Persediaan (500rb) - Utang (0) = Modal Awal Rp 2.500.000.

---

## Tahap 2: Eksekusi Input Saldo Awal ke Sistem
Setelah rekap Excel-mu *balance*, saatnya menyuntikkan angka tersebut ke dalam aplikasimu agar tercatat di Neraca.

- `[ ]` **1. Pastikan Semua Kode Akun (COA) Tersedia**
  Cek menu **Buku Besar / Daftar Akun**. Pastikan akun untuk "Modal Awal" (Equity), Kas/Bank spesifik (Seabank, Shopee), dan Persediaan (Netflix) sudah ada kodenya.
- `[ ]` **2. Buat Jurnal Manual (Jurnal Saldo Awal)**
  Buka menu **Jurnal Umum** dan buat satu jurnal khusus untuk memasukkan semua saldo tadi sekaligus. Jurnalnya akan terlihat seperti ini:
  
  | Akun (COA) | Debit (Masuk) | Kredit (Keluar/Sumber) |
  | :--- | :--- | :--- |
  | 102 - Seabank Anang | Rp 1.500.000 | |
  | 103 - Kas Shopee | Rp 500.000 | |
  | 114 - Persediaan Netflix Harian | Rp 500.000 | |
  | **301 - Modal Awal (Equity)** | | **Rp 2.500.000** |

  > [!IMPORTANT]
  > Pastikan total Debit sama persis dengan total Kredit. Inilah inti dari *Opening Balance*!
  
- `[ ]` **3. Upload Akun ke Sistem**
  Sekarang *database* keuanganmu sudah punya "stok nilai uang" di akun Persediaan. 
  Langkah selanjutnya: Upload daftar email/password Netflix tersebut lewat fitur **Bulk Upload CSV** (tanpa mempedulikan harga modal/HPP di CSV seperti yang kita bahas sebelumnya, karena modalnya sudah kita suntik secara gelondongan lewat jurnal manual tadi).
- `[ ]` **4. Tarik Neraca Saldo (Trial Balance)**
  Cek menu Trial Balance atau Buku Besar. Pastikan angka yang tampil sudah sesuai persis dengan rekap Excel yang kamu buat di Tahap 1.

Selesai! Mulai detik itu juga, aplikasimu sudah berjalan dengan saldo *real*, dan kamu tinggal menggunakan sistem seperti biasa (jualan, tambah stok, dsb).
