# Netflix Auto Reload Bot — Rencana Implementasi Teknis

> Dokumen ini dibuat berdasarkan `autoreload.md`. Berisi rencana implementasi detail + pertanyaan klarifikasi yang masih perlu dijawab sebelum coding dimulai.

---

## ❓ Pertanyaan Klarifikasi (Harus Dijawab Dulu)

### Q1 — Langkah 2: Alur `cancelplan` masih ambigu

Di Langkah 2, kamu tulis:
> *"jika tidak ditemukan maka bot redirect ke `netflix.com/cancelplan`"*
> *"klik tombol expand `data-uia="icon-button"`"*
> *"klik tombol cancel membership `data-uia="action-finish-cancellation"`"*

**Pertanyaan:**
- Apakah alur ini berarti membership masih **aktif** dan perlu di-cancel dulu supaya muncul tombol "Restart Membership"?
- Setelah klik `action-finish-cancellation`, apakah langsung balik ke `/account/membership` dan tombol "Mulai Keanggotaan" sudah muncul? Atau ada halaman konfirmasi lagi?
- Bisakah kamu paste HTML dari tombol expand dan tombol `action-finish-cancellation`? Saya perlu tau apakah `icon-button` adalah `data-uia` atau class, karena bisa ada banyak tombol dengan nama itu di satu halaman.


jawaban :
- iya betul masih aktif dan perlu cancel plan dulu setelah cancelplan pasti muncul tombol restartmembership
- setelah klik action-finish-cancellation belum langsung muncul tapi harus balik ke (https://www.netflix.com/account/membership) dan tombol restartmembership sudah muncul 

<button data-uia="icon-button" aria-label="Tampilkan isi pilihan" class="ewkwka40 default-ltr-iqcdef-cache-1u5sgxr" type="button"><div aria-hidden="true" data-uia="icon-button+icon-wrapper" class="default-ltr-iqcdef-cache-pfy02n"><svg viewBox="0 0 16 16" width="16" height="16" data-icon="PlusSmall" data-icon-id=":rp:" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="none" role="img"><path fill="currentColor" fill-rule="evenodd" d="M7.25 7.25V1h1.5v6.25H15v1.5H8.75V15h-1.5V8.75H1v-1.5z" clip-rule="evenodd"></path></svg></div></button>

untuk tombol ini muncul harus klik expand dulu tombol expand sudah aku tulis HTML nya diatas ini
<button class="e136yimv2 default-ltr-iqcdef-cache-1bhgst0" tabindex="0" data-uia="action-finish-cancellation" type="button">Selesaikan Pembatalan</button>
---

### Q2 — Langkah 5 dan 8: Tombol `cta-button` sama, tapi halaman berbeda

Langkah 5 dan Langkah 8 sama-sama punya `data-uia="cta-button"` dengan teks "Berikutnya". Ini berpotensi bentrok karena selektor sama.

**Pertanyaan:**
- Apakah URL halaman berubah antara Langkah 5 dan Langkah 8? Kalau iya, URL-nya apa saja? Ini penting agar bot bisa `waitForURL` dulu sebelum klik tombol berikutnya.
- Atau apakah Langkah 8 ini halaman yang sama dengan Langkah 5 dan hanya perlu scroll/tunggu?
jawaban : 
url nya berubah tapi dinamis yang penting di langkah no 5 bisa ditandai dengan adanya tulis <h1 class="default-ltr-iqcdef-cache-6pbot e1vs384d0">Selamat datang kembali!</h1> (tolong dibuat dinamis jika ini tulisan nya bahasa inggris ya) 

dilangkah no 8 bisa ditandai dengan <h1 class="default-ltr-iqcdef-cache-6pbot e1vs384d0">Yang terakhir</h1>
ada tulisan Yang terakhir
---

### Q3 — Langkah 6: ID Plan `4120` dan `3088`

Kamu menyebutkan:
- Mobile: `data-uia="plan-selection+option+4120"`
- Standard: `data-uia="plan-selection+option+3088"`

**Pertanyaan:**
- Apakah ID `4120` dan `3088` ini **selalu tetap** di semua akun Netflix kamu? Atau bisa berbeda-beda per akun/region?
- Bisakah paste HTML lengkap dari elemen radio plan-nya? Saya perlu pastikan locatornya stabil.

selalu tetap ya karena itu identitas plan nya berikut HTML nya
<label data-uia="plan-selection+option+4120" for="select-4120" aria-describedby="describe-4120" class="default-ltr-iqcdef-cache-nxjh3n"><span data-uia="plan-name" class="default-ltr-iqcdef-cache-1dooskv">Ponsel</span><span class="default-ltr-iqcdef-cache-1icybke">480p</span><div class="default-ltr-iqcdef-cache-udwogp"><div data-uia="selected-indicator" class="default-ltr-iqcdef-cache-1a130f1 evpvpj0" size="14"><svg width="24" height="22" viewBox="0 0 24 22" fill="none" class="success-icon" data-uia="success-svg"><path fill-rule="evenodd" clip-rule="evenodd" d="M12.0183 21.0833C17.7761 21.0833 22.4438 16.5688 22.4438 11C22.4438 5.43112 17.7761 0.916656 12.0183 0.916656C6.26044 0.916656 1.59277 5.43112 1.59277 11C1.59277 16.5688 6.26044 21.0833 12.0183 21.0833ZM11.7407 14.3982L17.4273 8.89817L16.087 7.60181L11.0705 12.4536L8.89738 10.3518L7.55702 11.6482L10.4004 14.3982L11.0705 15.0463L11.7407 14.3982Z" fill="#0071EB"></path></svg></div></div></label>

<label data-uia="plan-selection+option+3108" for="select-3108" aria-describedby="describe-3108" class="default-ltr-iqcdef-cache-1tht55p"><span data-uia="plan-name" class="default-ltr-iqcdef-cache-1dooskv">Premium</span><span class="default-ltr-iqcdef-cache-1icybke">4K + HDR</span></label>


---

### Q4 — Notifikasi Top-up (Langkah 10): Mekanisme pengiriman

Kamu minta notifikasi dikirim ke Dashboard (tombol konfirmasi top-up).

**Pertanyaan:**
- Apakah notifikasi ini muncul di **Dashboard web** (seperti banner/popup), atau dikirim lewat **bot WhatsApp/Telegram**, atau keduanya?
- Berapa lama timeout menunggu konfirmasi? Kalau admin lupa konfirmasi, bot harus ngapain — timeout error, atau tunggu selamanya?
- Tombol konfirmasi di dashboard: apakah kamu mau tombol ini muncul sebagai **floating notification** (seperti stok notif yang sudah ada di `stock-notification.tsx`), atau di halaman akun detail saja?

jawaban :
- muncul di dashboard web seperti peringatan stock itu ditaruh disitu aja
- timeout menunggu konfirmasi 10 menit
- seperti stock notif aja

---

### Q5 — Output: Status `enable` vs status yang sudah ada

Di tabel `account`, status yang terdefinisi adalah: `active`, `ready`, `disable`.
Kamu menulis update status menjadi **`enable`** — ini **bukan** salah satu nilai yang valid di skema database yang ada.

**Pertanyaan:**
- Maksudnya status apa? `ready`? `active`? Atau memang mau tambah nilai baru `enable`?

jawaban :
iya maksudnya `ready' seperti yang ada di database saya

---

### Q6 — Trigger dari Dashboard: Tombol di mana?

Kamu minta tombol "Auto Reload" ditaruh di bawah tombol "Reset Now" di Dashboard.

**Pertanyaan:**
- "Reset Now" ini ada di halaman mana? Halaman detail akun (`/dashboard/account/:id`)? Atau di tabel daftar akun?
- Apakah tombol reload ini men-trigger **satu akun saja** (yang sedang dibuka), atau bisa bulk (banyak akun sekaligus)?

jawaban :
- ada di daftar akun http://localhost:3000/dashboard/account/netflix kan di setiap card produk nya ada tombol reset now itu taruh di bawah tombol itu
- mentrigger 1 akun saja mana akun yang saya pencet trigger nya nanti
---

## ✅ Rencana Implementasi (Bagian Yang Sudah Jelas)

### Komponen yang Perlu Dibuat / Dimodifikasi

#### A. Bot (`apps/bot2`)

**File Baru:**
- `src/modules/netflix/locators/reload.ts` — Locators untuk halaman membership & plan selection
- Method baru `autoReload(task: Task)` di `NetflixModule.ts`

**Alur Method `autoReload` (Draft):**

```
1. Ambil data akun dari payload: email, password, accountId, variant_name, billing
2. Identifikasi tipe plan:
   - variant_name contains "Harian" atau "Mingguan" → plan = "mobile" (ID: 4120)
   - variant_name contains "Bulanan" atau "Sharing" → plan = "standard" (ID: 3088)
3. Buka context browser dengan session akun (sama seperti resetPassword)
4. Navigasi ke https://www.netflix.com/account/membership
5. Deteksi login state (gunakan detectLoginState yang sudah ada)
   - Jika not_logged_in → jalankan resetPassword flow dulu, tunggu selesai, lalu lanjut
   - Jika logged_in → lanjut ke langkah berikutnya
6. Deteksi tombol restart-button:
   - ADA → loncat ke Langkah 3 (klik restart)
   - TIDAK ADA → jalankan sub-alur cancel plan (Langkah 2)
7. [Sub-alur cancel plan]
   - Navigasi ke netflix.com/cancelplan
   - Klik tombol expand
   - Klik tombol action-finish-cancellation
   - Kembali ke /account/membership, tunggu restart-button muncul
8. Klik restart-button → tunggu redirect
9. Klik tombol nmhp-card-cta+hero_card (Mulai Lagi Keanggotaanmu)
10. Klik tombol cta-button (Berikutnya)
11. Pilih plan sesuai identifikasi di langkah 2
12. Klik tombol cta-plan-selection (Berikutnya)
13. Klik tombol cta-button (Berikutnya - halaman ke-2)
14. Centang checkbox legal-checkbox
15. Emit notifikasi top-up ke Dashboard via socket
    → Format: "Segera top-up [billing_method] untuk akun [email]"
    → Tunggu event konfirmasi dari Dashboard
16. Setelah konfirmasi diterima → klik tombol cta-confirm (Mulai Keanggotaan)
17. Update database:
    - subscription_expiry = hitung berdasarkan varian (lihat logika di bawah)
    - status = ready (atau active, perlu konfirmasi Q5)
18. Notifikasi ke Dashboard: reload berhasil
```

---

#### B. Logika Hitung `subscription_expiry`

```typescript
function calculateReloadExpiry(variantName: string): Date {
  const now = new Date();
  const isHarianOrMingguan = /harian|mingguan/i.test(variantName);

  if (isHarianOrMingguan) {
    // +9 hari, tapi jika sudah lewat jam 22:00 WIB → +10 hari
    const WIB_OFFSET = 7 * 60 * 60 * 1000; // UTC+7
    const nowWIB = new Date(now.getTime() + WIB_OFFSET);
    const hourWIB = nowWIB.getUTCHours();
    const daysToAdd = hourWIB >= 22 ? 10 : 9;
    now.setDate(now.getDate() + daysToAdd);
    return now;
  } else {
    // Bulanan / Sharing Bulanan → +1 bulan
    now.setMonth(now.getMonth() + 1);
    return now;
  }
}
```

---

#### C. Locators yang Sudah Jelas (`src/modules/netflix/locators/reload.ts`)

| Langkah | Selector | Tipe | Catatan |
|---|---|---|---|
| Langkah 2 | `[data-uia="restart-button"]` | exists check | Deteksi ada/tidak |
| Langkah 3 | `[data-uia="restart-button"]` | click | |
| Langkah 4 | `[data-uia="nmhp-card-cta+hero_card"]` | click | |
| Langkah 5 | `[data-uia="cta-button"]` | click | ⚠️ Perlu waitForURL dulu |
| Langkah 6 Mobile | `[data-uia="plan-selection+option+4120"]` | click | ⚠️ Perlu konfirmasi Q3 |
| Langkah 6 Std | `[data-uia="plan-selection+option+3088"]` | click | ⚠️ Perlu konfirmasi Q3 |
| Langkah 7 | `[data-uia="cta-plan-selection"]` | click | |
| Langkah 8 | `[data-uia="cta-button"]` | click | ⚠️ Perlu waitForURL dulu |
| Langkah 9 | `[data-uia="legal-checkbox"]` | check | |
| Langkah 11 | `[data-uia="cta-confirm"]` | click | |

**Locator yang masih butuh HTML (belum bisa dibuat):**
- Tombol expand di `/cancelplan` (Q1)
- Tombol `action-finish-cancellation` di `/cancelplan` (Q1)

---

#### D. API (`apps/api`)

**Endpoint Baru:**
- `POST /public/reload/confirm` — Dashboard panggil ini untuk konfirmasi top-up, lalu API emit socket event ke Bot

**Endpoint Baru (atau update yang ada):**
- `PATCH /account/:id` — Sudah ada, cukup tambahkan `subscription_expiry` dan kemungkinan `target_variant_name` jika plan berubah

**Konstanta Baru di `task.const.ts`:**
- `NETFLIX_AUTO_RELOAD = 'NETFLIX_AUTO_RELOAD'`

---

#### E. Dashboard (`apps/dashboard`)

**Tombol Trigger:**
- Tambah tombol "Auto Reload" di halaman detail akun (di bawah tombol "Reset Now") → perlu konfirmasi Q6

**Notifikasi Top-up:**
- Panel notifikasi di Dashboard (perlu konfirmasi Q4 mekanismenya)
- Tombol "Sudah Top-up ✓" yang memanggil `POST /public/reload/confirm`

---

## 📋 Ringkasan Blokir

| # | Pertanyaan | Dampak jika belum dijawab |
|---|---|---|
| Q1 | Alur cancel plan + HTML element | Tidak bisa buat locator Langkah 2 |
| Q2 | URL halaman Langkah 5 vs 8 | Bot bisa klik tombol yang salah |
| Q3 | Apakah ID plan stabil? + HTML plan | Locator plan bisa salah/gagal |
| Q4 | Mekanisme notifikasi top-up | Tidak tahu harus bangun UI apa |
| Q5 | Status `enable` itu apa? | Salah update database |
| Q6 | Lokasi tombol di dashboard | Tidak tahu di file mana harus edit |

---

> Setelah semua pertanyaan di atas dijawab, saya bisa langsung mulai coding.
