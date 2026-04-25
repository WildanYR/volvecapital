# 📋 Rencana Implementasi Final — Sistem Voucher Streaming
## Volve Capital Landing Page + Voucher System

> **Status**: ✅ 100% Siap dikerjakan — semua keputusan sudah final
> **Terakhir diupdate**: Semua pertanyaan dijawab

---

## ✅ Keputusan Final

| Poin | Keputusan |
|------|-----------|
| Lokasi project | `apps/landingpage` di dalam monorepo ini |
| Multi-tenant | Subdomain per tenant — `papapremium.volve-capital.com` |
| Harga produk | Tambah kolom `price` di tabel `product_variant` |
| Data buyer | Nama + Email + Nomor WhatsApp |
| Notifikasi voucher | Tampil di halaman success + kirim ke WA pembeli |
| Halaman success | Bisa diakses ulang via kode voucher |
| Midtrans | Sandbox (testing) |
| Domain | Subdomain baru per tenant |
| Testimoni | Statis (hardcode) |
| Gambar produk | Tidak perlu |
| Format voucher | `VC-XXXXXXXX` (8 karakter acak huruf+angka kapital) |
| Layanan WA | **Fonnte** (API key dari fonnte.com) |
| Notifikasi stok | Tampil di dashboard saja jika stok ≤ 3 akun |
| Form harga | Ditambahkan ke admin dashboard |

---

## ❓ Masih Perlu Dijawab (2 poin)

| # | Pertanyaan | Pilihan |
|---|-----------|---------|
| 1 | **Layanan WA** — Pakai apa untuk kirim WA otomatis? | A) Fonnte/WaWebhook (nomor WA biasa) / B) Twilio / C) WA Business API resmi |
| 2 | **Notifikasi stok** — Stok berapa yang dianggap "hampir habis"? Dan notifikasi ke mana? | Threshold: __ akun / Via: WA ke admin / Dashboard saja |

---

## 🏗️ Arsitektur Sistem

```
Subdomain: papapremium.volve-capital.com
  │
  ▼
┌────────────────────────────────────────────────────┐
│           apps/landingpage (Next.js 15)             │
│   Middleware: baca subdomain → dapat tenant_id      │
│                                                     │
│  /          Landing Page                            │
│  /buy       Pilih produk & checkout                 │
│  /redeem    Input kode voucher                      │
│  /success/[code]  Tampil akun + bisa lookup ulang   │
└──────────────────────┬─────────────────────────────┘
                       │ API calls ke apps/api
                       ▼
┌────────────────────────────────────────────────────┐
│              apps/api (NestJS — existing)           │
│                                                     │
│  Module baru: PublicModule (/public/*)              │
│  ├── GET  /public/product          list produk      │
│  ├── POST /public/payment/create   buat order       │
│  ├── POST /public/payment/notify   webhook Midtrans │
│  ├── GET  /public/voucher/:code    cek voucher      │
│  └── POST /public/voucher/redeem   redeem + alokasi │
└──────────────────────┬─────────────────────────────┘
                       │
                       ▼
              PostgreSQL (existing)
              + tabel voucher (baru)
              + kolom price di product_variant (baru)
```

### Cara Kerja Multi-Tenant via Subdomain

```
Request masuk: papapremium.volve-capital.com/buy
  │
  ▼
Next.js Middleware (middleware.ts)
  ├── Baca req.headers.host → "papapremium.volve-capital.com"
  ├── Ekstrak subdomain → "papapremium"
  └── Set header x-tenant-id: "papapremium" ke semua page

API call dari landing:
  POST /public/payment/create
  Header: x-tenant-id: papapremium
  │
  ▼
NestJS guard baca header x-tenant-id
→ set tenant schema di database
```

---

## 🗃️ Perubahan Database

### 1. Tambah Kolom ke `product_variant` (Tenant Schema)

**Migration**: `022-add-price-to-product-variant.ts`

```sql
ALTER TABLE product_variant
  ADD COLUMN price INTEGER NOT NULL DEFAULT 0;
-- Harga dalam Rupiah (contoh: 50000 = Rp 50.000)
```

### 2. Tabel Baru: `voucher` (Tenant Schema)

**Migration**: `023-create-voucher-table.ts`

```sql
CREATE TABLE voucher (
  id                  VARCHAR(12) PRIMARY KEY,  -- format: VC-XXXXXXXX
  product_variant_id  BIGINT NOT NULL,
  status              VARCHAR NOT NULL DEFAULT 'UNUSED',  -- UNUSED | USED | EXPIRED
  buyer_name          VARCHAR NOT NULL,
  buyer_email         VARCHAR NOT NULL,
  buyer_whatsapp      VARCHAR NOT NULL,
  expired_at          TIMESTAMP NOT NULL,       -- kapan voucher expired jika tidak dipakai
  transaction_id      VARCHAR,                  -- FK ke transaction.id
  transaction_item_id BIGINT,                   -- FK ke transaction_item.id (diisi saat redeem)
  payment_id          VARCHAR,                  -- order_id Midtrans
  payment_status      VARCHAR DEFAULT 'PENDING', -- PENDING | PAID | FAILED | EXPIRED
  created_at          TIMESTAMP NOT NULL,
  updated_at          TIMESTAMP NOT NULL
);
```

### 3. Update Admin Dashboard
Tambah field **Harga (Rp)** di form create/edit Product Variant di `apps/dashboard`.

---

## 🔌 Endpoint API Baru (NestJS)

Module baru di `apps/api/src/modules/public/`

### `GET /public/product`
- **Auth**: Tidak perlu JWT, cukup header `x-tenant-id`
- **Response**: Semua produk aktif beserta variant dan harganya
```json
[
  {
    "id": "1",
    "name": "Netflix",
    "slug": "netflix",
    "variants": [
      {
        "id": "1",
        "name": "1 Bulan",
        "price": 50000,
        "duration": 30
      }
    ]
  }
]
```

### `POST /public/payment/create`
- **Body**: `{ product_variant_id, buyer_name, buyer_email, buyer_whatsapp }`
- **Proses**:
  1. Cek stok (ada akun `ready` untuk variant ini?)
  2. Generate kode voucher: `VC-` + 8 karakter random (A-Z0-9)
  3. Simpan voucher ke DB (status: UNUSED, payment_status: PENDING)
  4. Buat `transaction` (platform: "landing")
  5. Buat `transaction_item`
  6. Panggil Midtrans API → dapatkan `snap_token`
- **Response**: `{ snap_token, voucher_code }`

### `POST /public/payment/notify`
- **Dari**: Midtrans webhook (server-to-server)
- **Proses**:
  1. Verifikasi signature Midtrans
  2. Jika `transaction_status = settlement` (lunas):
     - Update `voucher.payment_status = PAID`
  3. Jika `transaction_status = expire/cancel`:
     - Update `voucher.payment_status = FAILED`
     - Update `voucher.status = EXPIRED`

### `POST /public/voucher/redeem`
- **Body**: `{ voucher_code }`
- **Proses** (dalam 1 database transaction):
  1. Cek voucher ada
  2. Cek `payment_status = PAID`
  3. Cek `status = UNUSED`
  4. Cek `expired_at > now()`
  5. AUTO ALOKASI:
     - Cari `account` WHERE `status='ready'` AND `product_variant_id = voucher.product_variant_id`
     - Cari `account_profile` yang `allow_generate=true` dan slot tersisa
     - INSERT `account_user` (name=buyer_name, expired_at = now + duration days)
     - UPDATE `transaction_item.account_user_id`
     - UPDATE `voucher.status = USED`
  6. Kirim WA ke `buyer_whatsapp` berisi info akun
- **Response**: redirect ke `/success/[voucher_code]`

### `GET /public/voucher/:code`
- **Fungsi**: Lookup voucher (untuk halaman success yang bisa diakses ulang)
- **Response**: Data akun yang sudah dialokasikan (dari `account_user` → `account` → `email`)

---

## 📱 Halaman Next.js

```
apps/landingpage/src/app/
├── middleware.ts               ← Baca subdomain, inject x-tenant-id
├── layout.tsx                  ← Root layout
├── globals.css                 ← Global styles
│
├── page.tsx                    ← Landing Page (/)
├── buy/
│   └── page.tsx               ← Pilih produk & isi form pembeli
├── redeem/
│   └── page.tsx               ← Input kode voucher
└── success/
    └── [code]/
        └── page.tsx           ← Tampil info akun, bisa diakses ulang
```

---

## 🎨 Design System

### Palet Warna (Dark Mode)
```
Background:   #07070F  (hampir hitam)
Surface:      #0F0F1A  (card/panel)
Border:       #1A1A2E  (garis pembatas)
Primary:      #6366F1 → #8B5CF6  (indigo ke violet, gradient)
Accent:       #22D3EE  (cyan, highlight)
Text:         #F1F5F9  (putih lembut)
Muted:        #64748B  (teks sekunder)
Success:      #10B981  (hijau emerald)
Error:        #EF4444  (merah)
```

### Font
- **Heading**: Inter (Bold/ExtraBold)
- **Body**: Inter (Regular/Medium)

### Komponen UI

| Komponen | Keterangan |
|----------|-----------|
| `HeroSection` | Headline + 2 CTA button + animasi background gradient |
| `UserSplitSection` | 2 card: punya voucher vs belum |
| `HowItWorks` | 3 langkah dengan icon + animasi scroll |
| `ProductGrid` | Grid kartu produk, diambil dari API |
| `ProductCard` | Kartu produk dengan hover effect terangkat |
| `TrustSection` | 4 keunggulan dengan icon |
| `TestimonialSection` | Kartu review statis |
| `FAQSection` | Accordion buka-tutup |
| `Footer` | Link navigasi + kontak |
| `CheckoutModal` | Form nama, email, WA sebelum bayar |
| `VoucherInput` | Input kode + tombol redeem |
| `AccountResultCard` | Tampil email, password, profile, masa aktif |

---

## 🔄 Flow Lengkap

### Flow Beli
```
Landing → klik "Beli Sekarang" di produk
  → Modal checkout (nama, email, WA)
  → POST /public/payment/create
  → Muncul Midtrans Snap popup
  → User bayar
  → Midtrans webhook → update voucher status = PAID
  → Midtrans redirect ke /success/[voucher_code]
  → Tampilkan kode voucher + instruksi redeem
```

### Flow Redeem
```
User buka /redeem
  → Input kode voucher (VC-XXXXXXXX)
  → POST /public/voucher/redeem
  → Validasi + auto-alokasi akun
  → Kirim WA ke pembeli
  → Redirect ke /success/[voucher_code]
  → Tampilkan: email, password, nama profile, masa aktif
```

### Error States
| Kondisi | Pesan |
|---------|-------|
| Voucher tidak ada | "Kode voucher tidak ditemukan" |
| Belum dibayar | "Pembayaran belum dikonfirmasi. Silahkan cek email / hubungi admin" |
| Sudah dipakai | "Voucher ini sudah pernah digunakan" |
| Expired | "Voucher sudah kadaluarsa" |
| Stok habis | "Maaf, stok sedang habis. Hubungi admin" |

---

## 🎬 Animasi (Framer Motion)

| Animasi | Trigger | Efek |
|---------|---------|------|
| Page load | Otomatis | Fade in + slide up hero |
| Background hero | Loop | Gradient bergerak perlahan (radial gradient shift) |
| Floating orbs | Loop | 3 lingkaran blur mengambang |
| Section masuk | Scroll viewport | Fade in + slide up (stagger per item) |
| Hover tombol | Mouse | Scale 1.05, shadow lebih besar |
| Hover kartu produk | Mouse | translateY -6px, shadow lebih besar |
| FAQ accordion | Klik | Height animate smooth |
| Nomor langkah | Scroll | Count-up animation |

---

## 📦 Urutan Pengerjaan

### Phase 1 — Database & Backend API
- [ ] Migration `022-add-price-to-product-variant.ts`
- [ ] Migration `023-create-voucher-table.ts`
- [ ] Model `voucher.model.ts`
- [ ] Update model `ProductVariant` (tambah `price`)
- [ ] Buat `PublicModule` di NestJS
- [ ] `GET /public/product` endpoint
- [ ] Integrasi Midtrans SDK (`midtrans-client`)
- [ ] `POST /public/payment/create` endpoint
- [ ] `POST /public/payment/notify` webhook endpoint
- [ ] `POST /public/voucher/redeem` + auto-alokasi
- [ ] `GET /public/voucher/:code` endpoint
- [ ] Integrasi kirim WA (setelah layanan WA dipilih)
- [ ] Notifikasi stok habis ke admin

### Phase 2 — Admin Dashboard Update
- [ ] Tambah field `price` di form create/edit Product Variant
- [ ] Tampil harga di tabel Product Variant

### Phase 3 — Frontend Next.js
- [ ] Setup `apps/landingpage` (Next.js 15)
- [ ] Konfigurasi TailwindCSS + Framer Motion
- [ ] `middleware.ts` untuk baca subdomain
- [ ] Halaman Landing (`/`)
- [ ] Halaman Beli (`/buy`)
- [ ] Halaman Redeem (`/redeem`)
- [ ] Halaman Success (`/success/[code]`)
- [ ] Integrasi Midtrans Snap.js

### Phase 4 — Polish
- [ ] Semua animasi Framer Motion
- [ ] Error handling + loading states
- [ ] Mobile responsive
- [ ] Testing sandbox Midtrans end-to-end

---

## 🔧 Environment Variables

### `apps/api/.env` (tambahan baru)
```env
# Midtrans
MIDTRANS_SERVER_KEY=SB-Mid-server-xxxxxxxx
MIDTRANS_CLIENT_KEY=SB-Mid-client-xxxxxxxx
MIDTRANS_IS_PRODUCTION=false

# Voucher config
VOUCHER_EXPIRY_HOURS=24     # voucher kadaluarsa dalam 24 jam jika tidak dipakai

# Fonnte WA API (daftar di fonnte.com)
FONNTE_TOKEN=xxxx            # API token dari dashboard Fonnte

# Stock notification (tampil di dashboard)
STOCK_LOW_THRESHOLD=3       # warning jika stok <= 3 akun per varian
```

### `apps/landingpage/.env.local`
```env
NEXT_PUBLIC_API_URL=http://localhost:4000
NEXT_PUBLIC_MIDTRANS_CLIENT_KEY=SB-Mid-client-xxxxxxxx
```
