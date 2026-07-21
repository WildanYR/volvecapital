# Rencana Implementasi URL Shortener untuk Netflix Token

Karena link `nftoken` Netflix sangat panjang (ratusan karakter), kita bisa memperpendeknya menjadi bentuk yang lebih rapi seperti `https://paytronik.digitalpremium.id/l/xyz12345` menggunakan domain *landing page* yang sudah ada.

Berikut adalah alur dan cara implementasinya di dalam *repository* ini:

## 1. Modifikasi Database (PostgreSQL)
Kita perlu membuat tabel baru untuk menyimpan pemetaan antara kode unik (8 digit) dan URL panjang aslinya.

**Model Baru (`ShortUrl`):**
- `id`: String (Primary Key, ex: `a1b2c3d4`)
- `target_url`: Text (Berisi URL Netflix yang sangat panjang)
- `created_at`: Timestamp (Waktu link dibuat)
- `expires_at`: Timestamp (Waktu kadaluarsa, misalnya diset 24 jam agar database tidak membengkak).

## 2. Pembuatan API di Backend (`apps/api`)
Kita akan menambahkan 2 *endpoint* baru di `PublicController` (atau membuat modul `ShortUrlModule` khusus):

- **`POST /public/short-url`**
  - **Fungsi:** Menerima URL panjang dari *landing page*, membuat kode acak 8 digit, menyimpannya ke tabel `ShortUrl`, dan mengembalikan kode tersebut.
- **`GET /public/short-url/:code`**
  - **Fungsi:** Menerima kode 8 digit, mencari URL aslinya di database, dan mengembalikan URL asli tersebut.

## 3. Redirector di Landing Page (`apps/landingpage`)
Agar *link* pendek menggunakan domain *landing page* (misal `paytronik.digitalpremium.id/[code]`), kita bisa memanfaatkan fitur **Dynamic API Routes** dari Next.js.

Kita akan membuat file baru di: `apps/landingpage/src/app/[code]/route.ts`
```typescript
import { NextResponse } from 'next/server'
import { api } from '@/lib/api' // axios client

export async function GET(request: Request, { params }: { params: { code: string } }) {
  try {
    // Meminta URL asli ke backend API
    const response = await api.get(`/public/short-url/${params.code}`)
    const targetUrl = response.data.target_url

    // Mengalihkan pengunjung ke URL Netflix yang panjang
    return NextResponse.redirect(targetUrl)
  } catch (error) {
    return NextResponse.redirect(new URL('/?error=invalid_link', request.url))
  }
}
```
*Catatan: Kita bisa memakai awalan `/l/[code]` agar tidak bentrok dengan halaman rute Next.js lainnya (seperti `/blog` atau `/redeem`). Jadi hasilnya: `paytronik.digitalpremium.id/l/a1b2c3d4`.*

## 4. Update UI di Email Portal (`email-portal.tsx`)
Pada saat *landing page* berhasil mendapatkan `nftoken` dari bot:
1. Alih-alih langsung merender URL panjang di kotak "PC Link / Mobile Link", *landing page* akan memanggil API `POST /public/short-url` secara paralel untuk ke-3 link Netflix (PC, Mobile, TV).
2. Setelah mendapat balasan berisi kode-kode pendek, barulah *landing page* menampilkannya di layar.
3. Saat *user* mengeklik tombol **COPY**, yang ter- *copy* adalah link rapi `https://paytronik.digitalpremium.id/l/a1b2c3d4`.

---

**Apakah Anda setuju dengan alur arsitektur di atas?**
Jika setuju, beri tahu saya agar saya dapat langsung mulai mengeksekusi (membuat Model, integrasi API backend, route Next.js, hingga merubah UI) langkah demi langkah!
