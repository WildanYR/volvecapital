# Implementasi WhatsApp Web JS di `apps/bot2`

Menjawab pertanyaan Anda: **Ya, Anda bisa menambahkannya sebagai "Module" di dalam `apps/bot2` yang sudah ada, atau membuat aplikasi bot baru yang terpisah.**

Karena Anda sudah memiliki `apps/bot2` yang berjalan (yang tampaknya juga sudah tersinkron dengan Google Drive untuk `session_data`), mengintegrasikan WA sebagai module tambahan di sana adalah pilihan yang masuk akal dan menghemat *resource* *server* daripada membuat service baru dari nol. 

Namun perlu diingat: `whatsapp-web.js` secara default menggunakan **Puppeteer** di balik layar (bukan Playwright). Library ini akan menjalankan satu instance browser Chromium *headless* lagi. Jika `bot2` Anda saat ini menggunakan Playwright, berarti nanti akan ada Chromium (dari Playwright) dan Chromium (dari Puppeteer) yang berjalan bersamaan di satu *service*. Pastikan RAM komputer/VPS Anda cukup (minimal sisa 300MB - 500MB).

Berikut adalah panduan implementasinya sebagai modul di dalam `apps/bot2` Anda yang sudah ada:

---

## 1. Instalasi Library di `apps/bot2`

Masuk ke root proyek (volvecapital) dan install library tersebut khusus ke dalam *package* `bot2`.

```bash
pnpm --filter @volvecapital/bot2 add whatsapp-web.js qrcode-terminal
pnpm --filter @volvecapital/bot2 add -D @types/qrcode-terminal
```

---

## 2. Membuat Module WhatsApp di `apps/bot2`

Di dalam folder `apps/bot2/src/`, buat satu file baru khusus untuk menangani WhatsApp (misalnya `apps/bot2/src/whatsapp.module.ts` atau `apps/bot2/src/services/whatsapp.ts`).

```typescript
import { Client, LocalAuth } from 'whatsapp-web.js';
import * as qrcode from 'qrcode-terminal';

export class WhatsappService {
  private client: Client;

  constructor() {
    // 💡 SANGAT PRAKTIS: 
    // Anda bisa arahkan dataPath ini ke folder Google Drive Desktop 
    // atau ke folder session_data yang sudah biasa disinkronisasi oleh bot Anda
    const googleDrivePath = 'G:/My Drive/session_data_wa'; 

    this.client = new Client({
      authStrategy: new LocalAuth({
        dataPath: googleDrivePath
      }),
      puppeteer: {
        args: ['--no-sandbox', '--disable-setuid-sandbox'],
      }
    });

    this.initializeEvents();
  }

  private initializeEvents() {
    this.client.on('qr', (qr) => {
      console.log('SCAN QR CODE INI DENGAN WHATSAPP ANDA:');
      qrcode.generate(qr, { small: true });
    });

    this.client.on('ready', () => {
      console.log('✅ Module WhatsApp sudah SIAP dan terhubung!');
    });

    this.client.on('authenticated', () => {
      console.log('✅ WhatsApp berhasil terotentikasi (Sesi di GDrive)!');
    });

    this.client.on('auth_failure', (msg) => {
      console.error('❌ Otentikasi gagal:', msg);
    });

    this.client.on('disconnected', (reason) => {
      console.log('❌ WhatsApp terputus:', reason);
    });
  }

  public async start() {
    console.log('Memulai inisialisasi Module WhatsApp...');
    await this.client.initialize();
  }

  public async sendMessage(to: string, message: string): Promise<void> {
    try {
      const formattedNumber = `${to}@c.us`; 
      await this.client.sendMessage(formattedNumber, message);
      console.log(`Pesan berhasil dikirim ke ${to}`);
    } catch (error) {
      console.error(`Gagal mengirim pesan ke ${to}:`, error);
      throw error;
    }
  }
}
```

---

## 3. Menjalankan Module Bersama Bot Utama (`apps/bot2/src/index.ts`)

Sekarang, Anda hanya perlu memanggil (menginisialisasi) module WhatsApp ini di file utama bot Anda (`apps/bot2/src/index.ts` atau `main.ts`).

Contoh penggabungannya:

```typescript
// apps/bot2/src/index.ts
import { WhatsappService } from './whatsapp.module';
// import { ExistingBotEngine } from './existing-engine'; // (bot Anda yang lama)

async function bootstrap() {
  // 1. Jalankan Bot Anda yang sudah ada
  // const myBot = new ExistingBotEngine();
  // await myBot.start();

  // 2. Jalankan Module WhatsApp
  const waService = new WhatsappService();
  await waService.start();

  // (Opsional) Export waService jika Anda butuh mengaksesnya dari file worker/queue
  return { waService };
}

bootstrap();
```

---

## 4. Menghubungkan API Utama dengan Bot (via Message Queue)

Jika pelanggan menekan tombol "Beli" di web, API NestJS (`apps/api`) yang akan menerimanya. Karena API dan `bot2` adalah dua program yang berbeda, API harus menitipkan tugas kirim pesan lewat **Message Queue (Redis / BullMQ)**.

1. **Di `apps/api` (Saat Pembayaran Berhasil):**
   ```typescript
   // apps/api/src/modules/transaction/transaction.service.ts
   await this.queueService.addJob('send_wa_message', {
     phoneNumber: '62812xxxxxx',
     message: 'Halo, ini kode voucher Anda: VOLVE-XYZ123'
   });
   ```

2. **Di `apps/bot2` (Mendengarkan Antrean Queue):**
   Di dalam `bot2`, tambahkan *Worker* yang mendengarkan `wa-queue`:
   ```typescript
   import { Worker } from 'bullmq';
   // import waService dari bootstrap di atas

   const worker = new Worker('wa-queue', async job => {
     if (job.name === 'send_wa_message') {
       const { phoneNumber, message } = job.data;
       await waService.sendMessage(phoneNumber, message);
     }
   }, { connection: { host: 'localhost', port: 6379 } });
   ```

### Kenapa Cara Ini Direkomendasikan?
1. **Performa API Terjaga:** *Request* beli voucher tidak perlu menunggu Chromium (yang sangat lambat) untuk mengetik pesan. API langsung respon "Sukses".
2. **Reliability:** Jika `bot2` mati karena pemadaman listrik di rumah, pesan akan menumpuk aman di Redis. Begitu `bot2` dinyalakan kembali, pesan-pesan tersebut akan langsung dikirim otomatis.

---

## Kesimpulan Sinkronisasi (Google Drive Desktop)

Dengan menggunakan aplikasi **Google Drive Desktop**, Anda hanya perlu menunjuk `dataPath: 'G:/My Drive/SesiBotWA'` pada langkah 2.
- Saat Anda menyalakan `bot2` di PC Anda dan men-scan QR, foldernya akan terbentuk di `G:`.
- Google Drive akan meng-uploadnya ke Cloud.
- Saat teman Anda menyalakan PC-nya, Google Drive-nya akan otomatis men-download sesi terbaru tersebut.
- Saat ia menjalankan `bot2`, bot akan membaca folder lokal tersebut dan langsung bisa dipakai mengirim pesan **tanpa scan QR ulang**.
- *(Ingat: Jangan jalankan `bot2` di dua PC secara bersamaan untuk menghindari konflik sesi WhatsApp).*
