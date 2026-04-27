# Penjelasan Placeholder Template: `$$metadata.[key]`

File ini menjelaskan mekanisme penggunaan placeholder dalam **Template Salin (Copy Template)** pada sistem Varian Produk Volve Capital, khususnya untuk placeholder dinamis `$$metadata.[key]`.

## Apa itu Copy Template?
Copy Template adalah format teks otomatis yang akan disalin oleh pengguna saat mereka melakukan aktivasi atau melihat detail akun. Tujuannya adalah mempermudah pengguna mendapatkan informasi login (email, password, dll) dalam satu kali klik.

## Daftar Placeholder Statis
Sebelum membahas metadata, berikut adalah placeholder standar yang tersedia:
- `$$email`: Menampilkan email akun.
- `$$password`: Menampilkan password akun.
- `$$product`: Menampilkan nama produk dan variannya (misal: Netflix Premium 1 Bulan).
- `$$profile`: Menampilkan nama profil yang dipilih (misal: Profil 1).
- `$$expired`: Menampilkan tanggal kadaluarsa akun (format: DD MMMM YYYY).

---

## Memahami `$$metadata.[key]`
Placeholder ini bersifat **dinamis**. Artinya, bagian `[key]` harus diganti dengan kata kunci tertentu yang ada di dalam data **Metadata** pada **Profil Akun**.

### Cara Kerjanya:
1. Saat sistem memproses template, ia akan melihat apakah ada kata kunci yang diawali dengan `$$metadata.`.
2. Sistem kemudian mencari data di dalam daftar metadata profil yang memiliki **Key** yang cocok dengan nama setelah titik.
3. Jika ditemukan, sistem akan mengganti placeholder tersebut dengan **Value** dari metadata tersebut.

### Contoh Kasus: Metadata PIN
Misalkan Anda menjual akun Netflix yang setiap profilnya memiliki PIN berbeda.

1. **Di Dashboard (Setelan Varian Produk):**
   Anda mengatur Template Salin seperti ini:
   ```text
   Akun: $$email
   Pass: $$password
   Profil: $$profile
   PIN: $$metadata.pin
   ```

2. **Di Data Akun (Profil):**
   Anda memiliki sebuah profil dengan metadata sebagai berikut:
   - **Key**: `pin`
   - **Value**: `1234`

3. **Hasil yang Diterima Pengguna:**
   Saat pengguna menyalin template tersebut, hasilnya akan menjadi:
   ```text
   Akun: user@email.com
   Pass: rahasia123
   Profil: Profil 1
   PIN: 1234
   ```

## Mengapa Menggunakan `$$metadata.[key]`?
Fitur ini sangat berguna untuk produk yang membutuhkan informasi tambahan spesifik per profil yang tidak ada di kolom standar, seperti:
- **PIN** (untuk Netflix/Disney+)
- **No Handphone** (untuk akun tertentu)
- **Instruksi Khusus** (misal: "Jangan ubah bahasa")

## Catatan Penting
- Penulisan **Key** harus persis sama (case-sensitive tergantung sistem, namun disarankan menggunakan huruf kecil semua).
- Jika Key tidak ditemukan di metadata profil, placeholder akan dikosongkan (string kosong).
- Pastikan Anda telah menambahkan metadata tersebut di bagian **Profil** saat mengelola akun.
