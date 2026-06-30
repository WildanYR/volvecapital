# Daftar COA untuk Kas & Bank (Aset)

Untuk merapikan pencatatan Kas dan Bank Anda, kita akan menggunakan kode akun awalan **111X** (untuk E-Wallet / Saldo Marketplace) dan **112X** (untuk Rekening Bank). 

Pemilihan kode ini dijamin **aman dan tidak akan bertabrakan** dengan COA produk sebelumnya (Persediaan menggunakan `113X`, Kewajiban `211X`, Pendapatan `41XX`, dan HPP `51XX`).

Semua COA di bawah ini memiliki pengaturan sebagai berikut:
- **Tipe Akun:** ASET
- **Saldo Normal:** DEBIT

---

## 1. Saldo Marketplace & E-Wallet (111X)

### Kas Shopee (1111.X)
- **1111.1** - Kas Shopee Paytronik
- **1111.2** - Kas Shopee Papapremium
- **1111.3** - Kas Shopee Digital Premium
- **1111.4** - Kas Shopee Volvepremium

### Kas OVO (1112.X)
- **1112.1** - Kas Ovo Gilang
- **1112.2** - Kas Ovo Anang

### Kas DOKU (1113.X)
- **1113.1** - Kas Doku

---

## 2. Saldo Rekening Bank (112X)

### Kas SeaBank (1121.X)
- **1121.1** - Kas Seabank Rosmiati
- **1121.2** - Kas Seabank Anang
- **1121.3** - Kas Seabank Gilang

### Kas Bank Jago (1122.X)
- **1122.1** - Kas Jago Gilang
- **1122.2** - Kas Jago Rosmiati
- **1122.3** - Kas Jago Mama
- **1122.4** - Kas Jago Alim
- **1122.5** - Kas Jago Anang

### Kas Krom Bank (1123.X)
- **1123.1** - Kas Krom Gilang
- **1123.2** - Kas Krom Anang

### Kas BNI (1124.X)
- **1124.1** - Kas BNI Gilang

---

## 3. Kewajiban / Hutang (2XXX)
*(Digunakan untuk mencatat semua jenis hutang atau kewajiban perusahaan)*

- **2121** - Hutang Gaji Karyawan

---

## 4. Modal & Ekuitas (3XXX)
*(Digunakan untuk mencatat modal disetor, penarikan dana pribadi, dan akumulasi laba)*

- **3110** - Modal Digital Premium
- **3120** - Prive Anang *(Penarikan dana pribadi oleh Anang)*
- **3121** - Prive Gilang *(Penarikan dana pribadi oleh Gilang)*
- **3200** - Laba Ditahan *(Untuk menampung keuntungan yang tidak dibagikan)*

---

## 5. Beban / Biaya Operasional (6XXX)
*(Digunakan untuk mencatat semua pengeluaran rutin operasional. Berbeda dengan HPP/5XXX yang khusus untuk modal produk).*

### Beban Karyawan
- **6110** - Beban Gaji Karyawan

### Beban Pemasaran (Iklan)
- **6210** - Biaya Iklan Shopee Paytronik
- **6211** - Biaya Iklan Shopee Digital Premium
- **6212** - Biaya Iklan Shopee Papapremium
- **6213** - Biaya Iklan Shopee Volvepremium

### Beban Utilitas & Infrastruktur IT
- **6310** - Biaya Internet
- **6320** - Biaya Server
- **6321** - Biaya Domain
- **6330** - Biaya Duoke

### Beban Administrasi & Umum
- **6410** - Biaya Admin Doku Payment Gateway
- **6510** - Beban Penyusutan Mini PC
- **6999** - Biaya Lain-lain

---
> **💡 Tip Akuntansi:** Dengan pengelompokan seperti ini (1111 untuk Shopee, 1122 untuk Jago), Laporan Neraca Anda nanti akan terlihat sangat rapi. Jika suatu saat Anda memiliki Kas Bank lain (misalnya BCA), Anda bisa melanjutkannya dengan kode **1125.1** dan seterusnya.
