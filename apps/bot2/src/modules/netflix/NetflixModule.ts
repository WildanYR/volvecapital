/**
 * Netflix Reset Password Module
 */

import { BaseModule } from "../../core/BaseModule.js";
import type { ModuleDependencies } from "../../types/module.type.js";
import type { ModuleConfig } from "../../types/config.type.js";
import type { Task } from "../../types/task.type.js";
import {
  CHANGE_PASSWORD_URL,
  REQUEST_RESET_URL,
  LOGIN_PATH,
} from "./constants.js";
import { sanitizeEmail } from "./utils.js";
import { ResetPasswordPayload } from "./types/payload.type.js";
import { ResetPasswordEventData } from "./types/event.type.js";

// Locators
import {
  getLoginHelpAnchor,
  getCurrentPasswordInput,
  getNewPasswordInput,
  getConfirmNewPasswordInput,
  getLogAllDevicesCheckbox,
  getSubmitButton,
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
import { updateNetflixAccountStatus } from "./api.js";

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
        await this.handleChangePasswordFlow(page, email, newPassword, password);
      }

      await this.handlePostSubmission(page, email);
      this.logger.info(`[${email}] Password reset/change submitted successfully`);

      // 5. Update Status ke API (V3 Logic)
      const { status, reason } = this.calculateAccountState(payload.subscription_expiry);
      const shouldSwitch = payload.variant_name.toLowerCase() !== 'harian';
      const variantLog = shouldSwitch ? `SWITCHED (${payload.variant_name} -> Harian)` : "TETAP (Harian)";

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
    return await Promise.race([
        getLoginHelpAnchor(page)
          .waitFor({ state: "visible", timeout: 15000 })
          .then(() => "not_logged_in" as const),
        getCurrentPasswordInput(page)
          .waitFor({ state: "visible", timeout: 15000 })
          .then(() => "logged_in" as const),
        page
          .waitForURL((url: any) => url.toString().includes(LOGIN_PATH), {
            timeout: 15000,
          })
          .then(() => "not_logged_in" as const),
      ]).catch(() => "not_logged_in" as const);
  }

  private async attemptManualLogin(page: any, email: string, password?: string): Promise<boolean> {
      if (!password) return false;

      try {
          // 1. Input Email
          const emailInput = getUserLoginIdInput(page);
          await emailInput.waitFor({ state: 'visible', timeout: 5000 });
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
                  this.logger.info(`[${email}] Tombol 'Gunakan sandi' berhasil diklik.`);
                  await this.sleep(2000);
              } else {
                  this.logger.warn(`[${email}] Tombol 'Gunakan sandi' tidak terlihat setelah klik bantuan.`);
                  return false;
              }
          } else {
              this.logger.info(`[${email}] Neither OTP nor Rejoin screen detected, checking if direct password input available...`);
          }

          // 3. Input Password (Coba 2x jika gagal sekali)
          for (let attempt = 1; attempt <= 2; attempt++) {
              const pwInput = getPasswordInput(page);
              if (await pwInput.isVisible({ timeout: 5000 })) {
                  await pwInput.fill(password);
                  await this.sleep(1000); // Tunggu sebentar agar tombol enabled
                  
                  const signInBtn = getSignInButton(page);
                  if (await signInBtn.isEnabled({ timeout: 5000 })) {
                      await signInBtn.click();
                  } else {
                      this.logger.warn("Sign in button still disabled, trying Enter key...");
                      await pwInput.press('Enter');
                  }
                  
                  await this.sleep(3000);
                  
                  if (page.url().includes('/browse') || page.url().includes('/password')) {
                      return true;
                  }

                  const error = getLoginErrorCallout(page);
                  if (await error.isVisible()) {
                      const errorMsg = await error.innerText();
                      this.logger.warn(`[${email}] Login attempt ${attempt} failed: ${errorMsg}`);
                      if (attempt === 2) return false;
                      await this.sleep(2000);
                  }
              } else {
                  this.logger.warn(`[${email}] Sign in button or password input not found on attempt ${attempt}`);
                  return false;
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

    this.logger.info(`[${email}] Reset email requested successfully (no error detected after wait), waiting for event...`);

    const eventName = `${sanitizeEmail(email)}:NETFLIX_REQ_RESET_PASSWORD`;
    this.eventBus.emit('socket:subscribe', eventName);

    const eventData = await this.waitForTaskEvent<ResetPasswordEventData>(
      task.id,
      eventName,
    );

    this.eventBus.emit('socket:unsubscribe', eventName);

    const resetLink = eventData.data;
    this.logger.info(`[${email}] Received reset link: ${resetLink}`);

    await page.goto(resetLink);
    await getNewPasswordInput(page).waitFor({ state: "visible" });

    await getNewPasswordInput(page).fill(newPassword);
    await getConfirmNewPasswordInput(page).fill(newPassword);

    const checkbox = getLogAllDevicesCheckbox(page);
    if (!(await checkbox.isChecked())) {
      await checkbox.check();
    }

    await getSubmitButton(page).click();
  }

  private async handleChangePasswordFlow(page: any, email: string, newPassword: string, password?: string): Promise<void> {
    this.logger.info(`[${email}] Already logged in, proceeding to change password`);

    if (!password) {
      throw new Error("Current password is required for logged-in change password flow");
    }

    await getCurrentPasswordInput(page).fill(password);
    await getNewPasswordInput(page).fill(newPassword);
    await getConfirmNewPasswordInput(page).fill(newPassword);

    const checkbox = getLogAllDevicesCheckbox(page);
    if (!(await checkbox.isChecked())) {
      await checkbox.check();
    }

    await getSubmitButton(page).click();
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
}
