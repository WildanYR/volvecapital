# Implementasi Login TV (Sederhana via Token)

Berikut adalah modifikasi untuk fungsi `loginTvFlow` di file `apps/bot2/src/modules/netflix/NetflixModule.ts` agar menggunakan link langsung `https://www.netflix.com/tv9?nftoken=...` sesuai dengan permintaan Anda. 

Pendekatan ini akan menghapus kebutuhan untuk memvalidasi halaman `/account` dan percobaan login manual, dan jika cookie ternyata *expired*/tidak valid (bot dilempar ke halaman login biasa), bot akan langsung memunculkan peringatan untuk import cookies manual.

Ganti blok fungsi `async loginTvFlow(task: Task): Promise<void> { ... }` (di sekitar baris 1321) dengan kode di bawah ini:

```typescript
  /**
   * Login TV Flow Sederhana Menggunakan Token
   */
  async loginTvFlow(task: Task): Promise<void> {
    const payload = task.payload as any;
    // Pastikan Anda sudah mengirimkan nftoken dari Dashboard/API ke dalam task payload
    const { email, accountId, nftoken } = payload; 
    const contextName = sanitizeEmail(email);

    this.logTvProgress(task, accountId, email, "Memulai proses login TV dengan Token...");

    const context = await this.getOrCreateContext(contextName);
    const page = await context.newPage();

    try {
      if (!nftoken) {
        this.eventBus.emit('socket:bot-tv-pin-error', {
          taskId: task.id,
          message: "Token (nftoken) tidak tersedia. Gagal login TV.",
        });
        throw new Error("Token (nftoken) tidak ditemukan di payload.");
      }

      // 1. Navigasi langsung menggunakan URL tv9 dan nftoken
      const tvLink = `https://www.netflix.com/tv9?nftoken=${nftoken}`;
      this.logTvProgress(task, accountId, email, "Navigasi langsung ke halaman input kode TV...");
      
      await page.goto(tvLink);
      await this.sleep(3000);

      // 2. Deteksi apakah cookies valid (jika tidak valid biasanya dilempar ke form login)
      const loginState = await this.detectLoginState(page);
      if (loginState === "not_logged_in") {
        this.eventBus.emit('socket:bot-tv-pin-error', {
          taskId: task.id,
          message: "Cookies tidak valid silahkan import cookies manual terlebih dahulu",
        });
        throw new Error("Cookies tidak valid, sesi login ditolak.");
      }

      // 3. Tunggu elemen input PIN muncul
      this.logTvProgress(task, accountId, email, "Menunggu form PIN muncul di netflix.com/tv9...");
      await page.waitForSelector(TV_LOGIN_LOCATORS.PIN_INPUTS, { timeout: 30000 });

      // 4. Beritahu Dashboard bahwa Bot siap menerima PIN (Loop hingga 3x)
      let maxRetries = 3;
      
      for (let attempt = 1; attempt <= maxRetries; attempt++) {
        // Jika ini retry, reload halaman TV9
        if (attempt > 1) {
          this.logTvProgress(task, accountId, email, `Mereload halaman untuk percobaan ke-${attempt}...`);
          await page.goto(tvLink);
          await this.sleep(3000);
        }

        this.eventBus.emit('socket:bot-awaiting-tv-pin', {
          taskId: task.id,
          accountId,
        });

        // 5. Tunggu PIN dari Dashboard (Timeout 5 menit)
        const pinEventName = `${this.instanceId}:dashboard-send-tv-pin`;
        this.logTvProgress(task, accountId, email, `Menunggu PIN dari dashboard [Attempt ${attempt}/${maxRetries}]...`);
        
        const pinData = await this.waitForTaskEvent<{ pin: string }>(task.id, pinEventName);
        const pin = pinData.pin;

        if (!pin || pin.length !== 8) {
          if (attempt === maxRetries) {
            throw new Error("PIN yang diterima tidak valid (harus 8 digit)");
          } else {
            this.logTvProgress(task, accountId, email, "PIN tidak valid. Mengulangi...");
            continue;
          }
        }

        this.logTvProgress(task, accountId, email, `PIN diterima. Memasukkan PIN ke Netflix...`);

        // 6. Masukkan PIN satu per satu
        const inputs = page.locator(TV_LOGIN_LOCATORS.PIN_INPUTS);
        for (let i = 0; i < 8; i++) {
          await inputs.nth(i).click();
          await page.keyboard.type(pin[i], { delay: 150 });
        }

        await this.sleep(1000);
        await page.locator(TV_LOGIN_LOCATORS.SUBMIT_BUTTON).click();
        this.logTvProgress(task, accountId, email, "PIN disubmit, menunggu verifikasi...");

        // 7. Tunggu hasil (Redirect ke success atau Error atau Re-login)
        try {
          await Promise.race([
            page.waitForURL(url => url.toString().includes('/tv/out/success'), { timeout: 30000 }),
            page.waitForSelector(TV_LOGIN_LOCATORS.ERROR_MESSAGE, { timeout: 30000 }),
            page.waitForURL(url => url.toString().includes(LOGIN_PATH), { timeout: 30000 }),
          ]);
        } catch (e) {
          this.logger.warn(`[LoginTV][${email}] Timeout menunggu verifikasi PIN. Memeriksa URL saat ini...`);
        }

        // 8. Cek apakah cookies dianggap expired/minta login setelah input PIN
        if (page.url().includes(LOGIN_PATH)) {
          this.eventBus.emit('socket:bot-tv-pin-error', {
            taskId: task.id,
            message: "Cookies tidak valid silahkan import cookies manual terlebih dahulu",
          });
          throw new Error("Diminta login ulang (Cookies kadaluarsa).");
        }

        // 9. Berhasil
        if (page.url().includes('/tv/out/success')) {
          this.logTvProgress(task, accountId, email, "Login TV Berhasil! Memfinalisasi...");
          
          const finalBtn = page.locator(TV_LOGIN_LOCATORS.GO_TO_NETFLIX_BUTTON);
          if (await finalBtn.isVisible()) {
            await finalBtn.click();
            await this.sleep(2000);
          }

          this.eventBus.emit('socket:bot-tv-pin-success', {
            taskId: task.id,
            accountId,
          });
          this.logTvProgress(task, accountId, email, "Proses Login TV selesai sepenuhnya.");
          
          await context.close();
          return;
        }

        // Jika sampai sini berarti ada pesan error PIN salah
        this.logTvProgress(task, accountId, email, "Kode TV salah atau kadaluarsa, silakan kirim ulang kode terbaru.");
        this.eventBus.emit('socket:bot-tv-pin-error', {
          taskId: task.id,
          message: "Kode TV yang Anda masukkan salah atau sudah kedaluwarsa. Silakan periksa kembali kode terbaru di TV Anda.",
        });
      }

      throw new Error("Gagal login TV setelah 3 percobaan.");
    } catch (error) {
      this.logger.error(`[LoginTV][${email}] Terjadi kesalahan: ${(error as Error).message}`);
      
      this.eventBus.emit('socket:bot-tv-pin-error', {
        taskId: task.id,
        message: `Terjadi kesalahan saat login TV: ${(error as Error).message}`,
      });
      
      await context.close();
      throw error;
    }
  }
```

### Catatan Tambahan:
1. Pastikan bagian yang mengirim/men-trigger antrean `loginTvFlow` (kemungkinan dari backend API atau `Connector.ts`) **sudah menyelipkan** properti `nftoken` ke dalam `payload` agar terbaca oleh Bot.
2. Saat file `apps/bot2/src/modules/netflix/NetflixModule.ts` diedit, pastikan Anda juga mengecek konstanta `TV_LOGIN_LOCATORS` karena form dari `/tv9` kemungkinan besar struktur HTML-nya sama dengan `/tv2`, namun patut dipastikan tidak ada pembaruan selektor.
