# Implementasi Konversi Cookie Netflix ke Link Login

Dokumen ini menjelaskan alur logika (implementasi) untuk mengubah raw string cookies Netflix menjadi link sesi login otomatis (Netflix Token Links).

## Alur Logika (Step-by-Step)

1. **Parsing Input Cookies**
   Terima input string dari user yang berisi raw cookies. Pisahkan berdasarkan tanda titik koma (`;`) untuk mendapatkan masing-masing key-value dari cookie.

2. **Ekstrak `NetflixId`**
   Cari cookie yang memiliki key `NetflixId`. Abaikan cookie lainnya karena token sesi login utama tersimpan di dalam `NetflixId`.

3. **URL Decode Nilai `NetflixId`**
   Nilai dari `NetflixId` biasanya berupa string yang di-encode menggunakan format URL (contohnya `%3D` untuk `=`, `%26` untuk `&`). Lakukan proses URL decoding pada string tersebut.
   - *Contoh sebelum decode*: `v%3D3%26ct%3DBgjHlOvc...%26dt%3D...`
   - *Contoh sesudah decode*: `v=3&ct=BgjHlOvc...&dt=...`

4. **Ekstrak Parameter `ct` (Cipher Text)**
   Setelah di-decode, nilai tersebut memiliki format seperti URL query string (`key1=value1&key2=value2`). Ambil nilai dari parameter `ct`. Nilai `ct` ini adalah token enkripsi yang memuat sesi login.

5. **Transformasi URL-Safe Base64 ke Standard Base64**
   Nilai `ct` yang diekstrak menggunakan format URL-safe Base64, di mana karakter `+` diganti dengan `-`, dan `/` diganti dengan `_`.
   Untuk menjadikannya token yang valid pada URL login Netflix (`nftoken`), kita harus mengembalikannya ke format Standard Base64:
   - Ganti semua karakter `-` (strip) menjadi `+` (plus).
   - Ganti semua karakter `_` (underscore) menjadi `/` (garis miring).
   - *(Opsional/Tergantung kebutuhan parser)* Tambahkan karakter padding `=` di akhir string jika panjang string bukan kelipatan 4, meski untuk URL biasanya dapat diabaikan atau dibiarkan saja.

6. **Generate Link Login**
   Gunakan nilai `ct` yang sudah ditransformasi pada langkah ke-5 sebagai nilai variabel `{nftoken}`. Kemudian, sisipkan ke dalam template URL berikut:

   - **PC Link**
     `https://netflix.com/login?nftoken={nftoken}`

   - **Mobile Link**
     `https://www.netflix.com/unsupported?nftoken={nftoken}`

   - **TV Link**
     `https://www.netflix.com/tv9?nftoken={nftoken}`

   - **General Link**
     `https://www.netflix.com/account?nftoken={nftoken}`

## Contoh Pseudocode / Flow
```javascript
function generateNetflixLinks(rawCookies) {
    // 1. Ekstrak string cookie NetflixId
    const netflixIdMatch = rawCookies.match(/NetflixId=([^;]+)/);
    if (!netflixIdMatch) return "NetflixId tidak ditemukan!";
    
    // 2. Decode URL Encoding (ubah %3D jadi =, %26 jadi &)
    const decodedNetflixId = decodeURIComponent(netflixIdMatch[1]);
    
    // 3. Ambil parameter 'ct'
    const ctMatch = decodedNetflixId.match(/ct=([^&]+)/);
    if (!ctMatch) return "Parameter ct tidak ditemukan!";
    let ctValue = ctMatch[1];
    
    // 4. Ubah URL-Safe Base64 ke Standard Base64
    // - menjadi +
    // _ menjadi /
    let nfToken = ctValue.replace(/-/g, '+').replace(/_/g, '/');
    
    // 5. Kembalikan URL yang sudah diformat
    return {
        pcLink: `https://netflix.com/login?nftoken=${nfToken}`,
        mobileLink: `https://www.netflix.com/unsupported?nftoken=${nfToken}`,
        tvLink: `https://www.netflix.com/tv9?nftoken=${nfToken}`,
        generalLink: `https://www.netflix.com/account?nftoken=${nfToken}`
    };
}
```

## Mekanisme Integrasi dengan Google Drive

Karena cookies sudah otomatis tersimpan di Google Drive, bot bisa mengambil data tersebut secara langsung. Berikut adalah mekanisme arsitekturnya:

1. **Setup Google Drive API (Service Account)**
   Bot (misalnya dibuat dengan Node.js) perlu diberikan akses ke Google Drive tempat file cookies tersebut tersimpan. Ini dilakukan dengan membuat *Service Account* di Google Cloud Console dan membagikan folder Google Drive tersebut ke email Service Account.

2. **Mendeteksi Perubahan File Cookies**
   Ada dua cara bot bisa tahu kalau ada file cookies baru/diperbarui:
   - **Polling (Terjadwal)**: Bot mengecek folder Google Drive setiap X menit untuk mencari file yang baru di-*upload* atau di-*modified*.
   - **Google Drive Webhook (Push Notification)**: Google Drive akan mengirim HTTP *request* ke server bot setiap kali ada perubahan di folder tersebut (cara ini lebih *real-time*).

3. **Membaca Konten File**
   Setelah mendeteksi ada file cookies yang baru, bot menggunakan Google Drive API (method `drive.files.get`) untuk men-*download* isi dari file teks/JSON tersebut ke dalam memory (tanpa harus menyimpannya di hardisk server bot).

4. **Proses Konversi (Extract & Transform)**
   Isi file tersebut (yang berupa raw cookies) dimasukkan ke dalam fungsi `generateNetflixLinks(rawCookies)` yang sudah kita definisikan di atas untuk menghasilkan link sesi login PC, Mobile, dan TV.

5. **Kirim Link ke User (Output Bot)**
   Setelah link terbentuk, bot akan mengirimkan pesan balasan (bisa ke Telegram, Discord, atau WhatsApp) berisi kumpulan link login tersebut kepada kamu.

**Alur Sederhana (User Experience):**
- Sistem reset mereset Netflix dan menyimpan file `.txt` cookies ke Google Drive.
- Bot mendeteksi file `.txt` baru masuk di Google Drive.
- Bot men-download file tersebut secara *background*, mengekstrak `NetflixId`, dan melakukan *decode*.
- Bot nge-chat kamu (atau bisa di-request via command bot `/getlink akun_1`): *"Ini link login untuk akun 1: [Link PC] | [Link Mobile]..."*
