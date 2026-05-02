# Implementasi Link Interaktif pada Langkah Tutorial

Fitur ini akan menambahkan kolom link (URL) opsional pada setiap langkah tutorial, sehingga user bisa langsung diarahkan ke halaman tujuan (seperti Portal Email atau Halaman Redeem) saat mengikuti panduan.

## 1. Perubahan Struktur Data (Database & API)
Kita akan menambahkan dua field baru di dalam array `steps` pada tabel `tutorial`:
- `link_text`: Teks yang akan tampil di tombol (misal: "Buka Portal Email").
- `link_url`: URL tujuan (mendukung URL eksternal atau placeholder khusus).

**Struktur Step Baru:**
```json
{
  "label": "LANGKAH 1",
  "title": "Cek Kode OTP",
  "description": "Silakan buka portal email untuk melihat kode.",
  "image_url": "...",
  "link_text": "Buka Portal Email",
  "link_url": "$$portal_url"
}
```

## 2. Rencana Dashboard (Admin UI)
- Menambah dua input field baru di bawah "Deskripsi" pada setiap langkah tutorial:
  - **Input Teks Tombol**: Label tombol yang akan diklik user.
  - **Input URL Link**: URL tujuan. Jika diisi, tombol akan muncul di halaman tutorial.

## 3. Rencana Landing Page (Public UI)
- Jika sebuah langkah memiliki data `link_url`, maka di bawah deskripsi langkah tersebut akan muncul tombol (Button) dengan desain yang sesuai (kontras dan premium).
- Tombol akan otomatis membuka link di **Tab Baru (target="_blank")**.

---

## Klarifikasi & Pertanyaan

Mohon informasikan beberapa poin berikut agar implementasi tepat sasaran:

1. **Kasus Portal Email OTP**: Link portal email membutuhkan `access_token` unik dari hasil redeem agar bisa dibuka. Karena halaman Tutorial ini **publik** (bisa dibuka siapa saja tanpa login), link Portal tidak akan berfungsi jika kita hanya menaruh link statis. 
   - *Pertanyaan*: Apakah Anda ingin link portal tersebut mengarah ke **Halaman Redeem** saja agar user melakukan cek voucher dulu, atau Anda ingin tombol tersebut hanya muncul jika user membuka tutorial dalam "konteks" tertentu?
2. **Placeholder Khusus**: Apakah kita butuh placeholder seperti `$$redeem_page` yang otomatis mengarah ke halaman `/redeem` tenant tersebut agar Anda tidak perlu mengetik URL lengkap?
3. **Desain Tombol**: Apakah Anda ingin tombol link ini memiliki warna yang seragam (misal: emas/primary) atau bisa kustom warna per langkah? (Saran saya: Seragam agar tetap rapi).
4. **Link di Deskripsi**: Apakah deskripsi langkah juga perlu mendukung "clickable link" di dalam teks (hyperlink), atau cukup satu tombol utama saja di setiap langkah?

jawaban :
1. aku ingin tombol tersebut hanya muncul jika user membuka tutorial dalam "konteks" tertentu misal jika dia sudah redeem voucher baru muncul tombol portal emailnya
2. aku ingin menggunakan placeholder $$portal_url
3. seragam aja warnanya
4. cukup satu tombol utama aja di setiap langkah