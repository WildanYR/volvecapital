# Daftar Chart of Accounts (COA) - Bisnis Penjualan Aplikasi Premium

Berikut adalah rekomendasi rancangan nomor akun (COA) 4 digit yang dirancang khusus untuk mengakomodasi alur bisnis digital Anda (penjualan aplikasi, akun premium, voucher, dengan integrasi platform seperti Shopee dan Website).

## 1XXX - ASET (HARTA)
### 11XX - Aset Lancar
- **1100** : Kas Kecil (Uang Tunai)
- **1101** : Kas Bank BCA
- **1102** : Kas Bank Mandiri / Bank Lainnya
- **1110** : Saldo Shopee (Dana penjualan tertahan di platform Shopee)
- **1111** : Saldo Payment Gateway (Xendit, Midtrans, dll)
- **1112** : E-Wallet (Gopay, OVO, Dana)
- **1120** : Piutang Usaha
- **1130** : Persediaan Akun Premium (Nilai stok akun yang belum terjual)
- **1131** : Persediaan Voucher (Nilai stok voucher yang belum diklaim)
- **1140** : Biaya Sewa Dibayar di Muka (Hosting/Server tahunan)

### 12XX - Aset Tetap
- **1200** : Peralatan Komputer & HP (Aset Operasional)
- **1201** : Akumulasi Penyusutan Peralatan

---

## 2XXX - LIABILITAS (KEWAJIBAN / HUTANG)
### 21XX - Kewajiban Jangka Pendek
- **2100** : Hutang Usaha (Tagihan ke supplier / vendor penyedia akun)
- **2110** : Pendapatan Diterima Di Muka (Pembeli sudah bayar, tapi garansi / masa aktif langganan belum habis sepenuhnya)
- **2120** : Hutang Refund / Pengembalian Dana
- **2130** : Hutang Pajak

---

## 3XXX - EKUITAS (MODAL)
- **3100** : Modal Disetor (Modal Pemilik)
- **3110** : Prive Pemilik (Penarikan uang usaha untuk keperluan pribadi)
- **3120** : Laba Ditahan (Keuntungan yang tidak ditarik)
- **3130** : Ikhtisar Laba Rugi

---

## 4XXX - PENDAPATAN
- **4100** : Pendapatan Penjualan Akun (Netflix, Spotify, dll)
- **4110** : Pendapatan Penjualan Voucher Digital
- **4200** : Pendapatan Cashback / Promo Platform
- **4300** : Pendapatan Lain-lain

---

## 5XXX - HARGA POKOK PENJUALAN (HPP)
- **5100** : HPP Akun Premium (Modal beli ke supplier untuk akun yang terjual)
- **5110** : HPP Voucher Digital (Modal beli ke supplier untuk voucher yang ditarik)

---

## 6XXX - BEBAN OPERASIONAL
- **6100** : Beban Gaji & Tunjangan (Customer Service / Karyawan)
- **6110** : Beban Biaya Admin Platform (MDR / Admin Shopee, Gateway Fee)
- **6120** : Beban Iklan & Promosi (Meta Ads, Shopee Ads)
- **6130** : Beban Sewa Server, Domain & Hosting (AWS, VPS, Domain web)
- **6140** : Beban Bot / API Pihak Ketiga (Biaya langganan API WA, Anti-captcha)
- **6150** : Beban Kuota Internet & Komunikasi
- **6160** : Beban Listrik
- **6170** : Beban Penyusutan Peralatan Komputer
- **6180** : Beban Kerugian Garansi / Replacement Akun Mati
- **6190** : Beban Operasional Lainnya

---

## 7XXX - PENDAPATAN & BEBAN LUAR USAHA
- **7100** : Pendapatan Bunga Bank
- **7200** : Beban Administrasi Bank (Potongan bulanan bank, biaya transfer antar bank)
- **7300** : Beban Pajak Penghasilan
