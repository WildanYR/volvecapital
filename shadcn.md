# Rencana Implementasi Shadcn Theme Customizable untuk Landing Page

Ide Anda sangat brilian! Menggunakan variabel CSS dari shadcn/ui (`:root` dan `.dark`) memberikan kebebasan kustomisasi warna yang nyaris tak terbatas hanya dengan copy-paste dari dokumentasi shadcn.

Sebelum kita mulai menulis kode, ada beberapa aspek teknis yang perlu kita sepakati. Berikut adalah langkah-langkah implementasi di tingkat tinggi beserta beberapa pertanyaan untuk Anda:

## 1. Konfigurasi Tailwind & CSS Variabel Dasar
**Rencana:**
- Memodifikasi `apps/landingpage/tailwind.config.ts` untuk memetakan warna bawaan shadcn seperti `primary: "hsl(var(--primary))"`, `background: "hsl(var(--background))"`, dll. *(Catatan: shadcn sekarang menggunakan `oklch` di versi terbarunya, kita akan konfigurasikan Tailwind untuk mendukung ini)*.
- Membuat `global.css` dasar di landing page yang memiliki nilai *default* (fallback) jika *tenant* belum mengatur tema.

## 2. Refaktor UI Landing Page
**Rencana:**
- Merombak *class* Tailwind yang di-_hardcode_ (seperti `bg-[#f97316]`, `text-slate-500`, `bg-white`) menjadi nama variabel semantik shadcn (seperti `bg-primary`, `text-muted-foreground`, `bg-background`, `text-foreground`).
- Mengganti komponen statis menjadi komponen responsif terhadap perubahan tema.

## 3. Integrasi Tema di Level Tenant (Database)
**Rencana:**
- Menyimpan string CSS (yang di-*paste* *user*) ke dalam tabel `tenant_setting` dengan *key* misalnya `landing_theme_css`.
- Saat *landing page* di-*load* oleh *buyer*, API akan memberikan nilai CSS tersebut, lalu kita injeksikan ke dalam tag `<style>` secara dinamis di level teratas aplikasi.

## 4. UI Dashboard (Pengaturan Landing Page)
**Rencana:**
- Membuat halaman baru di `apps/dashboard/src/routes/dashboard/setting/landing.tsx`.
- Menambahkan komponen `<textarea>` besar atau editor kode ringan agar *user* bisa melakukan *paste* blok CSS dari shadcn.
- Menambahkan fitur *preview* sederhana atau tombol simpan.

---

## 🛑 Pertanyaan untuk Anda Sebelum Mulai *Coding*:

1. **Format Warna (HSL vs OKLCH):** 
   Versi shadcn terbaru (seperti contoh Anda) menggunakan format `oklch`. Apakah Tailwind di *landing page* Anda sudah mendukung *plugin* atau konfigurasi untuk `oklch` tanpa koma (karena fitur bawaan Tailwind kadang masih mengharapkan `hsl` atau butuh deklarasi spesifik)? Jika belum, saya akan sesuaikan *config*-nya.
   
2. **Dukungan Dark Mode:**
   Di *landing page*, apakah Anda ingin ada tombol *toggle* untuk berpindah antara "Light" dan "Dark" mode? Ataukah landing page hanya menggunakan mode "Light" secara *default* (menggunakan blok `:root`), dan `.dark` mode otomatis aktif mengikuti preferensi sistem *device* dari pembeli?

3. **Ruang Lingkup Refaktor:**
   Perombakan total (mengubah semua warna hardcoded ke `var(--primary)` dkk) akan memodifikasi hampir seluruh *file* komponen di `apps/landingpage`. Apakah Anda setuju kita mengubah semuanya sekaligus, atau fokus dulu pada tombol dan latar belakang utama?

4. **Tampilan Dashboard Pengaturan:**
   Di halaman `/dashboard/setting/landing`, apakah cukup hanya *Textarea* kosong tempat *user* mem-*paste* CSS? Ataukah Anda ingin ada kotak-kotak kecil yang menampilkan warna *preview* (*Primary*, *Background*, *Card*) setelah mereka *paste* kode tersebut?

Silakan jawab pertanyaan di atas, lalu kita akan langsung mulai mengeksekusi kodenya!



jawaban saya :
1. belum buatkan aja config nya ya
2. ya saya mau ada mode dark nya juga
3. ya saya setuju kita ubah semuanya sekaligus
4. tidak usah ada kotak preview dulu cukup textarea saja tinggal paste kode dari shadcn.com