# Netflix Auto Reload Bot — Rencana Implementasi

> File ini digunakan untuk mendokumentasikan alur kerja dan locator HTML sebelum saya mulai ngoding.
> Tolong isi bagian yang bertanda **[ISI INI]** sesuai dengan apa yang kamu lihat di browser Netflix.

---

## 1. Gambaran Umum

**Apa itu Auto Reload?**
Bot akan secara otomatis memperbarui/memperpanjang masa aktif akun Netflix yang sudah atau akan habis, tanpa perlu intervensi manual.

**Pertanyaan Klarifikasi (tolong dijawab):**

1. **Trigger:** Apa yang memicu proses reload dimulai?
   - [ ] Dipicu manual dari Dashboard oleh admin (dibuatkan aja tombol untuk auto reload di dashboard taruh dibawah tombol reset now)


2. **Awal Kondisi Akun:** 
   - [ ] Membership sudah EXPIRED (sudah habis, perlu restart)
   - [ ] Membership masih aktif tapi mau diperpanjang sebelum habis
   - [ ] Tergantung kondisi (bot harus deteksi dulu)

3. **Metode Pembayaran:** 
   - [ ] Transfer manual oleh admin (bot tunggu konfirmasi)
   nanti dibuatkan aja notif aja jika sudah sampai langkah X muncul notifikasi untuk segera top up di nomor gopay/shopeepay /ovo/dana tergantung kolom `billing` saya diisi apa pokoknya sesuaikan aja kolom `billing` ini yang ada ditabel `account`

4. **Plan Netflix:** 
plan mobile dan standart plan
bot harus mengidentifikasi akun yang saya trigger dulu 
1. jika varian nya Harian atau mingguan nanti direload dengan plan mobile
2. jika varian bulanan atau sharing bulanan nanti direload dengan plan standart

---

## 2. Alur Kerja Step-by-Step

### Langkah 1: [buka halaman membership netflix]

**URL yang dibuka:** [`https://www.netflix.com/account/membership`]

**Kondisi yang dideteksi bot:**
- sudah logged in --> lanjut langkah 2
- not logged in --> jalankan bot autoreset dulu, lengkap sampai selesai update database status akun nanti otomatis masuk kesini (bot ini sudah dibuat lengkap flow nya jadi tinggal trigger aja)


### Langkah 2: [bot sudah berada di halaman membership netflix dan sudah logged in]

**Aksi yang dilakukan bot:**
- [ ] mencari tombol 'Mulai Keanggotaan' dengan attribute data-uia="restart-button"
1.jika tombol ditemukan lanjut ke langkah 3
2.jika tidak ditemukan maka bot redirect ke netflix.com/cancelplan
- [] klik tombol expand <button data-uia="icon-button" 
- [] klik tombol cancel membership data-uia="action-finish-cancellation" 


### Langkah 3: [jika kondisi langkah 2 sudah dilewati disini https://www.netflix.com/account/membership sudah pasti ada tombol restart membership]

**HTML Element:**
- [] klik tombol restart membership data-uia="restart-button"

---

### Langkah 4: [setelah klik restart memmbership nanti akan dibawa kehalaman selanjutnya ini]
klik tombol yang ada data-uia="nmhp-card-cta+hero_card"

**HTML Element:**
```html
<button class="e136yimv2 default-ltr-iqcdef-cache-91ere1" data-uia="nmhp-card-cta+hero_card" type="button">Mulai Lagi Keanggotaanmu<div aria-hidden="true" class="default-ltr-iqcdef-cache-15lq9ze e136yimv0"><svg viewBox="0 0 24 24" width="24" height="24" data-icon="ChevronRightMedium" data-icon-id=":R4taml6lelb96:" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="none" role="img"><path fill="currentColor" fill-rule="evenodd" d="m15.586 12-7.293 7.293 1.414 1.414 8-8a1 1 0 0 0 0-1.414l-8-8-1.414 1.414z" clip-rule="evenodd"></path></svg></div></button>
```
---

### Langkah 5: [setelah langkah 4 diklik maka akan dibawa kehalaman ini]
klik tombol yang ada data-uia="cta-button" type="button">Berikutnya</button>

**HTML Element:** 
```html
<button class="e136yimv2 default-ltr-iqcdef-cache-1xwq6r1" data-uia="cta-button" type="button">Berikutnya</button>
```

---

### Langkah 6: [select plan]
1. jika akun yang di trigger adalah varian harian atau mingguan maka bot harus select plan mobile data-uia="plan-selection+option+4120" for="select-4120" 
2. jika akun yang di trigger adalah varian bulanan atau sharing bulanan maka bot harus select plan standart data-uia="plan-selection+option+3088"

---

### Langkah 7: [klik tombol berikutnya]
**HTML Element:** 
```html
<button class="e136yimv2 default-ltr-iqcdef-cache-1xwq6r1" data-uia="cta-plan-selection" type="button">Berikutnya</button>
```
---

### Langkah 8: [klik tombol berikutnya lagi]
**HTML Element:** 
```html
<button class="e136yimv2 default-ltr-iqcdef-cache-1xwq6r1" data-uia="cta-button" type="button">Berikutnya</button>
```

---

### Langkah 9: [centang checkbox]
1. klik tombol checkbox data-uia="legal-checkbox" 

**HTML Element:** 
```html
<input type="checkbox" id=":ru:" name="iAgree" data-uia="legal-checkbox" data-wct-form-control-element="true" value="true">
```

### Langkah 10: [membuat notifikasi untuk top up gopay/shopeepay/ovo/dana tergantung kolom `billing` saya diisi apa pokoknya sesuaikan aja kolom `billing` ini yang ada ditabel `account`]

setelah centang check box bot akan mengirimkan notifikasi untuk top up gopay/shopeepay/ovo/dana tergantung kolom `billing` saya diisi apa pokoknya sesuaikan aja kolom `billing` ini yang ada ditabel `account`]
 
tolong buatkan tombol konfirmasi sudah top up di notifikasi nya ya
jika notifikasi sudah aku konfirmasi maka bot akan melanjutkan ke langkah berikutnya

### Langkah 11: [klik tombol mulai keanggotaan]
**HTML Element:** 
```html
<button class="e136yimv2 default-ltr-iqcdef-cache-1xwq6r1" data-uia="cta-confirm" type="button">Mulai Keanggotaan</button>
```



## 3. Kondisi Error & Penanganan

> Apa yang harus dilakukan bot jika terjadi kondisi tak terduga?

akan saya isi nanti setelah trial dan error aja ini nanti ya

---

## 4. Output / Hasil Akhir

> Apa yang harus diupdate di database setelah reload berhasil?

- [ ] Update `subscription_expiry` akun jika varian nya harian atau mingguan maka + 9 hari dari tanggal reload namun jika tanggal reload nya misal 4 mei 2026 dan sudah lewat jam 22:00 wib maka +10 hari dari tanggal reload
- [ ] Update `subscription_expiry` akun jika varian nya bulanan atau sharing bulanan maka + 1 bulan dari tanggal reload
- [ ] Update status akun menjadi `enable`
- [ ] Notifikasi ke Dashboard akun sudah siap
 
---

