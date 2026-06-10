# Rencana Migrasi Konfigurasi Bot ke Dashboard (Database)

## Pendahuluan
Saat ini, semua konfigurasi modul bot (Shopee, Netflix, Duoke) disimpan di file lokal `config.toml`. Hal ini menyulitkan sinkronisasi jika bot dijalankan berpindah-pindah komputer. Rencana ini bertujuan untuk memindahkan pengaturan modul ke dalam *Database* masing-masing *tenant*, sehingga manajemen modul murni dilakukan melalui Dashboard UI.

## Arsitektur yang Diusulkan

### 1. Pembagian Konfigurasi
Kita akan membagi konfigurasi menjadi dua bagian:
**A. Konfigurasi Lokal Minimal (`config.toml` atau `.env`)**
Hanya menyimpan data untuk mengidentifikasi siapa pemilik bot dan ke mana ia harus terkoneksi.
```toml
[app]
name = "My Bot Instance"
api_base_url = "https://api.digitalpremium.id"
headless = false
max_concurrent_tasks = 3

[api]
email = "email_owner@domain.com"
password = "password_owner"
```

**B. Konfigurasi Modul (Di Database & Dashboard)**
Semua *array* `[[modules]]` yang berisi Shopee, Netflix, Duoke beserta kredensial dan *template* pesan akan disimpan di *database* server API.

### 2. Desain Database Backend (API)
Membuat tabel baru bernama `bot_modules` di dalam skema masing-masing *tenant*:
- `id`: UUID (Primary Key)
- `module_type`: Enum (`shopee-order`, `netflix`, `duoke`)
- `name`: String (Nama modul/toko, misal: 'paytronik')
- `is_active`: Boolean (Bisa dihidup-matikan dari dashboard)
- `config`: JSONB (Menyimpan atribut dinamis seperti `loginKey`, `password`, `message_before`, `message_after`, dll)

### 3. API Endpoints Baru
- `GET /bot-modules`: Mengambil daftar modul (untuk Dashboard & Bot).
- `POST /bot-modules`: Menambah konfigurasi modul baru.
- `PATCH /bot-modules/:id`: Mengedit konfigurasi modul yang ada.
- `DELETE /bot-modules/:id`: Menghapus modul.

### 4. Perubahan di Aplikasi Bot (`apps/bot2`)
- Modifikasi `ConfigLoader.ts`: Setelah bot berhasil *login* ke API, bot akan otomatis melakukan permintaan (*fetch*) ke endpoint `GET /bot-modules` milik API.
- Hasil dari *fetch* ini akan digabungkan ke dalam memori bot, sehingga sistem bot tetap berjalan sama persis seperti membaca file `config.toml` lengkap.

### 5. UI Dashboard (React)
- Menambahkan menu **Konfigurasi Bot** di halaman pengaturan/manajemen.
- Membuat *Form Dinamis*:
  - Jika membuat modul `shopee-order`, form akan menampilkan input: *Email/Username Toko*, *Password Toko*, *Pesan Sebelum*, *Pesan Sesudah*, *Pesan Fallback*.
  - Jika membuat modul `duoke`, form akan menampilkan input: *Pesan Balasan Auto*.
  - Jika membuat modul `netflix`, form akan menampilkan input sederhana.

---

> [!IMPORTANT]
> **Hal yang Perlu Disetujui (User Review Required)**
> Mohon baca **Pertanyaan Klarifikasi** di bawah ini dan berikan jawaban/tanggapan Anda sebelum saya mulai membuat kode.

## Pertanyaan Klarifikasi
1. **Keamanan Kredensial:** Di `config.toml` saat ini, *password* toko Shopee (`password = "Jogokariyan78"`) ditulis dalam teks biasa (*plaintext*). Apakah di database nanti ini boleh disimpan secara teks biasa (karena database ini sudah terisolasi di skema milik Anda sendiri), atau Anda ingin saya mengenkripsi *password* tersebut di database?
2. **Kapan Update Berlaku:** Nantinya, jika Anda mengubah kalimat pesan Shopee atau menambah modul di Dashboard, apakah Anda setuju jika efeknya baru terasa di Bot saat Bot di-*restart*? (Cara ini paling stabil dan ringan). Atau Anda ingin Bot bisa mengenali perubahan secara *realtime* tanpa perlu di-*restart*?
3. **Pengelompokan Form UI:** Apakah Anda ingin menu form di Dashboard dipisah per jenis modul (Tab Shopee, Tab Netflix, Tab Duoke), atau disatukan saja ke dalam satu daftar "Semua Modul"?

Silakan jawab 3 pertanyaan di atas, lalu saya akan langsung mengeksekusinya untuk Anda!
