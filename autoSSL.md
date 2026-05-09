# Panduan Otomatisasi SSL untuk Multi-Tenant (Subdomain)

Dokumen ini menjelaskan cara mengatur SSL agar setiap tenant/subdomain baru yang terdaftar di platform Anda otomatis mendapatkan HTTPS tanpa perlu konfigurasi manual di sisi server.

---

## 🚀 Strategi 1: Wildcard SSL via Cloudflare (Rekomendasi)

Ini adalah metode paling stabil. Anda cukup memiliki satu sertifikat untuk `*.domain.com`.

### 1. Pindahkan DNS ke Cloudflare
Rumahweb biasanya memiliki keterbatasan API untuk SSL otomatis. Maka dari itu:
- Tetap gunakan domain di Rumahweb.
- Ganti **Nameserver** di panel Rumahweb menjadi Nameserver milik Cloudflare (Gratis).

### 2. Generate Wildcard SSL dengan Certbot
Gunakan plugin Cloudflare agar Certbot bisa melakukan verifikasi via DNS secara otomatis.

**Install Certbot & Plugin:**
```bash
sudo apt update
sudo apt install certbot python3-certbot-cloudflare
```

**Buat API Token di Cloudflare:**
- Masuk ke Profil Cloudflare > API Tokens > Create Token.
- Pilih template "Edit zone DNS".

**Simpan Token di VPS:**
```bash
# Simpan di ~/.cloudflare.ini
dns_cloudflare_api_token = TOTAL_TOKEN_ANDA
```

**Jalankan Perintah SSL:**
```bash
sudo certbot certonly \
  --dns-cloudflare \
  --dns-cloudflare-credentials ~/.cloudflare.ini \
  -d digitalpremium.id \
  -d *.digitalpremium.id
```

### 3. Konfigurasi Nginx (Satu untuk Semua)
Buat file konfigurasi Nginx yang menggunakan **Regex** untuk menangkap semua subdomain.

```nginx
server {
    listen 80;
    server_name .digitalpremium.id; # Titik di depan artinya mencakup semua subdomain
    return 301 https://$host$request_uri;
}

server {
    listen 443 ssl;
    server_name ~^(?<tenant>.+)\.digitalpremium\.id$;

    # Path ke sertifikat Wildcard tadi
    ssl_certificate /etc/letsencrypt/live/digitalpremium.id/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/digitalpremium.id/privkey.pem;

    location / {
        proxy_pass http://localhost:3000; # Arahkan ke Frontend Landing Page/App
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Tenant-ID $tenant; # Mengirim nama tenant ke aplikasi
    }
}
```

---

## ⚡ Strategi 2: Caddy Server (On-Demand TLS)

Caddy adalah pengganti Nginx yang sangat modern. Ia bisa meminta SSL ke Let's Encrypt **hanya saat ada orang yang mengakses** domain tersebut.

### Keunggulan:
- Tidak perlu DNS Challenge.
- Sangat cocok jika Anda membolehkan tenant menggunakan **Custom Domain** mereka sendiri (misal: `jualan.com` diarahkan ke app Anda).

### Contoh Caddyfile:
```caddy
{
    # Keamanan: Cek ke API Anda apakah domain ini benar tenant kita?
    on_demand_tls {
        ask http://localhost:4000/public/check-tenant
    }
}

:443 {
    tls {
        on_demand
    }
    
    reverse_proxy localhost:3000
}
```

---

## ☁️ Strategi 3: Cloudflare SSL for SaaS

Jika Anda ingin 100% lepas tangan dari urusan SSL server.

1. Gunakan fitur **Custom Hostnames** di panel Cloudflare.
2. Setiap kali ada tenant baru, API Anda memanggil API Cloudflare untuk mendaftarkan domain/subdomain tersebut.
3. Cloudflare yang akan melakukan *issuance* dan perpanjangan SSL.

---

## 📝 Catatan Penting
- **Wildcard SSL** hanya berlaku untuk **1 level subdomain** (`a.domain.com`). Jika Anda butuh `a.b.domain.com`, Anda butuh sertifikat tambahan atau Caddy.
- Pastikan di aplikasi Anda (Next.js), logika pengambilan tenant sudah menggunakan header `Host` atau `X-Tenant-ID` yang dikirim Nginx.
