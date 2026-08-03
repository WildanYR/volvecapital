# Alur "Cara Login Netflix"

## Trigger
Terdapat tombol **"saya belum paham caranya login"** pada halaman utama penukaran voucher. 
Ketika diklik, akan muncul UI dengan pertanyaan:
**"mau login ke device apa?"**
Dan terdapat 3 pilihan:
1. Mobile
2. PC/LAPTOP
3. SMART TV

---

## 1. Flow Mobile

### Step 1
- **Instruksi UI**: "1. silahkan copy email dibawah ini lalu paste ke halaman login netflix"
- **Data yang ditampilkan**: `{email akun}`
- **Aksi/Tombol**: **"oke min sudah saya lakukan"**
- **Trigger**: Jika tombol ini diklik, UI akan transisi ke Step 2.

### Step 2
- **Instruksi UI**: "2. setelah itu kalian klik tombol lanjutkan, maka akan muncul 4 kotak untuk memasukan kode"
- Terdapat 2 opsi tombol di bawah instruksi ini:

  **Aksi/Tombol A**: **"okey min berapa kode nya?"**
  - **Trigger**: Redirect / memunculkan tampilan portal OTP.
  - **Tampilan UI**: Menampilkan list OTP yang baru masuk dengan instruksi tambahan *"silahkan masukin OTP dibawah ini"*.

  **Aksi/Tombol B**: **"Terjadi kesalahan min"**
  - **Trigger**: Redirect / memunculkan halaman/bagian untuk login via link.
  - **Tampilan UI**: 
    - Menampilkan komponen link: `{ label: 'Mobile Link', icon: Smartphone, url: netflixTokenData.mobileLink }`
    - **Instruksi Tambahan**: *"silahkan Copy dan paste link diatas ke URL browser web kalian (chrome atau safari) lalu klik open in app lalu klik continue otomatis login ke netflix"*

---

## 2. Flow PC/LAPTOP

- **Instruksi UI**: *"silahkan copy dan paste link dibawah ini di URL browser laptop kalian (pakai chrome aja)"*
- **Data yang ditampilkan**: `{ label: 'PC Link', icon: Monitor, url: netflixTokenData.pcLink }`
- **Keterangan Tambahan**: *"otomatis sudah login"*

---

## 3. Flow SMART TV

- **Instruksi UI**: *"silahkan buka link dibawah ini"*
- **Data yang ditampilkan**: `{ label: 'TV Link', icon: Tv, url: netflixTokenData.tvLink }`
- **Keterangan Tambahan**: *"lalu masukin 8 digit kode TV anda lalu klik lanjutkan, maka akan otomatis login di TV kalian"*

---

## ❓ Pertanyaan & Klarifikasi (Open Questions)

Untuk memastikan implementasi UI/UX berjalan dengan baik sesuai ekspektasi, ada beberapa hal yang ingin saya pastikan:

1. **Bentuk Tampilan (UI/UX)**: Apakah alur pemilihan device dan instruksi ini akan ditampilkan dalam bentuk **Modal/Popup**, **Drawer (dari bawah/samping)**, atau ter-**expand** langsung (seperti Accordion) di halaman yang sama?
2. **Peletakan Tombol**: Di bagian mana tepatnya tombol awal *"saya belum paham caranya login"* ingin diletakkan? (Misalnya: di atas form email/password, atau di dalam kotak "Tombol Akses Login Instan"?)
3. **Maksud dari "Redirect" di Mobile Step 2**: Saat user menekan *"okey min berapa kode nya?"* (ke portal OTP) atau *"Terjadi kesalahan min"* (ke halaman link), apakah ini artinya **berpindah halaman URL (ganti page)**, atau sekadar **scroll down / menampilkan seksi UI baru** di halaman yang sama? (Mengingat di screenshot desain ada bagian *"Email OTP Inbox"* di bawah).
4. **Link Data**: Apakah variabel `netflixTokenData` sudah *ready* dan bisa langsung diakses (di-*pass* via props/state) pada halaman / komponen ini?


jawaban :
1. untuk tampilan UI akan seperti accordion/dropdown, jadi ketika di klik akan muncul instruksi dan linknya
2. untuk peletakan tombolnya bisa ditaruh setelah halaman "berhasil!" muncul, atau bisa ditaruh di bagian bawah "Tombol Akses Login Instan"
3. untuk redirect tetap stay di halaman yang sama, tapi akan scroll ke bagian accordion yang sesuai
4. ambil aja sesuai dengan yang link Akses Login Instan ya biar sama dan gausah ganti page lain