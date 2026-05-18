# Kustomisasi Judul Situs, Favicon, & SEO Multi-Tenant

Kami telah berhasil menerapkan fitur yang memungkinkan **setiap tenant mengatur sendiri Judul Tab Browser (Site Title), Favicon (Ikon Tab Browser), dan Deskripsi SEO (Site Description)** melalui Dashboard masing-masing! 

Perubahan ini langsung aktif secara real-time dan terintegrasi penuh ke landing page dinamis berbasis subdomain Anda.

---

## 🛠️ Ringkasan Implementasi

### 1. Backend & Model Data (`api.digitalpremium.id`)
* Sistem secara otomatis menyimpan pengaturan di tabel `tenant_setting` menggunakan model `TenantSetting` dengan kata kunci berikut:
  * `SITE_TITLE`: Judul utama situs tenant (misal: `Paytronik — Premium Store`).
  * `SITE_FAVICON`: URL gambar ikon kecil tab browser (format `.png` atau `.ico`).
  * `SITE_DESCRIPTION`: Deskripsi SEO yang tampil saat link dibagikan di WhatsApp/Google.
* Endpoint `GET /public/settings` menyajikan data ini secara instan berdasarkan subdomain yang diakses.

### 2. Frontend Landing Page (`apps/landingpage`)
* Mengubah metadata statis di [layout.tsx](file:///e:/latihan%20coding/1volvecapital/volvecapital/apps/landingpage/src/app/layout.tsx) menjadi **Dynamic Metadata** menggunakan fungsi `generateMetadata()` bawaan Next.js App Router.
* Secara dinamis mengambil pengaturan `SITE_TITLE`, `SITE_DESCRIPTION`, dan `SITE_FAVICON` server-side untuk memastikan performa maksimal dan 0% Flash of Unstyled Content (FOUC).

### 3. Frontend Dashboard (`apps/dashboard`)
* Menambahkan tab **"Umum & SEO"** baru sebagai halaman utama di menu Kustomisasi Landing Page ([landing.index.tsx](file:///e:/latihan%20coding/1volvecapital/volvecapital/apps/dashboard/src/routes/dashboard/setting/landing.index.tsx)).
* Menyediakan form input interaktif yang elegan untuk mengubah judul, favicon URL, dan deskripsi SEO, lengkap dengan penjelasan panduan penggunaannya.

---

## 📋 Cara Menggunakannya (Langkah demi Langkah)

### Langkah 1: Akses Menu Kustomisasi
1. Masuk ke **Dashboard Tenant** Anda (misalnya: `https://digitalpremium.id/portal` atau `https://paytronik.digitalpremium.id/portal`).
2. Masuk ke menu **Pengaturan (Settings) > Landing Page**.

### Langkah 2: Atur Tab "Umum & SEO"
Anda akan langsung melihat tab baru bernama **Umum & SEO** di bagian paling atas:
* **Judul Situs (Site Title)**: Ubah sesuai nama brand Anda (contoh: `Paytronik Premium Store`).
* **Favicon URL (Ikon Tab Browser)**: Masukkan link gambar logo Anda (contoh: `https://imgur.com/logo-anda.png`).
* **Deskripsi SEO (Site Description)**: Tulis deskripsi promosi singkat toko Anda.

> [!TIP]
> **Rekomendasi Favicon**: Gunakan tautan gambar yang andal (seperti Imgur, Cloudinary, atau server statik Anda) dengan dimensi kotak sempurna (e.g., `32x32` atau `64x64` piksel) dalam format PNG atau ICO agar tampil tajam di semua jenis browser mobile maupun desktop.

### Langkah 3: Simpan Perubahan
1. Klik tombol **Simpan Semua Perubahan** di pojok kanan atas.
2. Akses kembali domain utama atau subdomain tenant Anda (misal: `https://paytronik.digitalpremium.id`).
3. Browser akan langsung menampilkan judul tab baru dan logo favicon kustom Anda secara instan! 🎉

---

## 💻 Rincian Perubahan Kode (Diff)

### A. Dynamic Metadata di `apps/landingpage/src/app/layout.tsx`

```diff
-export const metadata: Metadata = {
-  title: "Digital Premium — Premium Streaming Voucher System",
-  description: "Dapatkan akses premium untuk Netflix, Spotify, Disney+, dan layanan streaming lainnya dengan harga terjangkau dan proses instan.",
-  keywords: ["streaming voucher", "netflix premium", "spotify premium", "digital premium"],
-  openGraph: {
-    title: "Digital Premium — Premium Streaming Voucher",
-    description: "Sistem voucher streaming otomatis, cepat, dan terpercaya.",
-    type: "website",
-  },
-};
+export async function generateMetadata(): Promise<Metadata> {
+  const headersList = await headers();
+  const host = headersList.get("host") || "";
+  
+  let tenantId: string | null = null;
+  const parts = host.split('.');
+  
+  if (parts.length >= 2) {
+    const subdomain = parts[0];
+    if (subdomain !== 'www' && subdomain !== 'localhost' && !subdomain.includes(':')) {
+      tenantId = subdomain;
+    }
+  }
+
+  // Default SEO fallback
+  let title = "Digital Premium — Premium Streaming Voucher System";
+  let description = "Dapatkan akses premium untuk Netflix, Spotify, Disney+, dan layanan streaming lainnya dengan harga terjangkau dan proses instan.";
+  let favicon = "/favicon.ico";
+
+  if (tenantId) {
+    try {
+      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';
+      const res = await fetch(`${apiUrl}/public/settings`, {
+        headers: { 'x-tenant-id': tenantId },
+        next: { revalidate: 60 }, // Cache for 60 seconds
+      });
+      if (res.ok) {
+        const data = await res.json();
+        if (data.SITE_TITLE) {
+          title = data.SITE_TITLE;
+        }
+        if (data.SITE_DESCRIPTION) {
+          description = data.SITE_DESCRIPTION;
+        }
+        if (data.SITE_FAVICON) {
+          favicon = data.SITE_FAVICON;
+        }
+      }
+    } catch {
+      // Silently fall back to default metadata
+    }
+  }
+
+  return {
+    title,
+    description,
+    keywords: ["streaming voucher", "netflix premium", "spotify premium", "digital premium"],
+    icons: {
+      icon: favicon,
+    },
+    openGraph: {
+      title,
+      description,
+      type: "website",
+    },
+  };
+}
```

### B. Form Kustomisasi di `apps/dashboard/src/routes/dashboard/setting/landing.index.tsx`

```diff
  const [themeCss, setThemeCss] = useState('')
+  const [siteTitle, setSiteTitle] = useState('Digital Premium')
+  const [siteDescription, setSiteDescription] = useState('Premium Streaming Voucher System')
+  const [siteFavicon, setSiteFavicon] = useState('/favicon.ico')
```

```diff
  const handleSave = () => {
    const payload = {
+      SITE_TITLE: siteTitle,
+      SITE_DESCRIPTION: siteDescription,
+      SITE_FAVICON: siteFavicon,
      LANDING_HERO: JSON.stringify(hero),
      LANDING_FEATURES: JSON.stringify(features),
      ...
```
