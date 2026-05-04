# Netflix Auto Reload Bot — Rencana Implementasi

> File ini digunakan untuk mendokumentasikan alur kerja dan locator HTML sebelum saya mulai ngoding.
> Tolong isi bagian yang bertanda **[ISI INI]** sesuai dengan apa yang kamu lihat di browser Netflix.

---

## 1. Gambaran Umum

**Apa itu Auto Reload?**
Bot akan secara otomatis memperbarui/memperpanjang masa aktif akun Netflix yang sudah atau akan habis, tanpa perlu intervensi manual.

**Pertanyaan Klarifikasi (tolong dijawab):**

1. **Trigger:** Apa yang memicu proses reload dimulai?
   - [ ] Tanggal kadaluarsa akun mendekati batas (scheduler otomatis)
   - [ ] Dipicu manual dari Dashboard oleh admin
   - [ ] Dipicu oleh kondisi stok rendah
   - [ ] Lainnya: [ISI INI]

2. **Awal Kondisi Akun:** Saat reload dimulai, kondisi akun Netflix seperti apa?
   - [ ] Membership sudah EXPIRED (sudah habis, perlu restart)
   - [ ] Membership masih aktif tapi mau diperpanjang sebelum habis
   - [ ] Tergantung kondisi (bot harus deteksi dulu)

3. **Metode Pembayaran:** Bagaimana cara melakukan top-up/pembayaran?
   - [ ] Kartu kredit/debit yang sudah tersimpan
   - [ ] Transfer manual oleh admin (bot tunggu konfirmasi)
   - [ ] Virtual Account / payment gateway lain
   - [ ] Lainnya: [ISI INI]

4. **Plan Netflix:** Plan apa yang digunakan dan apakah perlu ganti plan saat reload?
   - Contoh: Mobile → Premium, atau tetap di plan yang sama
   - [ISI INI]

---

## 2. Alur Kerja Step-by-Step

> Tolong jelaskan setiap langkah yang kamu lakukan secara manual di Netflix, lengkap dengan HTML element jika bisa.
> Format: **Langkah N: [deskripsi]** + HTML element sebagai referensi locator.

---

### Langkah 1: [ISI INI — Contoh: Buka halaman akun Netflix]

**URL yang dibuka:** [ISI INI — contoh: `https://www.netflix.com/account`]

**Kondisi yang dideteksi bot:**
- [ISI INI]

**HTML Element (jika ada):**
```html
[tempel HTML element di sini]
```

---

### Langkah 2: [ISI INI]

**Aksi yang dilakukan bot:**
- [ ] Klik tombol
- [ ] Input teks
- [ ] Pilih opsi
- [ ] Tunggu elemen muncul
- [ ] Lainnya: [ISI INI]

**HTML Element:**
```html
[tempel HTML element di sini]
```

---

### Langkah 3: [ISI INI]

**HTML Element:**
```html
[tempel HTML element di sini]
```

---

### Langkah 4: [ISI INI]

**HTML Element:**
```html
[tempel HTML element di sini]
```

---

### Langkah 5: [ISI INI]

**HTML Element:**
```html
[tempel HTML element di sini]
```

---

### Langkah 6: [ISI INI]

**HTML Element:**
```html
[tempel HTML element di sini]
```

---

*(Tambah langkah baru sesuai kebutuhan dengan format yang sama)*

---

## 3. Kondisi Error & Penanganan

> Apa yang harus dilakukan bot jika terjadi kondisi tak terduga?

| Kondisi Error | Tindakan Bot |
|---|---|
| [ISI INI — contoh: Halaman tidak load] | [ISI INI — contoh: Retry 3x, lalu kirim notifikasi error] |
| [ISI INI] | [ISI INI] |
| [ISI INI] | [ISI INI] |

---

## 4. Output / Hasil Akhir

> Apa yang harus diupdate di database setelah reload berhasil?

- [ ] Update `batch_end_date` / `subscription_expiry` akun
- [ ] Update status akun menjadi `ready` / `active`
- [ ] Update `password` akun (jika ada perubahan)
- [ ] Ganti `product_variant_id` (jika plan berubah)
- [ ] Notifikasi ke Dashboard
- [ ] Lainnya: [ISI INI]

---

## 5. Locator Summary (diisi saat step sudah lengkap)

> Bagian ini akan saya isi setelah semua langkah dan HTML element sudah lengkap.

| Langkah | Element | Selector | Tipe Aksi |
|---|---|---|---|
| - | - | - | - |

---

## 6. Catatan Tambahan

[ISI INI — tulis hal-hal khusus yang perlu diperhatikan]
