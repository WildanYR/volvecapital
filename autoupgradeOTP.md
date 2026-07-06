# Implementasi Cek OTP untuk Auto Upgrade Netflix

Berikut adalah blok kode yang disesuaikan dengan sistem `eventBus` dan `waitForTaskEvent` (seperti pada proses lupa sandi). Sisipkan kode ini tepat sebelum `STEP 4: Konfirmasi Upgrade` di file `apps/bot2/src/modules/netflix/NetflixModule.ts`.

```typescript
      // STEP 3.5: Cek apakah ada tantangan OTP sebelum konfirmasi
      this.logger.info(`[AutoUpgrade][${email}] Mengecek apakah diperlukan verifikasi OTP...`);
      
      const mfaEmailBtn = page.locator('div[data-uia="account-mfa-button-OTP_EMAIL"]');
      const isOtpRequired = await mfaEmailBtn.isVisible({ timeout: 5000 }).catch(() => false);

      if (isOtpRequired) {
        this.logger.info(`[AutoUpgrade][${email}] Tantangan OTP terdeteksi. Melakukan klik opsi Email...`);
        await mfaEmailBtn.click();
        await this.sleep(1500);

        // Klik tombol Kirim
        this.logger.info(`[AutoUpgrade][${email}] Mengklik tombol Kirim OTP...`);
        const sendBtn = page.locator('button[data-uia="collect-input-submit-cta"]');
        await sendBtn.waitFor({ state: 'visible', timeout: 5000 });
        await sendBtn.click();
        
        // Menunggu kode OTP via socket event
        const otpEventName = `${sanitizeEmail(email)}:NETFLIX_OTP`;
        this.eventBus.emit('socket:subscribe', otpEventName);
        this.logger.info(`[AutoUpgrade][${email}] Menunggu OTP dari email (Filter: Verification Code)...`);
        
        let otpCode = '';
        try {
            // Kita tunggu sampai mendapatkan subject yang benar (Whitelist)
            while (!otpCode) {
                // Pastikan variabel 'task.id' tersedia di dalam scope function ini, 
                // jika tidak, sesuaikan dengan variabel identifier task yang Anda gunakan.
                const eventData = await this.waitForTaskEvent<any>(task.id, otpEventName);
                const subject = (eventData.subject || "").toLowerCase();
                
                this.logger.info(`[AutoUpgrade][${email}] Menerima email untuk OTP dengan subject: "${eventData.subject}"`);

                if (subject.includes("your verification code") || subject.includes("kode verifikasimu")) {
                    otpCode = eventData.data;
                    this.logger.info(`[AutoUpgrade][${email}] OTP VALID ditemukan: ${otpCode}. Memasukkan kode...`);
                } else if (subject.includes("kode masukmu") || subject.includes("login code")) {
                    this.logger.warn(`[AutoUpgrade][${email}] Subject "${eventData.subject}" diabaikan (Email Login Link). Menunggu email OTP Verifikasi yang benar...`);
                    // Loop berlanjut, waitForTaskEvent akan menunggu event socket berikutnya
                } else {
                    this.logger.warn(`[AutoUpgrade][${email}] Subject "${eventData.subject}" tidak sesuai kriteria. Menunggu email OTP...`);
                }
            }

            // Memasukkan kode OTP ke dalam input
            const otpInput = page.locator('input[data-uia="collect-otp-input-entry"]');
            await otpInput.waitFor({ state: 'visible', timeout: 15000 });
            await otpInput.fill(otpCode);
            await this.sleep(1000);

            // Mengklik label/tombol submit sesuai alur yang diminta
            const submitEmailLabel = page.locator('div[data-uia="account-mfa-button-OTP_EMAIL+label"]');
            if (await submitEmailLabel.isVisible().catch(() => false)) {
                await submitEmailLabel.click();
                await this.sleep(3000);
            }
        } catch (error) {
            this.logger.error(`[AutoUpgrade][${email}] Gagal saat memproses OTP: ${error.message}`);
            throw error;
        }
      }

      // STEP 4: Konfirmasi Upgrade (Halaman Final)
      // Tombol dari DOM: <button data-uia="action-button">Confirm</button>
```

**Catatan**: 
- Pastikan method `sanitizeEmail` sudah di-import atau dapat diakses di bagian ini.
- Variabel `task.id` pada `waitForTaskEvent(task.id, otpEventName)` perlu dipastikan sudah ada di dalam function _auto upgrade_ tersebut. Jika menggunakan nama variabel lain (misalnya `job.id`), silakan diubah.
