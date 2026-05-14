# Implementasi Fitur Netflix Login TV (Revised Flow)

Fitur ini memungkinkan admin untuk memicu proses login Netflix TV langsung dari dashboard dengan prioritas tinggi. Bot akan menangani proses login di browser, menunggu input kode 8-digit dari admin, dan memasukkannya ke halaman Netflix TV2.

## 1. Alur Kerja (Workflow) - High Priority Flow

### Tahap 1: Inisiasi (Dashboard)
- Admin klik tombol **"Login TV"** pada kartu akun Netflix di dashboard.
- **Instan**: Dashboard langsung membuka `TvPinModal` (Status: Menunggu Bot...).
- **API**: Mengirim tugas `NETFLIX_LOGIN_TV` ke Bot via Socket.IO dengan **Priority Bypass** (execute_at di-set ke waktu lampau agar langsung diproses).

### Tahap 2: Persiapan Bot (Bot2)
- Bot menerima tugas dan langsung membuka folder session yang sesuai.
- Bot menavigasi ke `netflix.com/tv2`.
- Bot mendeteksi apakah halaman sudah masuk ke input PIN.
- **Sinyal**: Bot mengirim event `awaiting-tv-pin` ke Dashboard.

### Tahap 3: Interaksi PIN (Dashboard)
- Dashboard menerima event `awaiting-tv-pin`.
- `TvPinModal` berubah status menjadi **Ready** (Input field aktif & Tombol Kirim di-enable).
- Admin memasukkan 8 angka dan klik "Kirim".
- Dashboard mengirim PIN ke Bot melalui event `dashboard-send-tv-pin`.

### Tahap 4: Eksekusi Bot
- Bot mengetik PIN satu per satu (bukan paste) dengan delay 100-200ms antar karakter.
- Bot klik tombol **"LANJUT"** (`witcher-code-submit`).
- **Verifikasi**:
    - Jika muncul error "Kode tersebut salah", Bot kirim event `bot-tv-pin-error` ke Dashboard. Dashboard menampilkan getaran (shake) dan pesan error di modal.
    - Jika redirect ke `netflix.com/tv/out/success`, lanjut ke Tahap 5.

### Tahap 5: Fallback Login & Reset
- Jika diminta login (Email/Pass), Bot memasukkan kredensial dari payload.
- Jika password salah (muncul `reset your password` link):
    - Bot klik link reset.
    - Bot request link reset ke email.
    - Bot menunggu link dari Google App Script (Event `NETFLIX_REQ_RESET_PASSWORD`).
    - Bot login otomatis via link, lalu kembali ke `netflix.com/tv2` untuk mengulang input PIN.

### Tahap 6: Finalisasi
- Jika sudah di URL `netflix.com/tv/out/success`, Bot klik tombol **"Go to Netflix"** (`btn-witcher-navigate-home`).
- **Success UI**: Dashboard menampilkan notifikasi "Login TV Berhasil!" dan mengubah icon/status sementara pada card akun.

---

## 2. Detail Teknis Perubahan

### A. API Server (Task Queue)
- **Priority**: Modifikasi `triggerLoginTv` agar menyetel `execute_at` ke `Date.now() - 60000` (1 menit yang lalu) untuk memastikan tugas berada di urutan teratas ZSET Redis.

### B. Dashboard (Frontend)
- **Immediate Open**: Pindahkan state `setTvPinModalOpen(true)` ke dalam fungsi trigger tombol, bukan menunggu event socket.
- **Loading State**: Tambahkan loader di dalam modal selama `currentTvTask` belum terisi oleh event `awaiting-tv-pin`.
- **Success UI**: Implementasikan feedback visual "Sukses" yang persisten selama session dashboard aktif.

### C. Bot (Bot2)
- **NetflixModule**: Implementasikan `loginTv()` method.
- **Interaction**: Gunakan `page.keyboard.type()` untuk input PIN agar lebih human-like.
- **Timeout**: Tetap gunakan batas 5 menit untuk menunggu input PIN dari dashboard.

---

## 3. Locators & Selectors
- **Input PIN**: `input[data-uia^="pin-number-"]`
- **Tombol Lanjut**: `button[data-uia="witcher-code-submit"]`
- **URL Sukses**: `https://www.netflix.com/tv/out/success`
- **Tombol Final**: `button[data-uia="btn-witcher-navigate-home"]`
- **Login Fields**: `input[name="userLoginId"]`, `input[name="password"]`, `button[data-uia="sign-in-button"]`
- **Reset Link**: `a[href*="/loginhelp"]`

---

## 4. Penanganan Error
- **Bot Offline**: Jika dalam 10 detik `awaiting-tv-pin` tidak diterima, modal menampilkan pesan "Bot tidak merespon, pastikan bot sedang online".
- **PIN Expired**: Jika admin terlalu lama, bot akan membatalkan task dan modal akan tertutup otomatis dengan pesan timeout.
