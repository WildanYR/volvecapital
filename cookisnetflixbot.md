# Rencana Implementasi: Konversi Cookies ke nftoken Link via iOS FTL API

Sesuai instruksi, kita akan menggunakan pendekatan di mana **Bot mengambil raw cookies dari file sesi di `cloud_data_dir`**, lalu menggunakan cookie tersebut untuk menembak API iOS FTL Netflix (`https://ios.prod.ftl.netflix.com/iosui/user/15.48`) menggunakan request standard (misalnya `fetch`), lalu mengambil `nftoken` dari respons JSON-nya, dan mengembalikannya ke Dashboard untuk dirangkai menjadi Link Login.

---

## 1. Modifikasi Bot (apps/bot2)
Di dalam `apps/bot2/src/core/Connector.ts`:
Kita akan menambahkan fungsi/handler baru `get_netflix_token_link` yang berjalan via WebSocket:

1. **Baca Cookies:** Bot membaca file JSON sesi dari `G:\My Drive\VolveBotData\session_data\netflix_xxx.json`.
2. **Ekstrak Cookies:** Ambil nilai `NetflixId`, `SecureNetflixId`, dan `nfvdid`. Gabungkan menjadi satu string cookie yang valid (misal: `NetflixId=...; SecureNetflixId=...`).
3. **HTTP GET ke iOS FTL API:** 
   Menggunakan URL dan parameter berikut:
   - **URL:** `https://ios.prod.ftl.netflix.com/iosui/user/15.48`
   - **Search Params:**
     - `device_type`: `NFAPPL-02-`
     - `esn`: `NFAPPL-02-IPHONE8=1-PXA-02026U9VV5O8AUKEAEO8PUJETCGDD4PQRI9DEB3MDLEMD0EACM4CS78LMD334MN3MQ3NMJ8SU9O9MVGS6BJCURM1PH1MUTGDPF4S4200`
     - `path`: `["account","token","default"]`
     - `responseFormat`: `json`
   - **Headers Wajib:**
     - `User-Agent`: `Argo/15.48.1 (iPhone; iOS 15.8.5; Scale/2.00)`
     - `Cookie`: (String cookies yang diekstrak tadi)
     - `Accept`: `application/json`
4. **Ekstrak `nftoken`:** Dari respons JSON, bot akan mengambil data di path `resJson.value.account.token.default.token`.
5. **Kirim Balik ke API:** Bot merespons ke socket API backend dengan nilai `nftoken` tersebut.

---

## 2. Modifikasi Backend API (apps/api)
1. **Endpoint Baru:** Ubah endpoint lama `GET /account/:id/netflix-cookies` menjadi `GET /account/:id/netflix-token`.
2. **AccountService & SocketGateway:** Buat alur agar ketika endpoint di atas dipanggil, backend API mengirimkan instruksi `get_netflix_token_link` ke bot yang terhubung, lalu menunggu respons `nftoken`.

---

## 3. Modifikasi Dashboard Frontend (apps/dashboard)
File utama yang diubah: `apps/dashboard/src/routes/dashboard/account/$slug.tsx`

1. **Ubah UI Tombol:** Tombol di Dropdown Menu "Get Cookies" diubah teksnya menjadi "Akses Token Login".
2. **Fungsi Konversi Link:** 
   Saat admin mengeklik tombol tersebut, Frontend memanggil API `GET /account/:id/netflix-token`. Setelah `nftoken` didapatkan (misal: `Bgj8vOvcAxL...`), Frontend merangkainya menjadi 4 jenis link:
   - 💻 **PC Link:** `https://netflix.com/login?nftoken={nftoken}`
   - 📱 **Mobile Link:** `https://www.netflix.com/unsupported?nftoken={token}`
   - 📺 **TV Link:** `https://www.netflix.com/tv9?nftoken={token}`
   - 🔗 **General Link:** `https://www.netflix.com/account?nftoken={token}`
3. **Tampilkan di Dialog:** Keempat link tersebut akan ditampilkan di sebuah Dialog Modal sehingga admin dapat dengan mudah menyalin dan menggunakannya.

---

Dengan cara ini, kita tidak menggunakan otomatisasi UI Playwright sama sekali, cukup request HTTP cepat (0 delay) dari Bot menggunakan data yang sudah tersinkronisasi di cloud, namun hasilnya tetap akurat menggunakan format `nftoken`!
