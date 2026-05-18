# Panduan Lengkap Implementasi Kustom Domain Multi-Tenant

Dokumen ini berisi seluruh **kode implementasi nyata (production-ready)** yang dapat Anda pasang di backend NestJS, frontend React/Next.js, database PostgreSQL, serta konfigurasi Nginx di VPS Anda.

---

## 🗄️ 1. Database & Model Data (Sequelize Master)

Langkah pertama adalah menambahkan kolom `custom_domain` ke dalam tabel `tenant` di database utama agar backend dapat memetakan domain kustom ke schema tenant yang bersangkutan.

### A. Jalankan Perintah SQL ini di Database Postgres Anda:
```sql
ALTER TABLE tenant ADD COLUMN IF NOT EXISTS custom_domain VARCHAR(255) UNIQUE;
```

### B. Perbarui Model `Tenant` di Backend
Buka file [apps/api/src/database/models/tenant.model.ts](file:///e:/latihan%20coding/1volvecapital/volvecapital/apps/api/src/database/models/tenant.model.ts) dan perbarui propertinya:

```typescript
// Tambahkan custom_domain ke dalam Interface TenantAttributes
export interface TenantAttributes {
  id: string;
  name: string | null;
  status: 'active' | 'pending' | 'suspended';
  custom_domain: string | null; // <-- Tambahkan baris ini
  created_at: Date;
  updated_at: Date;
}

// Perbarui Class Model Tenant di baris 23 ke bawah
@Table({ tableName: 'tenant' })
export class Tenant extends Model<TenantAttributes, TenantCreationAttributes> {
  @PrimaryKey
  @AllowNull(false)
  @Column(DataType.STRING)
  declare id: string;

  @AllowNull(true)
  @Column(DataType.STRING)
  declare name: string | null;

  @AllowNull(false)
  @Column({
    type: DataType.ENUM('active', 'pending', 'suspended'),
    defaultValue: 'pending',
  })
  declare status: 'active' | 'pending' | 'suspended';

  // Tambahkan decorator ini di bawah status
  @AllowNull(true)
  @Unique(true)
  @Column(DataType.STRING)
  declare custom_domain: string | null;
}
```

---

## ⚙️ 2. Resolusi Domain di Backend API (`apps/api`)

Kita perlu mengubah metode pembacaan `getTenantId` di controller menjadi **asynchronous** agar bisa menanyakan ke database apakah domain yang diakses saat ini terdaftar sebagai domain kustom tenant tertentu.

### Perbarui `PublicController`
Buka file [apps/api/src/modules/public/public.controller.ts](file:///e:/latihan%20coding/1volvecapital/volvecapital/apps/api/src/modules/public/public.controller.ts):

1. **Tambahkan Import Model Tenant di bagian atas:**
   ```typescript
   import { Tenant } from 'src/database/models/tenant.model';
   ```

2. **Ubah fungsi `getTenantId` menjadi `async` dan tambahkan logika resolusi DB:**
   ```typescript
   private async getTenantId(host: string, xTenantId?: string): Promise<string> {
     // 1. Prioritas utama: Jika dikirim lewat header x-tenant-id (akses dari dashboard)
     if (xTenantId) return xTenantId;
 
     if (!host) throw new BadRequestException('Missing host or x-tenant-id header');
     
     // Bersihkan host dari port jika ada (contoh: rojolapak.com:3000 menjadi rojolapak.com)
     const cleanHost = host.split(':')[0].toLowerCase();
 
     // Abaikan resolusi jika di localhost dev environment
     if (cleanHost.includes('localhost')) {
       return 'master';
     }
 
     // 2. Cek database: Apakah Host ini terdaftar sebagai Kustom Domain milik tenant tertentu?
     const matchedTenant = await Tenant.findOne({
       where: { custom_domain: cleanHost }
     });
 
     if (matchedTenant) {
       return matchedTenant.id; // Return ID tenant asli (misal: paytronik)
     }
 
     // 3. Fallback: Gunakan ekstrak subdomain default (*.digitalpremium.id)
     const parts = cleanHost.split('.');
     if (parts.length >= 2) {
       const subdomain = parts[0];
       if (subdomain !== 'www') {
         return subdomain;
       }
     }
 
     throw new BadRequestException('Tenant ID tidak ditemukan untuk domain/host ini');
   }
   ```

3. **Ubah semua decorator handler di `PublicController` yang memanggil `getTenantId` agar menggunakan `await`:**
   ```typescript
   @Get('product')
   async getProducts(@Headers() headers: any) {
     const host = headers.host || '';
     const xTenantId = headers['x-tenant-id'];
     const tenantId = await this.getTenantId(host, xTenantId); // <-- Tambahkan await
     return this.publicService.getProducts(tenantId);
   }
 
   @Get('settings')
   async getSettings(@Headers() headers: any) {
     const host = headers.host || '';
     const xTenantId = headers['x-tenant-id'];
     const tenantId = await this.getTenantId(host, xTenantId); // <-- Tambahkan await
     return this.publicService.getSettings(tenantId);
   }
 
   @Post('payment/create')
   async createPayment(
     @Headers() headers: any,
     @Body() dto: CreatePaymentDto,
   ) {
     const host = headers.host || '';
     const xTenantId = headers['x-tenant-id'];
     const tenantId = await this.getTenantId(host, xTenantId); // <-- Tambahkan await
     return this.publicService.createPayment(tenantId, dto);
   }
   // Lakukan hal yang sama (tambahkan async/await) pada endpoint public lainnya di file ini!
   ```

---

## 🌐 3. Konfigurasi Server Nginx VPS (Catch-All Block)

Agar VPS Anda bersedia menerima dan merespons request yang datang dari domain kustom apa pun di internet (seperti `rojolapak.com`), kita buat block **Nginx Catch-All** di bagian paling bawah file konfigurasi `/etc/nginx/sites-available/digitalpremium`:

```nginx
# 5. CATCH-ALL UNTUK DOMAIN KUSTOM TENANT (DENGAN SSL)
server {
    listen 443 ssl http2 default_server;
    server_name _; # Tanda _ berarti menangkap seluruh domain luar yang mengarah ke IP ini!

    # Menggunakan Sertifikat Wildcard utama Anda sebagai pengaman dasar jabat tangan SSL
    ssl_certificate /etc/letsencrypt/live/digitalpremium.id-0001/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/digitalpremium.id-0001/privkey.pem;
    include /etc/letsencrypt/options-ssl-nginx.conf;
    ssl_dhparam /etc/letsencrypt/ssl-dhparams.pem;

    location / {
        proxy_pass http://localhost:3001; # Meneruskan ke Next.js Landing Page (Port 3001)
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

---

## 🖥️ 4. Deteksi Domain Server-Side di Next.js (`apps/landingpage`)

Next.js harus mengenali apakah domain yang sedang diakses saat ini merupakan domain kustom.

Buka file [apps/landingpage/src/app/layout.tsx](file:///e:/latihan%20coding/1volvecapital/volvecapital/apps/landingpage/src/app/layout.tsx) dan ubah bagian deteksi `tenantId`-nya:

```typescript
export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const headersList = await headers();
  const host = headersList.get("host") || "";
  
  let tenantId: string | null = null;
  const parts = host.split('.');
  
  // 1. Cek apakah menggunakan domain utama kita digitalpremium.id
  if (host.includes('digitalpremium.id')) {
    if (parts.length >= 2) {
      const subdomain = parts[0];
      if (subdomain !== 'www' && subdomain !== 'localhost' && !subdomain.includes(':')) {
        tenantId = subdomain;
      }
    }
  } else {
    // 2. Jika diakses lewat domain kustom (e.g. rojolapak.com), 
    // biarkan API yang mencari tenantId-nya berdasarkan header Host yang dikirim!
    tenantId = null; 
  }

  let serverThemeCss: string | null = null;
  
  // Ambil pengaturan API menggunakan domain saat ini (Host)
  try {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';
    const res = await fetch(`${apiUrl}/public/settings`, {
      headers: { 
        'x-tenant-id': tenantId || '',
        'Host': host // Kirim host domain asli (misal: rojolapak.com)
      },
      next: { revalidate: 60 },
    });
    if (res.ok) {
      const data = await res.json();
      if (data.LANDING_THEME_CSS) {
        serverThemeCss = data.LANDING_THEME_CSS;
      }
    }
  } catch {
    // silently fail
  }
  
  // ... sisa kode layout.tsx
}
```

---

## 🎨 5. Tampilan Formulir di Dashboard Tenant (`apps/dashboard`)

Kami menambahkan kolom input **Kustom Domain** dan **Alert Box Panduan Konfigurasi DNS** di dalam tab **Umum & SEO** di file [landing.index.tsx](file:///e:/latihan%20coding/1volvecapital/volvecapital/apps/dashboard/src/routes/dashboard/setting/landing.index.tsx).

### A. Tambahkan State Baru
```typescript
const [customDomain, setCustomDomain] = useState('')
```

### B. Muat Nilai dari database (`useEffect`)
```typescript
if (settings.CUSTOM_DOMAIN) setCustomDomain(settings.CUSTOM_DOMAIN)
```

### C. Tambahkan ke payload penyimpanan (`handleSave`)
```typescript
const payload = {
  CUSTOM_DOMAIN: customDomain, // <-- Simpan kustom domain
  SITE_TITLE: siteTitle,
  SITE_DESCRIPTION: siteDescription,
  SITE_FAVICON: siteFavicon,
  // ... sisa payload
}
```

### D. Tampilkan Elemen Form baru di tab "Umum & SEO" (JSX)
Tambahkan kode berikut tepat di bawah kolom *Deskripsi SEO*:

```tsx
<div className="space-y-4 border-t pt-6">
  <h3 className="text-sm font-semibold text-primary">Pengaturan Kustom Domain (Opsional)</h3>
  
  <div className="space-y-2">
    <Label>Domain Kustom Anda</Label>
    <Input 
      value={customDomain} 
      onChange={e => setCustomDomain(e.target.value)} 
      placeholder="Contoh: rojolapak.com atau shop.rojolapak.com" 
    />
    <p className="text-[10px] text-muted-foreground italic">
      * Biarkan kosong jika ingin menggunakan domain bawaan ({auth.tenant!.id}.digitalpremium.id).
    </p>
  </div>

  {/* Alert Box Panduan DNS */}
  <div className="p-4 border border-blue-200 bg-blue-50/50 rounded-lg space-y-2 text-xs">
    <span className="font-semibold text-blue-800 flex items-center gap-1">
      💡 Panduan Menghubungkan Domain Kustom
    </span>
    <p className="text-muted-foreground">
      Agar domain kustom Anda dapat terhubung ke toko premium Anda, silakan ubah pengaturan DNS di penyedia domain Anda (Niagahoster, Domainesia, GoDaddy, dll):
    </p>
    <ul className="list-disc list-inside space-y-1 text-muted-foreground pl-2">
      <li>
        <strong>Rekomendasi (Cloudflare):</strong> Daftarkan domain di Cloudflare gratis, buat record <strong>CNAME</strong> dengan name <code>@</code> (atau subdomain) mengarah ke <code>cname.digitalpremium.id</code> dengan <strong>Proxy Status (Awan Oranye) Aktif</strong>.
      </li>
      <li>
        <strong>Alternatif (A-Record):</strong> Tambahkan record <strong>A</strong> dengan name <code>@</code> mengarah ke IP Server VPS Anda: <code>103.183.74.146</code>.
      </li>
    </ul>
  </div>
</div>
```
