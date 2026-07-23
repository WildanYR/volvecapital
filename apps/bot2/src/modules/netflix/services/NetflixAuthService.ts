import { INetflixModuleContext } from "../interfaces/netflix-module.interface.js";
import type { Task } from "../../../types/task.type.js";
import { LOGIN_PATH, REQUEST_RESET_URL } from "../constants.js";
import { sanitizeEmail } from "../utils.js";
import { ResetPasswordEventData } from "../types/event.type.js";

// Locators
import {
  getLoginHelpAnchor,
  getCurrentPasswordInput,
} from "../locators/changePassword.js";
import { getRestartMembershipButton } from "../locators/reload.js";
import {
  getUserLoginIdInput,
  getContinueButton,
  getPinEntry,
  getRejoinText,
  getGetHelpText,
  getUsePasswordInsteadItem,
  getPasswordInput,
  getSignInButton,
  getLoginErrorCallout,
} from "../locators/manualLogin.js";
import {
  getEmailRadio,
  getEmailInput,
  getSendEmailButton,
  getResetErrorCallout,
} from "../locators/requestReset.js";
import { getNewPasswordInput } from "../locators/changePassword.js"; // or from manualLogin depending on logic

export class NetflixAuthService {
  constructor(private readonly ctx: INetflixModuleContext) {}

  async detectLoginState(page: any): Promise<"logged_in" | "not_logged_in"> {
    try {
      // Tunggu salah satu indikator muncul
      const result = await Promise.race([
        // Indikator Belum Login: Link Bantuan Login atau URL /login
        getLoginHelpAnchor(page).waitFor({ state: "visible", timeout: 10000 }).then(() => "not_logged_in" as const),
        page.waitForURL((url: any) => url.toString().includes(LOGIN_PATH), { timeout: 10000 }).then(() => "not_logged_in" as const),
        
        // Indikator Sudah Login: Tombol Restart, Input Password (halaman reset), Link Logout, atau Menu Akun
        getRestartMembershipButton(page).waitFor({ state: "visible", timeout: 10000 }).then(() => "logged_in" as const),
        getCurrentPasswordInput(page).waitFor({ state: "visible", timeout: 10000 }).then(() => "logged_in" as const),
        page.locator('a[href*="/logout"]').waitFor({ state: "visible", timeout: 10000 }).then(() => "logged_in" as const),
        page.locator('[data-uia="account-menu-item"], [data-uia="header-profile-link"]').waitFor({ state: "attached", timeout: 10000 }).then(() => "logged_in" as const),
      ]);
      return result;
    } catch (e) {
      // Jika timeout dan URL mengandung 'login', anggap belum login. Selain itu, anggap sudah login (mungkin di halaman internal).
      const currentUrl = page.url();
      return currentUrl.includes(LOGIN_PATH) ? "not_logged_in" : "logged_in";
    }
  }

  async attemptManualLogin(page: any, email: string, password?: string): Promise<boolean> {
      if (!password) return false;

      try {
          // 1. Input Email
          const emailInput = getUserLoginIdInput(page);
          this.ctx.logger.info(`[${email}] Menunggu kolom email login muncul...`);
          await emailInput.waitFor({ state: 'visible', timeout: 15000 });
          await this.ctx.sleep(1000);
          await emailInput.fill(email);
          await getContinueButton(page).click();

          // 2. Cek OTP / Get Help / Rejoin Screen (Polling 10 detik)
          const pinEntry = getPinEntry(page);
          const rejoinsText = getRejoinText(page);

          this.ctx.logger.info(`[${email}] Waiting for next screen (OTP or Rejoin)...`);
          let screenDetected: 'otp' | 'rejoin' | 'timeout' = 'timeout';
          
          for (let i = 0; i < 20; i++) { // Check setiap 500ms selama 10 detik
              if (await pinEntry.isVisible()) {
                  screenDetected = 'otp';
                  break;
              }
              if (await rejoinsText.isVisible()) {
                  screenDetected = 'rejoin';
                  break;
              }
              await this.ctx.sleep(500);
          }

          if (screenDetected === 'otp' || screenDetected === 'rejoin') {
              this.ctx.logger.info(`[${email}] ${screenDetected.toUpperCase()} screen detected!`);
              
              if (screenDetected === 'rejoin') {
                  this.ctx.logger.info(`[${email}] Mendeteksi tombol 'kirim ulang' berhasil.`);
              }

              // Klik Expand 'Dapatkan Bantuan'
              const getHelp = getGetHelpText(page);
              if (await getHelp.isVisible()) {
                  await getHelp.click();
                  this.ctx.logger.info(`[${email}] Tombol 'Dapatkan Bantuan' berhasil diklik.`);
                  await this.ctx.sleep(1500); // Tunggu menu expand
              } else {
                  this.ctx.logger.warn(`[${email}] Tombol 'Dapatkan Bantuan' tidak terlihat.`);
              }

              // Klik 'Gunakan Sandi'
              const usePwBtn = getUsePasswordInsteadItem(page);
              if (await usePwBtn.isVisible()) {
                  await usePwBtn.click();
                  this.ctx.logger.info(`[${email}] Tombol 'Gunakan sandi' berhasil diklik. Menunggu form password muncul...`);
                  
                  // Tunggu sampai form password benar-benar stabil
                  const pwInput = getPasswordInput(page);
                  try {
                    await pwInput.waitFor({ state: 'visible', timeout: 15000 });
                    await this.ctx.sleep(2000); // Buffer tambahan agar input siap
                  } catch (e) {
                    this.ctx.logger.warn(`[${email}] Form password tidak muncul setelah klik 'Gunakan sandi'.`);
                    return false;
                  }
              } else {
                  this.ctx.logger.warn(`[${email}] Tombol 'Gunakan sandi' tidak terlihat setelah klik bantuan.`);
                  return false;
              }
          } else {
              this.ctx.logger.info(`[${email}] Neither OTP nor Rejoin screen detected, checking if direct password input available...`);
              await this.ctx.sleep(5000);
          }

          // 3. Input Password (Coba 2x jika gagal sekali)
          for (let attempt = 1; attempt <= 2; attempt++) {
              this.ctx.logger.info(`[${email}] Mencoba input password (Attempt ${attempt})...`);
              
              const currentUrl = page.url();
              if (currentUrl.includes('/browse') || currentUrl.includes('/account') || currentUrl.includes('/YourAccount') || currentUrl.includes('/profiles') || (currentUrl === 'https://www.netflix.com/' && !currentUrl.includes('login'))) {
                  this.ctx.logger.info(`[${email}] Terdeteksi sudah login via URL: ${currentUrl}`);
                  return true;
              }

              const pwInput = getPasswordInput(page);
              try {
                  await pwInput.waitFor({ state: 'visible', timeout: 10000 });
                  
                  // Pastikan elemen bisa diinteraksi
                  await pwInput.scrollIntoViewIfNeeded();
                  await pwInput.click({ timeout: 5000 }); 
                  await pwInput.fill(password);
                  await this.ctx.sleep(1500); 
              } catch (e) {
                  this.ctx.logger.warn(`[${email}] Gagal berinteraksi dengan input password pada attempt ${attempt}.`);
                  if (attempt === 2) return false;
                  await this.ctx.sleep(3000);
                  continue;
              }

              const signInBtn = getSignInButton(page);
              try {
                  await signInBtn.waitFor({ state: 'visible', timeout: 5000 });
                  if (await signInBtn.isEnabled()) {
                      await signInBtn.click();
                  } else {
                      await pwInput.press('Enter');
                  }
              } catch (e) {
                  await pwInput.press('Enter');
              }
              
              this.ctx.logger.info(`[${email}] Klik login selesai, menunggu respon status...`);
              await this.ctx.sleep(5000);

              
              // Cek apakah login sukses dengan fungsi detectLoginState
              const loginState = await this.detectLoginState(page);
              if (loginState === 'logged_in') {
                  this.ctx.logger.info(`[${email}] Berhasil login secara manual!`);
                  return true;
              }

              const finalUrl = page.url();
              if (finalUrl.includes('/browse') || finalUrl.includes('/account') || finalUrl.includes('/YourAccount') || finalUrl.includes('/password') || finalUrl.includes('/profiles')) {
                  return true;
              }

              const error = getLoginErrorCallout(page);
              if (await error.isVisible()) {
                  const errorMsg = await error.innerText();
                  this.ctx.logger.warn(`[${email}] Login attempt ${attempt} failed: ${errorMsg}`);
                  if (attempt === 2) return false;
                  await this.ctx.sleep(5000);
              }
          }
          
          return false;
      } catch (err) {
          this.ctx.logger.error(`[${email}] Error during manual login attempt: ${err instanceof Error ? err.message : String(err)}`);
          return false;
      }
  }

  async handleFallbackLoginViaReset(page: any, task: Task, email: string): Promise<boolean> {
    this.ctx.logger.info(`[FallbackLogin][${email}] Menjalankan alur permintaan link reset...`);
    
    const eventName = `${sanitizeEmail(email)}:NETFLIX_REQ_RESET_PASSWORD`;
    this.ctx.eventBus.emit('socket:subscribe', eventName);

    // Mulai listen event SEBELUM kirim request ke Netflix
    const eventPromise = this.ctx.waitForTaskEvent<ResetPasswordEventData>(
      task.id,
      eventName,
    );

    try {
        let emailRequested = false;
        for (let attempt = 1; attempt <= 2; attempt++) {
            await page.goto(REQUEST_RESET_URL);
            await this.ctx.sleep(1000);

            await getEmailRadio(page).click();
            await getEmailInput(page).fill(email);
            await getSendEmailButton(page).click();
            
            this.ctx.logger.info(`[FallbackLogin][${email}] Attempt ${attempt}: Menunggu respon Netflix...`);

            const errorCallout = getResetErrorCallout(page).first();
            try {
                await errorCallout.waitFor({ state: 'visible', timeout: 8000 });
                this.ctx.logger.warn(`[FallbackLogin][${email}] Netflix menolak permintaan reset: "${await errorCallout.innerText()}"`);
                if (attempt === 1) {
                  this.ctx.logger.info(`[FallbackLogin][${email}] Membersihkan cookies dan mencoba lagi...`);
                  await page.goto("https://www.netflix.com/clearcookies");
                  await this.ctx.sleep(2000);
                  continue;
                }
            } catch (e) {
                // Tidak ada error, berarti email terkirim
                emailRequested = true;
                break;
            }
        }

        if (!emailRequested) return false;

        this.ctx.logger.info(`[FallbackLogin][${email}] Email reset terkirim, menunggu link dari GAS (60s timeout)...`);

        // Tunggu promise yang sudah kita buat di awal
        const eventData = await eventPromise;

        const resetLink = eventData.data;
        this.ctx.logger.info(`[FallbackLogin][${email}] Link reset diterima! Menavigasi untuk mendapatkan sesi...`);

        await page.goto(resetLink);
        
        // Tunggu sampai mendarat di halaman ganti password (ini berarti sudah login)
        await getNewPasswordInput(page).waitFor({ state: "visible", timeout: 20000 });
        this.ctx.logger.info(`[FallbackLogin][${email}] Sesi login berhasil didapatkan melalui link reset.`);
        
        return true;
    } catch (err) {
        this.ctx.logger.error(`[FallbackLogin][${email}] Gagal: ${err instanceof Error ? err.message : String(err)}`);
        return false;
    } finally {
        this.ctx.eventBus.emit('socket:unsubscribe', eventName);
    }
  }

  async handleSessionRecovery(page: any, task: Task, email: string): Promise<void> {
    this.ctx.logger.info(`[SessionRecovery][${email}] Mencoba memulihkan sesi via link reset...`);
    
    const eventName = `${sanitizeEmail(email)}:NETFLIX_REQ_RESET_PASSWORD`;
    this.ctx.eventBus.emit('socket:subscribe', eventName);

    try {
      await page.goto(REQUEST_RESET_URL);
      await getEmailRadio(page).click();
      await getEmailInput(page).fill(email);
      await getSendEmailButton(page).click();
      
      this.ctx.logger.info(`[SessionRecovery][${email}] Waiting for reset link event...`);
      const eventData = await this.ctx.waitForTaskEvent<ResetPasswordEventData>(task.id, eventName);
      const resetLink = eventData.data;

      this.ctx.logger.info(`[SessionRecovery][${email}] Received link, navigating to recover session...`);
      await page.goto(resetLink);
      
      // Tunggu sampai redirect ke browse atau account (tanda sudah login)
      await this.ctx.sleep(5000);
      const loginState = await this.detectLoginState(page);
      if (loginState !== 'logged_in') {
        this.ctx.logger.warn(`[SessionRecovery][${email}] Clicked link but state is still not_logged_in.`);
      }
    } finally {
      this.ctx.eventBus.emit('socket:unsubscribe', eventName);
    }
  }
}
