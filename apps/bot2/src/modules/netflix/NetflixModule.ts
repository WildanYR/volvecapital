/**
 * Netflix Module — Reset Password & Auto Reload
 */

import { BaseModule } from "../../core/BaseModule.js";
import type { ModuleDependencies } from "../../types/module.type.js";
import type { ModuleConfig } from "../../types/config.type.js";
import type { Task } from "../../types/task.type.js";
import {
  CHANGE_PASSWORD_URL,
  REQUEST_RESET_URL,
  LOGIN_PATH,
  MEMBERSHIP_URL,
  CANCEL_PLAN_URL,
  PLAN_MOBILE_ID,
  PLAN_STANDARD_ID,
} from "./constants.js";
import { sanitizeEmail } from "./utils.js";
import { ResetPasswordPayload, AutoReloadPayload } from "./types/payload.type.js";
import { ResetPasswordEventData } from "./types/event.type.js";

// Locators — Change Password
import {
  getLoginHelpAnchor,
  getCurrentPasswordInput,
  getNewPasswordInput,
  getConfirmNewPasswordInput,
  getLogAllDevicesCheckbox,
  getSubmitButton,
  getCurrentPasswordError,
  getGenericErrorAlert,
  getMfaEmailButton,
  getOtpInput,
  getOtpSubmitButton,
} from "./locators/changePassword.js";
import {
  getEmailRadio,
  getEmailInput,
  getSendEmailButton,
  getResetErrorCallout,
} from "./locators/requestReset.js";
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
} from "./locators/manualLogin.js";

// Locators — Auto Reload
import {
  getRestartMembershipButton,
  getExpandCancelButton,
  getFinishCancellationButton,
  getRestartHeroButton,
  getWelcomeBackHeading,
  getNextButton,
  getMobilePlanLabel,
  getStandardPlanLabel,
  getNextPlanButton,
  getLastStepHeading,
  getLastStepNextButton,
  getLegalCheckbox,
  getConfirmStartButton,
  getOrderFinalButton,
} from "./locators/reload.js";

import { updateNetflixAccountStatus, updateNetflixReloadStatus, notifyTopupPending } from "./api.js";

export class NetflixModule extends BaseModule {
  constructor(
    deps: ModuleDependencies,
    instanceId: string,
    config: ModuleConfig,
  ) {
    super(deps, instanceId, config);
  }

  async setupSchema(): Promise<void> {
    this.logger.info("NetflixModule schema setup (no-op)");
  }

  async init(): Promise<void> {
    this.setRunning(true);
    this.logger.info("NetflixModule initialized");
  }

  async stop(): Promise<void> {
    await this.cleanup();
    this.logger.info("NetflixModule stopped");
  }

  async resetPassword(task: Task): Promise<void> {
    const payload = task.payload as unknown as ResetPasswordPayload;
    const email = payload.email;
    const password = payload.password;
    let newPassword = payload.newPassword;

    // Jika API tidak mengirim password baru, Bot buat sendiri (V3 Logic: 6 char, lower + numbers)
    if (!newPassword || newPassword.trim() === "") {
        newPassword = this.generateRandomPassword(6);
        this.logger.info(`No password provided from API, generated new one: ${newPassword}`);
    }

    const contextName = `${sanitizeEmail(email)}`;
    this.logger.info(
      `Starting reset password for ${email} with context ${contextName}`,
    );

    const context = await this.getOrCreateContext(contextName);
    const page = await context.newPage();

    try {
      await page.goto(CHANGE_PASSWORD_URL);
      this.logger.info(`[${email}] Checking auth state...`);

      let loginState = await this.detectLoginState(page);

      // 2. Jika Belum Login, Coba Login Manual Dulu
      if (loginState === "not_logged_in") {
          this.logger.info(`[${email}] Not logged in, attempting manual login with existing password...`);
          const loginSuccess = await this.attemptManualLogin(page, email, password);
          
          if (loginSuccess) {
              this.logger.info(`[${email}] Manual login successful, proceeding to change password`);
              await page.goto(CHANGE_PASSWORD_URL);
              loginState = await this.detectLoginState(page);
          } else {
              this.logger.info(`[${email}] Manual login failed or not possible, falling back to email reset`);
          }
      }

      // 3. Skenario Reset / Change
      if (loginState === "not_logged_in") {
        await this.handleEmailResetFlow(page, task, email, newPassword);
      } else {
        const changeSuccess = await this.handleChangePasswordFlow(page, task, email, newPassword, password);
        if (!changeSuccess) {
            await this.handleEmailResetFlow(page, task, email, newPassword);
        }
      }

      await this.handlePostSubmission(page, email);
      this.logger.info(`[${email}] Password reset/change submitted successfully`);

      // 5. Update Status ke API (V3 Logic)
      const { status, reason } = this.calculateAccountState(payload.subscription_expiry);
      const variantName = payload.variant_name || '';
      const shouldSwitch = variantName.toLowerCase() !== 'harian' && variantName !== '';
      const variantLog = shouldSwitch ? `SWITCHED (${variantName} -> Harian)` : "TETAP (Harian)";

      this.logger.info(`RESET SUKSES | Email: ${email} | Pass: ${newPassword} | Status: ${status.toUpperCase()} (${reason}) | Variant: ${variantLog}`);

      await updateNetflixAccountStatus(
        this.apiBaseUrl,
        this.authCredentials,
        payload.accountId,
        newPassword,
        status,
        shouldSwitch
      );

    } catch (error) {
      await this.handleTaskError(error, email, newPassword);
      throw error; 
    } finally {
      await this.cleanupTask(page, contextName);
    }
  }

  private async detectLoginState(page: any): Promise<"logged_in" | "not_logged_in"> {
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

  private async attemptManualLogin(page: any, email: string, password?: string): Promise<boolean> {
      if (!password) return false;

      try {
          // 1. Input Email
          const emailInput = getUserLoginIdInput(page);
          this.logger.info(`[${email}] Menunggu kolom email login muncul...`);
          await emailInput.waitFor({ state: 'visible', timeout: 15000 });
          await this.sleep(1000);
          await emailInput.fill(email);
          await getContinueButton(page).click();

          // 2. Cek OTP / Get Help / Rejoin Screen (Polling 10 detik)
          const pinEntry = getPinEntry(page);
          const rejoinsText = getRejoinText(page);

          this.logger.info(`[${email}] Waiting for next screen (OTP or Rejoin)...`);
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
              await this.sleep(500);
          }

          if (screenDetected === 'otp' || screenDetected === 'rejoin') {
              this.logger.info(`[${email}] ${screenDetected.toUpperCase()} screen detected!`);
              
              if (screenDetected === 'rejoin') {
                  this.logger.info(`[${email}] Mendeteksi tombol 'kirim ulang' berhasil.`);
              }

              // Klik Expand 'Dapatkan Bantuan'
              const getHelp = getGetHelpText(page);
              if (await getHelp.isVisible()) {
                  await getHelp.click();
                  this.logger.info(`[${email}] Tombol 'Dapatkan Bantuan' berhasil diklik.`);
                  await this.sleep(1500); // Tunggu menu expand
              } else {
                  this.logger.warn(`[${email}] Tombol 'Dapatkan Bantuan' tidak terlihat.`);
              }

              // Klik 'Gunakan Sandi'
              const usePwBtn = getUsePasswordInsteadItem(page);
              if (await usePwBtn.isVisible()) {
                  await usePwBtn.click();
                  this.logger.info(`[${email}] Tombol 'Gunakan sandi' berhasil diklik. Menunggu form password muncul...`);
                  
                  // Tunggu sampai form password benar-benar stabil
                  const pwInput = getPasswordInput(page);
                  try {
                    await pwInput.waitFor({ state: 'visible', timeout: 15000 });
                    await this.sleep(2000); // Buffer tambahan agar input siap
                  } catch (e) {
                    this.logger.warn(`[${email}] Form password tidak muncul setelah klik 'Gunakan sandi'.`);
                    return false;
                  }
              } else {
                  this.logger.warn(`[${email}] Tombol 'Gunakan sandi' tidak terlihat setelah klik bantuan.`);
                  return false;
              }
          } else {
              this.logger.info(`[${email}] Neither OTP nor Rejoin screen detected, checking if direct password input available...`);
              await this.sleep(5000);
          }

          // 3. Input Password (Coba 2x jika gagal sekali)
          for (let attempt = 1; attempt <= 2; attempt++) {
              this.logger.info(`[${email}] Mencoba input password (Attempt ${attempt})...`);
              
              const currentUrl = page.url();
              if (currentUrl.includes('/browse') || currentUrl.includes('/account') || currentUrl.includes('/YourAccount') || currentUrl.includes('/profiles') || (currentUrl === 'https://www.netflix.com/' && !currentUrl.includes('login'))) {
                  this.logger.info(`[${email}] Terdeteksi sudah login via URL: ${currentUrl}`);
                  return true;
              }

              const pwInput = getPasswordInput(page);
              try {
                  await pwInput.waitFor({ state: 'visible', timeout: 10000 });
                  
                  // Pastikan elemen bisa diinteraksi
                  await pwInput.scrollIntoViewIfNeeded();
                  await pwInput.click({ timeout: 5000 }); 
                  await pwInput.fill(password);
                  await this.sleep(1500); 
              } catch (e) {
                  this.logger.warn(`[${email}] Gagal berinteraksi dengan input password pada attempt ${attempt}.`);
                  if (attempt === 2) return false;
                  await this.sleep(3000);
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
              
              this.logger.info(`[${email}] Klik login selesai, menunggu respon status...`);
              await this.sleep(5000);

              
              // Cek apakah login sukses dengan fungsi detectLoginState
              const loginState = await this.detectLoginState(page);
              if (loginState === 'logged_in') {
                  this.logger.info(`[${email}] Berhasil login secara manual!`);
                  return true;
              }

              const finalUrl = page.url();
              if (finalUrl.includes('/browse') || finalUrl.includes('/account') || finalUrl.includes('/YourAccount') || finalUrl.includes('/password') || finalUrl.includes('/profiles')) {
                  return true;
              }

              const error = getLoginErrorCallout(page);
              if (await error.isVisible()) {
                  const errorMsg = await error.innerText();
                  this.logger.warn(`[${email}] Login attempt ${attempt} failed: ${errorMsg}`);
                  if (attempt === 2) return false;
                  await this.sleep(5000);
              }
          }
          
          return false;
      } catch (err) {
          this.logger.error(`[${email}] Error during manual login attempt: ${err instanceof Error ? err.message : String(err)}`);
          return false;
      }
  }

  private async handleEmailResetFlow(page: any, task: Task, email: string, newPassword: string): Promise<void> {
    this.logger.info(`[${email}] Proceeding with email reset flow...`);
    
    const eventName = `${sanitizeEmail(email)}:NETFLIX_REQ_RESET_PASSWORD`;
    this.eventBus.emit('socket:subscribe', eventName);

    try {
        let success = false;
        for (let attempt = 1; attempt <= 3; attempt++) {
            // Clear Cookies sebelum retry (jika bukan attempt pertama)
            if (attempt > 1) {
                this.logger.info(`[${email}] Attempt ${attempt}: Clearing cookies before retry...`);
                await page.goto("https://www.netflix.com/clearcookies");
                await this.sleep(2000);
            }

            await page.goto(REQUEST_RESET_URL);
            await this.sleep(1000);

            await getEmailRadio(page).click();
            await getEmailInput(page).fill(email);
            await getSendEmailButton(page).click();
            
            this.logger.info(`[${email}] Attempt ${attempt}: Waiting for response from Netflix (up to 10s)...`);

            // Cek apakah muncul pesan error "Terjadi Kesalahan" dengan waitFor (lebih akurat daripada sleep)
            const errorCallout = getResetErrorCallout(page).first();
            let hasError = false;
            try {
                await errorCallout.waitFor({ state: 'visible', timeout: 10000 });
                hasError = true;
            } catch (e) {
                // Jika timeout, berarti tidak ada error yang muncul dalam 10 detik
                hasError = false;
            }

            if (hasError) {
                const errorMsg = await errorCallout.innerText();
                this.logger.warn(`[${email}] Email reset attempt ${attempt} failed with error: "${errorMsg}".`);
                
                if (attempt === 3) {
                    this.logger.error(`[${email}] reset gagal terjadi kesalahan silahkan ambil link manual`);
                    throw new Error("reset gagal terjadi kesalahan silahkan ambil link manual");
                }
                
                // Lanjut ke loop berikutnya (akan clear cookies di awal loop)
                continue;
            }

            // Jika TIDAK ADA error setelah menunggu 10 detik, kita anggap berhasil
            success = true;
            break;
        }

        if (!success) return;

        this.logger.info(`[${email}] Reset email requested successfully, waiting for link from event...`);

        const eventData = await this.waitForTaskEvent<ResetPasswordEventData>(
          task.id,
          eventName,
        );

        const resetLink = eventData.data;
        this.logger.info(`[${email}] Received reset link: ${resetLink}`);

        await page.goto(resetLink);
        await getNewPasswordInput(page).waitFor({ state: "visible", timeout: 30000 });

        await getNewPasswordInput(page).fill(newPassword);
        await getConfirmNewPasswordInput(page).fill(newPassword);

        const checkbox = getLogAllDevicesCheckbox(page);
        if (!(await checkbox.isChecked())) {
          await checkbox.check();
        }

        await getSubmitButton(page).click();
    } finally {
        this.eventBus.emit('socket:unsubscribe', eventName);
    }
  }

  private async handleChangePasswordFlow(page: any, task: Task, email: string, newPassword: string, password?: string, isRetry: boolean = false): Promise<boolean> {
    this.logger.info(`[${email}] Already logged in, proceeding to change password`);

    if (!password) {
      throw new Error("Current password is required for logged-in change password flow");
    }

    // Tunggu sampai salah satu input muncul (sandi lama ATAU sandi baru)
    const currentPasswordInput = getCurrentPasswordInput(page);
    const newPasswordInput = getNewPasswordInput(page);
    
    try {
      await Promise.race([
        currentPasswordInput.waitFor({ state: "visible", timeout: 15000 }),
        newPasswordInput.waitFor({ state: "visible", timeout: 15000 }),
      ]);
    } catch (e) {
      this.logger.warn(`[${email}] Timeout menunggu form change password muncul.`);
    }

    if (await currentPasswordInput.isVisible()) {
      this.logger.info(`[${email}] Input sandi lama terdeteksi, memasukkan sandi lama.`);
      await currentPasswordInput.fill(password);
    } else {
      this.logger.info(`[${email}] Input sandi lama tidak ada, langsung memasukkan sandi baru.`);
    }

    await newPasswordInput.fill(newPassword);
    await getConfirmNewPasswordInput(page).fill(newPassword);

    const checkbox = getLogAllDevicesCheckbox(page);
    if (!(await checkbox.isChecked())) {
      await checkbox.check();
    }

    await getSubmitButton(page).click();

    // Check for generic error "Terjadi kesalahan" that requires MFA
    const genericError = getGenericErrorAlert(page);
    try {
        await genericError.waitFor({ state: 'visible', timeout: 5000 });
        this.logger.warn(`[${email}] Terdeteksi error "Terjadi kesalahan". Melakukan verifikasi MFA...`);
        
        // 1. Redirect to manageaccountaccess
        await page.goto("https://www.netflix.com/manageaccountaccess");
        
        // 2. Click Kirim kode melalui email
        const mfaBtn = getMfaEmailButton(page);
        await mfaBtn.waitFor({ state: 'visible', timeout: 15000 });
        await mfaBtn.click();
        
        // 3. Tunggu kode OTP
        const otpEventName = `${sanitizeEmail(email)}:NETFLIX_OTP`;
        this.eventBus.emit('socket:subscribe', otpEventName);
        this.logger.info(`[${email}] Menunggu OTP dari email...`);
        
        try {
            const eventData = await this.waitForTaskEvent<any>(task.id, otpEventName);
            const otpCode = eventData.data;
            this.logger.info(`[${email}] Mendapatkan OTP: ${otpCode}. Memasukkan kode...`);
            
            // 4. Input OTP
            const otpInput = getOtpInput(page);
            await otpInput.waitFor({ state: 'visible', timeout: 15000 });
            await otpInput.fill(otpCode);
            
            // 5. Submit OTP
            await getOtpSubmitButton(page).click();
            await this.sleep(3000); // Tunggu proses verifikasi selesai
            
            this.logger.info(`[${email}] OTP berhasil disubmit, mengulangi proses ganti sandi...`);
            
            // 6. Redirect kembali ke halaman ganti sandi dan coba lagi (hanya 1 kali retry untuk mencegah infinite loop)
            if (!isRetry) {
                await page.goto(CHANGE_PASSWORD_URL);
                return await this.handleChangePasswordFlow(page, task, email, newPassword, password, true);
            } else {
                this.logger.error(`[${email}] Gagal mengganti sandi meskipun sudah diverifikasi OTP.`);
                return false;
            }
            
        } finally {
            this.eventBus.emit('socket:unsubscribe', otpEventName);
        }
        
    } catch (e) {
        // Tidak ada generic error, lanjut cek error password salah
    }

    // Check for "Incorrect password" error (Fallback V4)
    const errorEl = getCurrentPasswordError(page);
    try {
        await errorEl.waitFor({ state: 'visible', timeout: 5000 });
        const errorText = await errorEl.innerText();
        if (errorText.toLowerCase().includes('incorrect') || errorText.toLowerCase().includes('salah')) {
            this.logger.warn(`[${email}] Ganti password gagal karena password lama SALAH. Mencoba alur RESET EMAIL sebagai cadangan...`);
            return false;
        }
    } catch (e) {
        // Tidak ada error terlihat dalam 5 detik, anggap berhasil submit
    }

    return true;
  }

  private async handlePostSubmission(page: any, email: string): Promise<void> {
    this.logger.info(`[${email}] Waiting for Netflix to confirm password change...`);
    try {
      // Tunggu sampai salah satu indikator sukses muncul
      await Promise.race([
        page.waitForURL((url: any) => url.toString().includes('addphone'), { timeout: 30000 }),
        page.waitForURL((url: any) => url.toString().includes('passwordUpdated=success'), { timeout: 30000 }),
        page.waitForURL((url: any) => url.toString().includes('YourAccount'), { timeout: 30000 }),
        page.waitForURL((url: any) => url.toString().includes('browse'), { timeout: 30000 }),
        page.waitForSelector('text="Tidak, Terima Kasih", text="No Thanks", text="Not Now"', { timeout: 30000 }),
      ]).catch(() => this.logger.warn(`[${email}] Timeout waiting for redirect, checking current state...`));

      const currentUrl = page.url();
      this.logger.info(`[${email}] Current page after submit: ${currentUrl}`);

      // 1. Handle prompt "Add Recovery Phone" atau "No Thanks"
      const noThanksBtn = page.locator('button:has-text("Tidak, Terima Kasih"), a:has-text("Tidak, Terima Kasih"), button:has-text("No Thanks"), button:has-text("Not Now")');
      if (await noThanksBtn.isVisible({ timeout: 5000 })) {
        this.logger.info(`[${email}] Handling 'Add Recovery Phone' prompt...`);
        await noThanksBtn.click();
        await this.sleep(3000);
      }

      // 2. Verifikasi jika mendarat di halaman keamanan/akun
      if (page.url().includes('passwordUpdated=success') || page.url().includes('security')) {
          this.logger.info(`[${email}] Verifying successful redirect to security page...`);
          const deviceLabel = page.locator('[data-uia="account-security-page+security-card+devices+item+label"]');
          if (await deviceLabel.isVisible({ timeout: 5000 })) {
              await deviceLabel.click();
              this.logger.info(`[${email}] Final verification click performed.`);
          }
      }
    } catch (err) {
      this.logger.warn("Post-submission verification finished with notice: " + (err instanceof Error ? err.message : String(err)));
    }
    await this.sleep(5000); 
  }

  private async notifyApiSuccess(payload: any, email: string, newPassword: string): Promise<void> {
    try {
        if (!payload.accountId) {
          throw new Error("Netflix reset payload missing accountId");
        }
        await updateNetflixAccountStatus(
          this.apiBaseUrl,
          this.authCredentials,
          payload.accountId,
          payload.newPassword,
        );
      } catch (error) {
        this.logger.error(
          `Berhasil reset netflix password pada ${email} tapi gagal update data app: ${error instanceof Error ? error.message : String(error)}`,
          { instanceId: this.instanceId },
          {
            level: "NEED_ACTION",
            context: "ResetNetflixPassword",
            customMessage: `⚠️ Berhasil reset password netflix\ntapi gagal update data di app\n\nEmail: ${email}\nPassword baru: ${newPassword}`,
          },
        );
      }
  }

  private async handleTaskError(error: any, email: string, newPassword: string): Promise<void> {
      this.logger.error(
        `Failed to reset netflix password for ${email}: ${error instanceof Error ? error.message : String(error)}`,
        { instanceId: this.instanceId },
        {
          level: "NEED_ACTION",
          context: "ResetNetflixPassword",
          customMessage: `‼️ Gagal reset password netflix pada email ${email}\n\nSilahkan lakukan reset manual.`,
        },
      );
  }

  private async cleanupTask(page: any, contextName: string): Promise<void> {
      await page.close();
      await this.saveSession(contextName);
      const ctx = this.getContextByName(contextName);
      if (ctx) {
        await ctx.close();
        this.invalidateContext(contextName);
      }
  }

  /**
   * Logika V3: Hitung status enable/disable berdasarkan expiry & jam 15:00 WIB
   */
  private calculateAccountState(subscriptionExpiry: string): { status: string; reason: string } {
    const now = new Date(); 
    const expiry = new Date(subscriptionExpiry);
    
    // 1. Jika sudah lewat tanggal
    if (now > expiry) {
        return { status: 'disable', reason: 'Sudah lewat tanggal (Kadaluarsa)' };
    }

    // 2. Jika hari ini adalah H-1 (Hari terakhir masa aktif)
    const oneDayInMs = 24 * 60 * 60 * 1000;
    const timeToExpiry = expiry.getTime() - now.getTime();
    const isLastDay = timeToExpiry <= oneDayInMs;

    if (isLastDay) {
        // Cek jam 15:00 (Asumsi server/bot di WIB)
        const hour = now.getHours();
        if (hour >= 15) {
            return { status: 'disable', reason: 'Sudah lewat jam 15:00 (Hari Terakhir)' };
        }
    }

    return { status: 'ready', reason: 'Masih aktif' };
  }

  /**
   * Menghasilkan password acak (lowercase + angka) sepanjang N karakter
   */
  private generateRandomPassword(length: number): string {
    const letters = 'abcdefghijklmnopqrstuvwxyz';
    const numbers = '0123456789';
    let result = '';
    
    // 3 Karakter pertama: Huruf
    for (let i = 0; i < 3; i++) {
        result += letters.charAt(Math.floor(Math.random() * letters.length));
    }
    
    // 3 Karakter berikutnya: Angka
    for (let i = 0; i < 3; i++) {
        result += numbers.charAt(Math.floor(Math.random() * numbers.length));
    }
    
    return result;
  }

  // ==========================================================================
  // Auto Reload Flow
  // ==========================================================================

  async autoReload(task: Task): Promise<void> {
    const payload = task.payload as unknown as AutoReloadPayload;
    const { email, password, billing, variant_name, accountId } = payload;
    const contextName = sanitizeEmail(email);

    this.logger.info(`[AutoReload][${email}] Memulai proses reload. Varian: ${variant_name}, Billing: ${billing}`);

    const context = await this.getOrCreateContext(contextName);
    const page = await context.newPage();

    try {
      // STEP 1: Navigasi & Cek status login
      await page.goto(MEMBERSHIP_URL);
      this.logger.info(`[AutoReload][${email}] Navigasi ke halaman membership...`);
      await this.sleep(3000);

      // Cek dulu apakah tombol restart sudah ada (berarti pasti sudah login)
      let restartBtn = getRestartMembershipButton(page);
      let restartVisible = await restartBtn.isVisible({ timeout: 5000 }).catch(() => false);

      if (!restartVisible) {
        // Jika tidak terlihat, mungkin belum login atau memang akun masih aktif
        const loginState = await this.detectLoginState(page);
        if (loginState === 'not_logged_in') {
          this.logger.info(`[AutoReload][${email}] Belum login, mencoba manual login...`);
          try {
            const loginOk = await this.attemptManualLogin(page, email, password);
            if (!loginOk) {
              throw new Error("Manual login returned false");
            }
          } catch (err) {
            this.logger.warn(`[AutoReload][${email}] Login manual gagal, mencoba alur RESET PASSWORD otomatis sebagai cadangan...`);
            
            // Buat password baru untuk reset (6 karakter acak)
            const newPassword = this.generateRandomPassword(6);
            this.logger.info(`[AutoReload][${email}] Menjalankan reset email dengan password baru: ${newPassword}`);
            
            await this.handleEmailResetFlow(page, task, email, newPassword);

            // PENTING: Update password baru ke database setelah reset berhasil
            await updateNetflixAccountStatus(
              this.apiBaseUrl,
              this.authCredentials,
              payload.accountId,
              newPassword,
              'ready'
            );
            this.logger.info(`[AutoReload][${email}] Password baru berhasil dicatat di database.`);
          }

          await page.goto(MEMBERSHIP_URL);
          await this.sleep(5000);
          
          // Re-check restart button
          restartBtn = getRestartMembershipButton(page);
          restartVisible = await restartBtn.isVisible({ timeout: 10000 }).catch(() => false);
        }
      }

      // STEP 2: Cek apakah tombol restart sudah ada
      this.logger.info(`[AutoReload][${email}] Mengecek tombol Restart Membership...`);
      // Gunakan variabel yang sudah ada (tidak perlu const lagi)
      restartVisible = await restartBtn.isVisible({ timeout: 5000 }).catch(() => false);

      if (!restartVisible) {
        // Sub-alur: perlu cancel plan dulu
        this.logger.info(`[AutoReload][${email}] Tombol restart tidak ada, memulai sub-alur cancel plan...`);
        await this.handleCancelPlanFlow(page, email);
      }

      // STEP 3: Klik Restart Membership
      this.logger.info(`[AutoReload][${email}] Klik tombol Restart Membership...`);
      await getRestartMembershipButton(page).waitFor({ state: 'visible', timeout: 15000 });
      await getRestartMembershipButton(page).click();
      await this.sleep(3000);

      // STEP 4: Klik "Mulai Lagi Keanggotaanmu" (Hero Card)
      // Kita buat tangguh: Cek apakah tombol ini memang ada, atau kita sudah terlanjur lompat ke halaman selanjutnya
      this.logger.info(`[AutoReload][${email}] Mengecek status setelah klik Restart...`);
      
      const heroVisible = await getRestartHeroButton(page).isVisible({ timeout: 5000 }).catch(() => false);
      const alreadyNext = await Promise.race([
        getWelcomeBackHeading(page).isVisible().then((v: boolean) => v ? 'step5' : null),
        getLegalCheckbox(page).isVisible().then((v: boolean) => v ? 'step9' : null),
      ]).catch(() => null);

      if (alreadyNext) {
        this.logger.info(`[AutoReload][${email}] Sudah berada di ${alreadyNext}, melewati Step 4.`);
      } else if (heroVisible) {
        this.logger.info(`[AutoReload][${email}] Klik hero card restart (Mulai Lagi Keanggotaanmu)...`);
        await getRestartHeroButton(page).click({ force: true, delay: 500 });
        await page.waitForLoadState('networkidle').catch(() => {});
        await this.sleep(3000);
      } else {
        this.logger.warn(`[AutoReload][${email}] Tombol hero card tidak ditemukan, mencoba deteksi halaman selanjutnya...`);
      }

      // STEP 5: Smart Navigation - Deteksi apakah langsung ke Checkout atau perlu pilih Plan
      this.logger.info(`[AutoReload][${email}] Mendeteksi halaman selanjutnya...`);
      const nextStep = await Promise.race([
        getWelcomeBackHeading(page).waitFor({ state: 'visible', timeout: 15000 }).then(() => 'step5' as const),
        getLegalCheckbox(page).waitFor({ state: 'visible', timeout: 15000 }).then(() => 'step9' as const),
      ]).catch(() => 'timeout' as const);

      if (nextStep === 'step9') {
        this.logger.info(`[AutoReload][${email}] Terdeteksi langsung di halaman checkout, melewati Step 5-8.`);
      } else if (nextStep === 'step5') {
        this.logger.info(`[AutoReload][${email}] Menunggu halaman Selamat Datang Kembali...`);
        await getNextButton(page).click();
        await this.sleep(2000);

        // STEP 6: Pilih plan
        const isMobilePlan = /harian|mingguan/i.test(variant_name);
        const planLabel = isMobilePlan ? getMobilePlanLabel(page) : getStandardPlanLabel(page);
        const planName = isMobilePlan ? `Ponsel (${PLAN_MOBILE_ID})` : `Standar (${PLAN_STANDARD_ID})`;
        this.logger.info(`[AutoReload][${email}] Memilih plan: ${planName}`);
        await planLabel.waitFor({ state: 'visible', timeout: 15000 });
        await planLabel.click();
        await this.sleep(1000);

        // STEP 7: Klik Berikutnya setelah pilih plan
        await getNextPlanButton(page).waitFor({ state: 'visible', timeout: 10000 });
        await getNextPlanButton(page).click();
        await this.sleep(2000);

        // STEP 8: Halaman "Yang terakhir" — klik Berikutnya
        this.logger.info(`[AutoReload][${email}] Menunggu halaman Yang Terakhir...`);
        await getLastStepHeading(page).waitFor({ state: 'visible', timeout: 15000 });
        await getLastStepNextButton(page).click();
        await this.sleep(2000);
      } else {
        throw new Error(`[AutoReload] Gagal mendeteksi halaman selanjutnya setelah klik hero card.`);
      }

      // STEP 9: Centang checkbox legal
      this.logger.info(`[AutoReload][${email}] Mencentang checkbox legal...`);
      const checkbox = getLegalCheckbox(page);
      await checkbox.waitFor({ state: 'visible', timeout: 10000 });
      if (!(await checkbox.isChecked())) {
        await checkbox.check();
      }
      await this.sleep(1000);

      // STEP 10: Notify API tentang pending top-up, tunggu konfirmasi dari dashboard (10 menit)
      const topupEventName = `${accountId}:NETFLIX_TOPUP_CONFIRM`;
      const cancelEventName = `${accountId}:NETFLIX_TOPUP_CANCEL`;
      this.logger.info(`[AutoReload][${email}] Memberitahu API tentang pending top-up (maks 10 menit)... Billing: ${billing}`);

      // Panggil API endpoint untuk notify pending topup
      await notifyTopupPending(
        this.apiBaseUrl,
        this.authCredentials,
        accountId,
        email,
        billing,
        task.id,
      );

      // Kita tunggu event: BISA KONFIRMASI atau PEMBATALAN
      this.eventBus.emit('socket:subscribe', topupEventName);
      this.eventBus.emit('socket:subscribe', cancelEventName);

      try {
        const eventData = await Promise.race([
          this.waitForTaskEvent<any>(task.id, topupEventName).then(data => ({ type: 'confirm', data })),
          this.waitForTaskEvent<any>(task.id, cancelEventName).then(data => ({ type: 'cancel', data })),
        ]);

        this.eventBus.emit('socket:unsubscribe', topupEventName);
        this.eventBus.emit('socket:unsubscribe', cancelEventName);

        if (eventData.type === 'cancel') {
          this.logger.warn(`[AutoReload][${email}] Reload dibatalkan oleh admin.`);
          throw new Error("Reload dibatalkan oleh admin.");
        }

        this.logger.info(`[AutoReload][${email}] Konfirmasi top-up diterima! Melanjutkan...`);
      } catch (err) {
        this.eventBus.emit('socket:unsubscribe', topupEventName);
        this.eventBus.emit('socket:unsubscribe', cancelEventName);
        throw err;
      }

      // STEP 11: Klik "Mulai Keanggotaan"
      this.logger.info(`[AutoReload][${email}] Klik tombol konfirmasi mulai keanggotaan...`);
      await getConfirmStartButton(page).waitFor({ state: 'visible', timeout: 15000 });
      await getConfirmStartButton(page).click();
      await this.sleep(3000);

      // STEP 12: Halaman Akhir (orderfinal) — Klik Berikutnya
      this.logger.info(`[AutoReload][${email}] Menunggu halaman konfirmasi akhir (orderfinal)...`);
      try {
        await getOrderFinalButton(page).waitFor({ state: 'visible', timeout: 15000 });
        await getOrderFinalButton(page).click();
        this.logger.info(`[AutoReload][${email}] Tombol konfirmasi akhir diklik.`);
        await this.sleep(2000);
      } catch (err) {
        this.logger.warn(`[AutoReload][${email}] Tombol konfirmasi akhir tidak muncul atau gagal diklik. Melanjutkan...`);
      }

      // STEP 13: Hitung expiry baru & update DB
      const newExpiry = this.calculateReloadExpiry(variant_name);
      this.logger.info(`[AutoReload][${email}] Reload selesai! Subscription baru: ${newExpiry.toISOString()}`);

      await updateNetflixReloadStatus(
        this.apiBaseUrl,
        this.authCredentials,
        accountId,
        newExpiry,
      );

      this.logger.info(`[AutoReload][${email}] Database berhasil diperbarui. Proses selesai!`);

    } catch (error) {
      this.logger.error(
        `[AutoReload] Gagal reload akun ${email}: ${error instanceof Error ? error.message : String(error)}`,
        { instanceId: this.instanceId },
        {
          level: 'NEED_ACTION',
          context: 'NetflixAutoReload',
          customMessage: `‼️ Gagal auto reload Netflix\nEmail: ${email}\nBilling: ${billing}\n\nSilakan lakukan reload manual.`,
        },
      );
      throw error;
    } finally {
      await this.cleanupTask(page, contextName);
    }
  }

  /**
   * Sub-alur: cancel plan yang masih aktif agar tombol restart muncul
   */
  private async handleCancelPlanFlow(page: any, email: string): Promise<void> {
    this.logger.info(`[AutoReload][${email}] Navigasi ke cancelplan...`);
    await page.goto(CANCEL_PLAN_URL);
    
    // Coba klik tombol expand "Tampilkan isi pilihan"
    const expandBtn = getExpandCancelButton(page);
    const finishBtn = getFinishCancellationButton(page);
    
    try {
      // Tunggu salah satu muncul: tombol expand atau tombol finish (jika sudah terbuka)
      await Promise.race([
        expandBtn.waitFor({ state: 'visible', timeout: 8000 }),
        finishBtn.waitFor({ state: 'visible', timeout: 8000 })
      ]);

      if (await expandBtn.isVisible()) {
        this.logger.info(`[AutoReload][${email}] Klik tombol expand...`);
        await expandBtn.click();
        await this.sleep(1500);
      }
    } catch (err) {
      this.logger.warn(`[AutoReload][${email}] Tombol expand tidak ditemukan atau menu sudah terbuka, mencoba cek tombol Finish...`);
    }

    // Klik "Selesaikan Pembatalan" (Finish Cancellation)
    await finishBtn.waitFor({ state: 'visible', timeout: 10000 });
    await finishBtn.click();
    this.logger.info(`[AutoReload][${email}] Pembatalan selesai, kembali ke halaman membership...`);
    await this.sleep(2000);

    // Balik ke membership, tunggu tombol restart muncul
    await page.goto(MEMBERSHIP_URL);
    await getRestartMembershipButton(page).waitFor({ state: 'visible', timeout: 20000 });
    this.logger.info(`[AutoReload][${email}] Tombol Restart Membership sudah muncul!`);
  }

  /**
   * Hitung subscription_expiry baru berdasarkan tipe varian
   * - Harian/Mingguan: +9 hari (jam < 22:00 WIB) atau +10 hari (jam >= 22:00 WIB)
   * - Bulanan/Sharing Bulanan: +1 bulan
   */
  private calculateReloadExpiry(variantName: string): Date {
    const now = new Date();
    const isHarianOrMingguan = /harian|mingguan/i.test(variantName);

    if (isHarianOrMingguan) {
      const WIB_OFFSET_MS = 7 * 60 * 60 * 1000; // UTC+7
      const nowWIB = new Date(now.getTime() + WIB_OFFSET_MS);
      const hourWIB = nowWIB.getUTCHours();
      const daysToAdd = hourWIB >= 22 ? 10 : 9;
      const result = new Date(now);
      result.setDate(result.getDate() + daysToAdd);
      this.logger.info(`Expiry calc [${variantName}]: jam WIB=${hourWIB}, +${daysToAdd} hari → ${result.toISOString()}`);
      return result;
    }

    // Bulanan / Sharing Bulanan
    const result = new Date(now);
    result.setMonth(result.getMonth() + 1);
    this.logger.info(`Expiry calc [${variantName}]: +1 bulan → ${result.toISOString()}`);
    return result;
  }
}
