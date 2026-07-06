# Desentralisasi Eksekusi Bot (Decentralized Bot Execution)

Dokumen ini menjelaskan rancangan untuk membagi beban kerja bot secara dinamis. Saat ini, semua tugas manual (seperti *Reset Manual*, *Login TV*, *Auto Reload*, atau *Upgrade Premium*) yang dipicu dari dashboard akan dieksekusi oleh bot mana pun yang memiliki beban kerja (*inflight task*) paling rendah, yang biasanya jatuh ke Mini PC (bot utama).

Hal ini menyebabkan beban berlebih pada Mini PC utama. Solusinya adalah mengizinkan pengiriman tugas manual secara spesifik ke bot yang berjalan pada perangkat pengguna yang memicu aksi tersebut.

---

## Analisis Masalah & Kebutuhan

1. **Identitas Bot**: Setiap bot yang terhubung ke server Socket.io di API memiliki identitas unik berupa `connection_name` (misalnya: `"Mini PC"`, `"Komputer Gilang"`, `"Laptop Teman"`) yang didefinisikan di `config.toml` pada bagian `[app.name]`.
2. **Kondisi Saat Ini**: Server API menggunakan fungsi `getAvailableBot()` di `socket.gateway.ts` yang hanya memilih bot berdasarkan jumlah tugas aktif (`inflight`) tanpa memedulikan asal trigger.
3. **Kebutuhan**: Jika Gilang menekan tombol trigger di komputernya, tugas tersebut harus dikirim ke bot `"Komputer Gilang"`. Jika temannya menekan tombol di laptopnya, tugas dikirim ke bot `"Laptop Teman"`. Bot utama ("Mini PC") hanya menangani tugas otomatis atau terjadwal (jika tidak ada bot spesifik yang diminta).

---

## Alur Implementasi yang Diusulkan

### 1. Modifikasi di Sisi Dashboard
Ketika pengguna memicu aksi manual (misalnya tombol "Reset Manual"), dashboard akan mengirimkan HTTP request ke API.
Kita akan memodifikasi dashboard untuk menyertakan informasi bot target:
- Dashboard mendeteksi nama perangkat lokal/user saat ini (atau menyediakan pilihan dropdown berisi bot-bot yang sedang online).
- Menyertakan parameter `target_bot` (string berisi `appName` bot, misal `"Komputer Gilang"`) di dalam payload request API.

### 2. Modifikasi di Database & API Queue
- Ketika task disimpan ke tabel `task_queue`, parameter `target_bot` disimpan di dalam kolom `payload` sebagai JSON property (misal: `{ "accountId": "xxx", "target_bot": "Komputer Gilang" }`).
- Hal ini memastikan parameter bot target tetap tersimpan meskipun task antre di redis/database.

### 3. Modifikasi di API Worker (`task-helper.service.ts` & `socket.gateway.ts`)
- Di `task-helper.service.ts`, sebelum melakukan dispatch task, kita membaca `target_bot` dari payload task.
- Nilai `target_bot` ini dilewatkan ke fungsi `dispatchTask()` di `socket.gateway.ts`.
- Di `socket.gateway.ts`, logika pemilihan bot diubah agar mencari koneksi socket bot yang memiliki nama (`connection_name`) cocok dengan `target_bot`.
- Jika bot target online, kirim tugas ke bot tersebut.
- Jika bot target offline (atau tidak ditentukan), lakukan *fallback* ke `getAvailableBot()` (misal ke Mini PC utama).

---

## Contoh Ilustrasi Alur Kode (Konseptual)

### Di `socket.gateway.ts`:
```typescript
async dispatchTask(
  taskId: string,
  tenantId: string,
  dispatchTaskData?: DispatchTaskData,
  targetBotName?: string // <-- Tambah parameter baru
) {
  let targetBot: SocketConnection | undefined;

  // Jika ada target bot spesifik, coba cari yang online
  if (targetBotName) {
    targetBot = Array.from(this.connections.values()).find(
      c => c.tenant_id === tenantId && c.type === 'BOT' && c.name === targetBotName
    );
  }

  // Fallback jika target bot tidak ditemukan/tidak diisi
  const botToUse = targetBot || this.getAvailableBot(tenantId);

  if (!botToUse) {
    // ... handling error jika tidak ada bot sama sekali ...
    return undefined;
  }

  botToUse.socket.emit('task-dispatch', { taskId, ...dispatchTaskData });
  return botToUse.socket.id;
}
```

### Di `task-helper.service.ts`:
```typescript
async netflixResetPassword(taskId: string, tenantId: string, payload: NetflixResetPasswordPayload) {
  // ... proses fetch data ...

  // Ambil target_bot dari payload jika ada
  const targetBotName = payload.target_bot; 

  const clientId = await this.socketGateway.dispatchTask(taskId, tenantId, {
    module: 'netflix',
    type: 'resetPassword',
    payload: enrichedPayload,
  }, targetBotName); // <-- Kirim target bot name ke gateway
  
  // ...
}
```

---

## Sinkronisasi Sesi Cloud (Google Drive)
Karena kita sudah mengaktifkan **Opsi 1 (Google Drive Desktop Sync)**:
- Ketika bot di komputer kamu menjalankan tugas reload/upgrade, file *session* (`session_data/*.json`) dan SQLite database (`storage/database.sqlite`) di Google Drive komputermu akan ter-update.
- Aplikasi Google Drive Desktop akan otomatis menyinkronkan file ini ke cloud dalam hitungan detik.
- Mini PC dan laptop temanmu akan menerima pembaruan file ini secara otomatis di latar belakang, sehingga status login mereka tetap *sync* tanpa ada gangguan.

---

## Tanya & Jawab (Q&A) Alur Operasional

### 1. Apakah kita harus memilih bot-nya dulu di dashboard?
Ada dua pendekatan yang bisa kita terapkan (bisa dipakai salah satu atau keduanya):
- **Pendekatan Otomatis (Direkomendasikan)**: Dashboard secara otomatis mendeteksi siapa user yang sedang membuka dashboard. Misalnya, jika akun dashboard yang login adalah "Gilang", maka saat klik tombol "Reset Manual", sistem langsung mencocokkan target bot ke `"Komputer Gilang"`.
- **Pendekatan Manual (Dropdown)**: Di sebelah tombol trigger (atau di pengaturan dashboard), kita sediakan dropdown berisi daftar bot yang sedang online (misal: `[ ] Pilih Bot Pengeksekusi`). Jika tidak dipilih, dia akan otomatis memakai bot utama (Mini PC) secara default.

---

### 2. Apakah di Komputer Gilang cukup menyalakan modul Netflix saja?
**Betul sekali!** Kamu bebas mengatur modul apa saja yang aktif di masing-masing perangkat melalui `config.toml` masing-masing:

- **Di Mini PC (Bot Utama)**:
  Nyalakan semua modul (`shopee-order`, `netflix`, `duoke`) karena dia bertugas memproses semua orderan otomatis dan sinkronisasi berkala 24/7.
  
- **Di Komputer Gilang / Laptop Teman**:
  Jika komputer pribadimu hanya digunakan saat kamu sedang aktif memicu tugas manual (seperti *Reset Manual* atau *Login TV*), kamu **hanya perlu mendaftarkan modul `netflix`** di bagian `[[modules]]` pada `config.toml` lokalmu.
  
  Dengan begitu:
  1. Komputermu tidak akan ikut-ikutan menarik data orderan Shopee atau membalas chat Duoke secara otomatis (menghemat RAM dan internet).
  2. Saat ada request *Login TV* atau *Reset Manual* dari komputermu, server API akan mencari bot `"Komputer Gilang"`. Karena modul `netflix` menyala di komputermu, bot di komputermu akan mengambil tugas tersebut dan membukakan browser Playwright di layarmu.

---

### 3. Bagaimana jika Bot Pengeksekusi sedang offline?
Sistem akan memiliki **Fallback Logic**:
Jika di dashboard kamu meminta tugas dijalankan oleh `"Komputer Gilang"`, namun bot tersebut sedang mati/offline, server API akan otomatis mengalihkan tugas tersebut ke bot yang online dengan beban paling rendah (yaitu **Mini PC**). Jadi tugas tidak akan pernah menggantung atau hilang.

---

# Rencana Detail Implementasi Cara B: LocalStorage Perangkat

Berikut adalah rencana implementasi teknis secara lengkap dan mendalam (step-by-step) untuk mengimplementasikan desentralisasi bot menggunakan **Cara B (LocalStorage Perangkat)**.

---

## 1. Perubahan di Sisi API (Backend)

### A. Endpoint Baru untuk Mengambil Bot yang Aktif (`GET /socket/active-bots`)
Kita membutuhkan endpoint baru agar dashboard bisa mengambil daftar nama bot yang sedang online (terhubung ke Socket.io gateway).

- **Lokasi File**: `apps/api/src/modules/socket/socket.gateway.ts`
  Tambah method baru untuk mengambil semua koneksi ber-type `'BOT'`:
  ```typescript
  getActiveBots(tenantId: string): string[] {
    return Array.from(this.connections.values())
      .filter(c => c.tenant_id === tenantId && c.type === 'BOT')
      .map(c => c.name); // Mengambil appName (misal: "Mini PC", "Komputer Gilang")
  }
  ```
- **Lokasi File**: Buat controller baru atau tambahkan route ke controller yang ada (misal `apps/api/src/modules/socket/socket.controller.ts`) untuk mengekspos endpoint ini ke Dashboard.

### B. Menerima `target_bot` pada DTO Trigger Aksi
Kita perlu mengupdate DTO (Data Transfer Object) dari endpoint trigger aksi manual agar menerima property optional `target_bot`.

- **Endpoint yang terpengaruh**:
  1. `POST /account/:id/reset` (Reset Password)
  2. `POST /account/:id/reload` (Auto Reload)
  3. `POST /account/:id/upgrade` (Upgrade Premium)
  4. `POST /account/:id/login-tv` (Login TV)
- **Perubahan**: Pastikan DTO controller dapat menerima body `{ target_bot?: string }`.
- **Lokasi File**: `apps/api/src/modules/task-queue/task-queue.service.ts` atau Controller terkait. Simpan `target_bot` ini ke dalam JSON payload saat memasukkan task baru ke `task_queue`.
  ```typescript
  // Contoh saat membuat task reset password:
  const payload = {
    accountId: id,
    email: account.email,
    target_bot: body.target_bot, // Simpan target bot ke database task queue
  };
  ```

### C. Modifikasi Pemrosesan Task Worker (`task-worker.service.ts` & `task-helper.service.ts`)
- Saat worker menarik task dari antrean (antrean PostgreSQL/Redis), worker membaca `target_bot` dari payload JSON.
- `task-helper.service.ts` mengekstrak `target_bot` dan mengirimkannya ke `socketGateway.dispatchTask()`.
- Di `socket.gateway.ts`, `dispatchTask` diubah agar mendahulukan pencarian koneksi bot berdasarkan nama `target_bot`. Jika tidak ada atau offline, lakukan fallback ke `getAvailableBot()`.

---

## 2. Perubahan di Sisi Dashboard (Frontend)

### A. Service Aksi Manual (`account.service.ts`)
Update client API service di dashboard untuk menerima parameter `targetBot?: string` dan mengirimkannya dalam request body.

- **Lokasi File**: [account.service.ts](file:///e:/latihan coding/1volvecapital/volvecapital/apps/dashboard/src/services/account.service.ts#L719-L782)
- **Modifikasi**:
  ```typescript
  triggerReset: async (accountId: string, targetBot?: string): Promise<void> => {
    const response = await generateApiFetch(
      apiUrl,
      accessToken,
      tenantId,
      `/account/${accountId}/reset`,
      undefined,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ target_bot: targetBot }),
      },
    )
    // ... handling response
  }
  // Lakukan hal yang sama untuk triggerReload, triggerUpgrade, dan triggerLoginTv
  ```

### B. Komponen Dropdown Pemilihan Bot di Halaman Pengaturan (Setting)
Kita akan menambahkan opsi di halaman pengaturan dashboard agar pengguna bisa memilih bot lokal yang berjalan di komputernya.

- **Lokasi File**: `apps/dashboard/src/routes/dashboard/setting/index.tsx` (atau halaman konfigurasi yang sesuai)
- **Implementasi**:
  1. Panggil endpoint `GET /socket/active-bots` untuk mendapatkan daftar bot yang online.
  2. Tampilkan dropdown select: **"Pilih Perangkat Bot Lokal Kamu"**.
  3. Ketika dipilih (misal user memilih `"Komputer Gilang"`), simpan nilainya ke `localStorage`:
     ```typescript
     localStorage.setItem('local_target_bot', selectedBotName);
     ```
  4. Sediakan opsi `"Default (Mini PC / Beban Terendah)"` yang akan menyimpan nilai kosong/null ke `localStorage`.

### C. Mengirim `target_bot` dari Halaman Aksi
Setiap kali user menekan tombol aksi manual (seperti klik *Reset Password* di detail akun):
- Program akan membaca nilai dari `localStorage` terlebih dahulu:
  ```typescript
  const targetBot = localStorage.getItem('local_target_bot') || undefined;
  ```
- Nilai `targetBot` tersebut dikirim sebagai argumen kedua ke fungsi service:
  ```typescript
  await accountService.triggerReset(accountId, targetBot);
  ```

---

## 3. Verifikasi & Pengujian Alur

1. **Jalankan Bot di Dua Tempat**:
   - Bot Utama: `"Mini PC"` (modul Shopee, Netflix, Duoke aktif).
   - Bot Pribadi: `"Komputer Gilang"` (hanya modul Netflix aktif).
2. **Atur Dashboard di Komputer Gilang**:
   - Masuk ke dashboard, buka menu Setting.
   - Pilih **"Komputer Gilang"** pada dropdown bot lokal.
3. **Trigger Aksi**:
   - Di dashboard Komputer Gilang, buka salah satu akun Netflix dan klik **"Reset Password"**.
   - **Hasil yang Diharapkan**: Browser Playwright terbuka di layar **Komputer Gilang** untuk memproses reset. Mini PC tidak melakukan apa-apa.
   - **Sinkronisasi Sesi**: Setelah selesai, sesi baru disimpan ke `G:\My Drive\VolveBotData\session_data` dan secara otomatis tersinkronisasi kembali ke Mini PC.

