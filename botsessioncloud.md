# Rencana Implementasi: Sinkronisasi Sesi Cloud (Google Drive)

Untuk memungkinkan bot berjalan bergantian di PC kamu dan PC temanmu tanpa harus memindahkan *login/cookie* secara manual, kita perlu menyinkronkan dua komponen vital milik bot:
1. **`session_data/*.json`** (Menyimpan status *login* browser / Cookies).
2. **`storage/database.sqlite`** (Menyimpan memori bot seperti daftar orang yang sudah dibalas hari ini, dll).

Ada dua cara untuk mencapainya. Berdasarkan analisaku terhadap kodemu, **Opsi 1** adalah opsi yang paling aman, paling mudah, dan paling masuk akal untuk bot ini.

---

### Opsi 1: Relokasi Path ke Google Drive Desktop (Sangat Disarankan ⭐)
Daripada memaksa bot melakukan *upload/download* secara manual menggunakan API Google (yang rumit, sering gagal jika internet putus, dan berisiko merusak database SQLite), kita bisa mengalihkan folder kerja bot langsung ke direktori sinkronisasi aplikasi resmi **Google Drive for Desktop**.

**Alur Kerja:**
1. Kamu dan temanmu mengunduh aplikasi resmi Google Drive di Windows dan masuk dengan akun Google yang sama (atau menggunakan folder *Shared Drive*).
2. Aplikasi ini akan membuat partisi *virtual* (biasanya di `G:\My Drive`).
3. Kita ubah kode bot agar tidak lagi menyimpan `session_data` dan `storage` di dalam folder proyek lokal, melainkan membaca dan menuliskannya langsung ke folder Google Drive tersebut (misalnya `G:\My Drive\VolveBotData`).
4. Google Drive akan otomatis menyinkronkannya di latar belakang setiap kali ada perubahan file JSON atau Database!

**Perubahan Kode yang Dibutuhkan:**
- Tambahkan variabel baru di `config.toml` pada blok `[app]`:
  ```toml
  [app]
  cloud_data_dir = "G:\\My Drive\\VolveBotData"
  ```
- Modifikasi `getProjectRoot()` atau logika di `browser.ts` dan `main.ts` (bagian inisialisasi SQLite database) untuk mendahulukan *path* `cloud_data_dir` jika disetel di *config*.

---

### Opsi 2: Integrasi Langsung Menggunakan Google Drive API (Tidak Disarankan)
Bot akan mengunggah dan mengunduh file `.json` dan `.sqlite` langsung melalui koneksi API Google setiap kali bot dinyalakan atau dimatikan.

**Kekurangan:**
1. Kamu harus mengurus Google Cloud Console, membuat *Service Account Key*, mengatur izin OAuth, dll yang sangat teknikal.
2. Membaca database SQLite `.sqlite` langsung dari *stream* API sangat rawan *corrupt* (rusak) jika sinkronisasinya gagal di tengah jalan.
3. Lambat. Bot harus mengunduh file setiap kali dinyalakan, dan mengunggahnya setiap kali mati.

---

> [!IMPORTANT]
> ## Pertanyaan Untukmu
> Saya sangat merekomendasikan kita menggunakan **Opsi 1**. Kamu hanya perlu meng-install Google Drive di PC-mu dan PC temanmu, lalu kita atur `config.toml`-nya untuk menembak folder tersebut. 
> 
> 1. Apakah kamu setuju untuk menggunakan **Opsi 1 (Relokasi Path Google Drive Desktop)**?
> 2. Di sistem Windows, biasanya *drive* Google Drive ditandai dengan *letter* apa? (Misalnya `G:` atau `D:`?). Kita butuh ini sebagai patokan penulisan format *path* di konfigurasi.

Jika setuju, silakan *Approve* (Setujui) rencana ini dengan memberitahu saya jawaban dari pertanyaannya, dan saya akan langsung memodifikasi kode jalur direktorinya!
