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
    const { email, password, newPassword } = payload;

    const contextName = `${sanitizeEmail(email)}`;
    this.logger.info(
      `Starting reset password for ${email} with context ${contextName}`,
    );

    const context = await this.getOrCreateContext(contextName);
    const page = await context.newPage();

    try {
      await page.goto(CHANGE_PASSWORD_URL);
      this.logger.info("Checking auth state...");

      let loginState = await this.detectLoginState(page);

      // 2. Jika Belum Login, Coba Login Manual Dulu
      if (loginState === "not_logged_in") {
          this.logger.info("Not logged in, attempting manual login with existing password...");
          const loginSuccess = await this.attemptManualLogin(page, email, password);
          
          if (loginSuccess) {
              this.logger.info("Manual login successful, proceeding to change password");
              await page.goto(CHANGE_PASSWORD_URL);
              loginState = await this.detectLoginState(page);
          } else {
              this.logger.info("Manual login failed or not possible, falling back to email reset");
          }
      }

      // 3. Skenario Reset / Change
      if (loginState === "not_logged_in") {
        await this.handleEmailResetFlow(page, task, email, newPassword);
      } else {
        await this.handleChangePasswordFlow(page, newPassword, password);
      }

      await this.handlePostSubmission(page);
      this.logger.info("Password reset/change submitted successfully");
      await this.notifyApiSuccess(payload, email, newPassword);

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
          const rejoinText = getRejoinText(page);

          this.logger.info("Waiting for next screen (OTP or Rejoin)...");
          let screenDetected: 'otp' | 'rejoin' | 'timeout' = 'timeout';
          
          for (let i = 0; i < 20; i++) { // Check setiap 500ms selama 10 detik
              if (await pinEntry.isVisible()) {
                  screenDetected = 'otp';
                  break;
              }
              if (await rejoinText.isVisible()) {
                  screenDetected = 'rejoin';
                  break;
              }
              await this.sleep(500);
          }

          if (screenDetected === 'otp' || screenDetected === 'rejoin') {
              this.logger.info(`${screenDetected.toUpperCase()} screen detected!`);
              
              if (screenDetected === 'rejoin') {
                  this.logger.info("Mendeteksi tombol 'kirim ulang' berhasil.");
              }

              // Klik Expand 'Dapatkan Bantuan'
              const getHelp = getGetHelpText(page);
              if (await getHelp.isVisible()) {
                  await getHelp.click();
                  this.logger.info("Tombol 'Dapatkan Bantuan' berhasil diklik.");
                  await this.sleep(1500); // Tunggu menu expand
              } else {
                  this.logger.warn("Tombol 'Dapatkan Bantuan' tidak terlihat.");
              }

              // Klik 'Gunakan Sandi'
              const usePwBtn = getUsePasswordInsteadItem(page);
              if (await usePwBtn.isVisible()) {
                  await usePwBtn.click();
                  this.logger.info("Tombol 'Gunakan sandi' berhasil diklik.");
                  await this.sleep(2000);
              } else {
                  this.logger.warn("Tombol 'Gunakan sandi' tidak terlihat setelah klik bantuan.");
                  return false;
              }
          } else {
              this.logger.info("Neither OTP nor Rejoin screen detected, checking if direct password input available...");
          }

          // 3. Input Password (Coba 2x jika gagal sekali)
          for (let attempt = 1; attempt <= 2; attempt++) {
              const pwInput = getPasswordInput(page);
              if (await pwInput.isVisible({ timeout: 5000 })) {
                  await pwInput.fill(password);
                  await getSignInButton(page).click();
                  
                  await this.sleep(3000);
                  
                  if (page.url().includes('/browse') || page.url().includes('/password')) {
                      return true;
                  }

                  const error = getLoginErrorCallout(page);
                  if (await error.isVisible()) {
                      const errorMsg = await error.innerText();
                      this.logger.warn(`Login attempt ${attempt} failed: ${errorMsg}`);
                      if (attempt === 2) return false;
                      await this.sleep(2000);
                  }
              } else {
                  return false;
              }
          }
          
          return false;
      } catch (err) {
          this.logger.error(`Error during manual login attempt: ${err instanceof Error ? err.message : String(err)}`);
          return false;
      }
  }

  private async handleEmailResetFlow(page: any, task: Task, email: string, newPassword: string): Promise<void> {
    this.logger.info("Proceeding with email reset flow...");
    await page.goto(REQUEST_RESET_URL);

    await getEmailRadio(page).click();
    await getEmailInput(page).fill(email);
    await getSendEmailButton(page).click();

    this.logger.info("Reset email requested, waiting for event...");

    const eventName = `${sanitizeEmail(email)}:NETFLIX_REQ_RESET_PASSWORD`;
    this.eventBus.emit('socket:subscribe', eventName);

    const eventData = await this.waitForTaskEvent<ResetPasswordEventData>(
      task.id,
      eventName,
    );

    this.eventBus.emit('socket:unsubscribe', eventName);

    const resetLink = eventData.data;
    this.logger.info(`Received reset link: ${resetLink}`);

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

  private async handleChangePasswordFlow(page: any, newPassword: string, password?: string): Promise<void> {
    this.logger.info("Already logged in, proceeding to change password");

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

  private async handlePostSubmission(page: any): Promise<void> {
    this.logger.info("Waiting for Netflix to confirm password change...");
    try {
      await Promise.race([
        page.waitForURL((url: any) => url.toString().includes('addphone'), { timeout: 15000 }),
        page.waitForURL((url: any) => url.toString().includes('passwordUpdated=success'), { timeout: 15000 }),
        page.waitForSelector('text="Tidak, Terima Kasih"', { timeout: 15000 }),
        this.sleep(10000) 
      ]);

      const currentUrl = page.url();
      this.logger.info(`Current page after submit: ${currentUrl}`);

      if (currentUrl.includes('addphone') || await page.isVisible('text="Tidak, Terima Kasih"')) {
        this.logger.info("Handling 'Add Recovery Phone' prompt...");
        const noThanksBtn = page.locator('button:has-text("Tidak, Terima Kasih"), a:has-text("Tidak, Terima Kasih")');
        if (await noThanksBtn.isVisible()) {
          await noThanksBtn.click();
          await this.sleep(2000);
        }
      }

      if (page.url().includes('passwordUpdated=success')) {
          this.logger.info("Verifying successful redirect to security page...");
          const deviceLabel = page.locator('[data-uia="account-security-page+security-card+devices+item+label"]');
          if (await deviceLabel.isVisible()) {
              await deviceLabel.click();
              this.logger.info("Final verification click performed.");
          }
      }
    } catch (err) {
      this.logger.warn("Post-submission verification timed out, but password might still be saved.");
    }
    await this.sleep(10000); 
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
}
