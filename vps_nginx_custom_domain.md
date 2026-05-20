# 🌐 Panduan Setup Nginx VPS untuk Kustom Domain Multi-Tenant

Panduan ini menjelaskan langkah demi langkah untuk mengonfigurasi Nginx di VPS Anda agar dapat secara dinamis menangkap request dari kustom domain milik tenant (misalnya `rojolapak.com`) dan meneruskannya ke Next.js Landing Page (`Port 3001`).

---

## 🛠️ Konsep Arsitektur & SSL Kustom Domain

Ketika tenant menggunakan domain mereka sendiri, terdapat tantangan pada **Sertifikat SSL/TLS**. Jika pengunjung membuka `https://rojolapak.com`, Nginx di VPS harus menyajikan sertifikat SSL milik `rojolapak.com`. 

Untuk mengatasi hal ini, ada dua metode utama:

### ⚡ Metode 1: Lewat Proxy Cloudflare (Sangat Direkomendasikan & Instan)
Tenant mendaftarkan domain mereka di Cloudflare (gratis) dan mengaktifkan **Proxy Status (Awan Oranye)**.
* **Cara Kerja**: Cloudflare akan menerbitkan sertifikat SSL gratis untuk domain tenant secara otomatis di sisi edge mereka. Lalu Cloudflare meneruskan trafik secara aman ke IP VPS Anda.
* **Kelebihan**: VPS Anda tidak perlu pusing menerbitkan ribuan sertifikat SSL Let's Encrypt untuk setiap domain kustom baru. Nginx cukup menggunakan Catch-All Block default.

### 🔒 Metode 2: On-Demand TLS Let's Encrypt (Direct A-Record)
Jika tenant mengarahkan A-Record langsung ke IP VPS Anda tanpa Cloudflare, Nginx/OpenResty harus menerbitkan sertifikat SSL Let's Encrypt secara otomatis saat domain diakses pertama kali. 
*(Metode 1 jauh lebih mudah dipelihara dan aman dari limitasi rate-limit Let's Encrypt).*

---

## 📝 Langkah 1: Buat Server Block Nginx Catch-All di VPS

Masuk ke VPS Anda lewat SSH, kemudian buka file konfigurasi Nginx aplikasi Anda (biasanya di `/etc/nginx/sites-available/digitalpremium` atau `/etc/nginx/nginx.conf`).

Tambahkan server block **Catch-All** di bagian paling bawah file konfigurasi tersebut:

```nginx
# ---------------------------------------------------------
# CATCH-ALL BLOCK UNTUK KUSTOM DOMAIN TENANT (PORT 80 & 443)
# ---------------------------------------------------------

# 1. HTTP Catch-All (Port 80)
# Menangkap domain kustom apa saja yang diakses via HTTP, lalu meneruskannya ke Landing Page
server {
    listen 80 default_server;
    listen [::]:80 default_server;
    server_name _; # Menangkap seluruh domain luar

    # Meneruskan ke Next.js Landing Page (Port 3001)
    location / {
        proxy_pass http://127.0.0.1:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        
        # SANGAT PENTING: Meneruskan domain kustom asli pengunjung agar dibaca oleh Next.js & API
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}

# 2. HTTPS Catch-All (Port 443)
# Menangkap domain kustom apa saja yang diakses via HTTPS (Bekerja sempurna dengan Cloudflare SSL Proxy)
server {
    listen 443 ssl http2 default_server;
    listen [::]:443 ssl http2 default_server;
    server_name _; # Menangkap seluruh domain luar

    # Menggunakan Sertifikat Wildcard utama Anda sebagai fallback jabat tangan SSL
    # (Cloudflare dengan mode SSL "Full" akan menerima sertifikat ini dengan aman)
    ssl_certificate /etc/letsencrypt/live/digitalpremium.id-0001/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/digitalpremium.id-0001/privkey.pem;
    include /etc/letsencrypt/options-ssl-nginx.conf;
    ssl_dhparam /etc/letsencrypt/ssl-dhparams.pem;

    # Meneruskan ke Next.js Landing Page (Port 3001)
    location / {
        proxy_pass http://127.0.0.1:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        
        # SANGAT PENTING: Meneruskan domain kustom asli pengunjung agar dibaca oleh Next.js & API
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
```

> [!IMPORTANT]
> Pastikan kata kunci `default_server` hanya ada **satu kali** untuk port 80 dan **satu kali** untuk port 443 di seluruh konfigurasi Nginx Anda. Jika server block subdomain Anda saat ini menggunakan `default_server`, hapus kata kunci tersebut dari server block lama agar server block Catch-All di atas yang menjadi penangan utama.

---

## 🚀 Langkah 2: Uji & Terapkan Konfigurasi Nginx

Jalankan perintah berikut di terminal VPS Anda untuk memastikan tidak ada kesalahan sintaks:

```bash
sudo nginx -t
```

Jika outputnya menunjukkan `syntax is ok` dan `test is successful`, restart Nginx untuk menerapkan perubahan:

```bash
sudo systemctl restart nginx
```

---

## ⚡ Langkah 3: Konfigurasi DNS di Sisi Tenant (Cloudflare)

Agar kustom domain terhubung ke sistem, minta tenant Anda untuk melakukan langkah berikut di Cloudflare mereka:

1. Daftarkan domain kustom mereka di Cloudflare secara gratis.
2. Di menu **DNS** -> **Records**, tambahkan record baru:
   * **Type**: `CNAME`
   * **Name**: `@` (untuk domain utama seperti `rojolapak.com`) atau subdomain (seperti `shop` untuk `shop.rojolapak.com`).
   * **Target**: `cname.digitalpremium.id` *(pastikan Anda sudah membuat record CNAME `cname.digitalpremium.id` yang mengarah ke domain utama VPS Anda)*.
   * **Proxy Status**: **Active (Awan Oranye/Proxied)** 🟠.
3. Di menu **SSL/TLS** Cloudflare, atur mode enkripsi ke **Full** atau **Flexible**.

---

### 🎉 Selesai!
Sekarang, begitu ada pengunjung mengakses `https://rojolapak.com`, request akan diterima oleh Cloudflare, dienkripsi menggunakan SSL otomatis Cloudflare, diteruskan ke Nginx VPS Anda, dan Nginx akan mengirimkan header `Host: rojolapak.com` secara utuh ke Next.js & NestJS API untuk mengenali schema tenant secara real-time!
