# Implementasi Logika Hitungan Amortisasi (Revenue & COGS)

Berdasarkan permintaan Anda, kita akan merombak cara sistem menghitung nominal untuk Pendapatan (Revenue) dan Harga Pokok Penjualan (COGS/HPP) harian. Berikut adalah penjabaran logikanya:

## 1. Perhitungan Pendapatan Harian (Revenue)
**Sebelumnya:** Menggunakan `price` dari `ProductVariant`.
**Terbaru:** Menggunakan harga aktual dari transaksi pelanggan.

**Logika:**
- Ketika proses amortisasi berjalan untuk seorang *user* (tabel `account_users`), kita akan melihat ke `transaction_item` / `transaction` yang terkait dengan pembelian mereka.
- Nominal yang diambil adalah harga aktual (misal: Rp 6.000 atau Rp 7.000) yang mereka bayarkan.
- **Pendapatan Harian = `Harga Transaksi` / `Durasi Langganan (Hari)`**.
- *Pertanyaan untuk Anda:* Jika satu transaksi keranjang belanja memiliki banyak item, lebih aman kita mengambil harga dari `transaction_item.price` (harga spesifik untuk profil tersebut) daripada `transaction.total_price` (total seluruh keranjang). Apakah Anda setuju menggunakan harga per item (`transaction_item`)?

ya aku setuju menggunakan harga per item `transaction_item`

## 2. Perhitungan HPP Harian (COGS)
**Sebelumnya:** Menggunakan `strike_price` dari `ProductVariant`.
**Terbaru:** Menggunakan modal aktual dari tabel `Account` (Akun Netflix/Spotify) dan dibagi ke masing-masing pengguna (profil) yang aktif/di-allow.

**Logika Perhitungan:**
1. **Total Pengguna Maksimal di Akun (`Total Max Users`):**
   - Kita jumlahkan nilai `max_users` dari semua profil di dalam satu Akun tersebut, tetapi **hanya** untuk profil yang `is_allow_generate = true` (atau statusnya diizinkan untuk dijual).
   - Contoh: 5 profil, masing-masing max user 2 = Total 10 Slot User.

2. **Perhitungan Modal Per Hari Per Akun:**
   - Karena modal diinput di Akun, kita bisa menggunakan rumus: `Cost (Modal Akun)` / `Total Durasi Akun`.
   - Misalnya: Modal Rp 120.000, aktif 30 hari. Maka biaya modal Akun per hari = Rp 4.000/hari.
   - Atau menggunakan sisa hari (seperti saran Anda): `Sisa Modal` / `Sisa Hari`. Keduanya secara matematis menghasilkan angka yang sama (Rp 4.000/hari) asalkan modal dan tanggal kedaluwarsa tidak diubah di tengah jalan.

3. **Perhitungan HPP Per Pelanggan (User) Harian:**
   - `HPP Per User = Biaya Modal Akun Per Hari / Total Max Users`.
   - Contoh: Rp 4.000 / 10 Slot = **Rp 400 per user/hari**.

### ⚠️ Pertanyaan Kritis Mengenai Slot Kosong (Unsold Inventory)
Mari kita bahas skenario di mana tidak semua slot profil terisi. 
Contoh: Akun punya 10 Slot. Modal harian = Rp 4.000 (Rp 400 per slot).
Hari ini, **hanya ada 5 slot yang terisi (terjual)**, 5 slot lagi masih kosong.

**Bagaimana Anda ingin sistem mencatat HPP-nya?**
- **Opsi A (HPP Dinamis):** Sistem mengambil total sisa modal akun lalu membaginya rata hanya kepada pengguna yang aktif. Jika hanya ada 5 orang, maka Rp 4.000/hari dibagi ke 5 orang = Rp 800/user. *Efeknya HPP pelanggan berubah-ubah tergantung berapa orang yang gabung di akun itu.*
- **Opsi B (HPP Mengendap / Terakumulasi):** Sistem membuat jurnal amortisasi Rp 400 untuk 5 slot yang terjual (total Rp 2.000). Sisa Rp 2.000 dari slot kosong TIDAK diamortisasi hari ini. *Efeknya sisa modal ini akan membuat nilai HPP per user melonjak di hari-hari terakhir kedaluwarsa (misal dari Rp 400 menjadi Rp 800).*
- **Opsi C (HPP Statis / Lurus):** HPP per user selalu Rp 400 per hari, dari awal sampai akun kedaluwarsa. Jika hanya 5 slot terjual, jurnal HPP yang terbuat adalah Rp 2.000/hari. Sisa Rp 2.000/hari akan dianggap sebagai penyusutan persediaan (beban hangus) dan dicatat sebagai jurnal penyesuaian terpisah nanti, BUKAN dibebankan ke pengguna yang ada.

Menurut standar akuntansi, **Opsi C** adalah yang paling tepat karena menjaga margin per pengguna tetap stabil dan jelas. Slot yang tidak terjual adalah kerugian (beban) perusahaan, bukan beban bagi pengguna yang menempati slot lainnya.

**Mohon konfirmasi Anda:**
1. Setuju mengambil dari `transaction_item` (per item) daripada `transaction.total_price`?
2. Untuk penanganan HPP slot kosong, apakah Anda memilih **Opsi C** (HPP statis Rp 400/user) atau punya pemikiran lain?


