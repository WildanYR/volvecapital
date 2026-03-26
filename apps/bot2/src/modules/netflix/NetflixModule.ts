/**
 * Netflix Reset Password Module
 */

import { BaseModule } from '../../core/BaseModule.js';
import type { ModuleDependencies } from '../../types/module.type.js';
import type { ModuleConfig } from '../../types/config.type.js';
import type { Task } from '../../types/task.type.js';
import { CHANGE_PASSWORD_URL, REQUEST_RESET_URL, LOGIN_PATH } from './constants.js';
import { sanitizeEmail } from './utils.js';
import { ResetPasswordPayload } from './types/payload.type.js';
import { ResetPasswordEventData } from './types/event.type.js';

// Locators
import {
  getLoginHelpAnchor,
  getCurrentPasswordInput,
  getNewPasswordInput,
  getConfirmNewPasswordInput,
  getLogAllDevicesCheckbox,
  getSubmitButton,
} from './locators/changePassword.js';
import {
  getEmailRadio,
  getEmailInput,
  getSendEmailButton,
} from './locators/requestReset.js';
import { updateNetflixAccountStatus } from './api.js';

export class NetflixModule extends BaseModule {
  constructor(deps: ModuleDependencies, instanceId: string, config: ModuleConfig) {
    super(deps, instanceId, config);
  }

  // ==========================================================================
  // Abstract method implementations
  // ==========================================================================

  async setupSchema(): Promise<void> {
    // No specific schema needed for this module as provided in specs
    this.logger.info('NetflixModule schema setup (no-op)');
  }

  async init(): Promise<void> {
    this.setRunning(true);
    this.logger.info('NetflixModule initialized');
  }

  async stop(): Promise<void> {
    await this.cleanup();
    this.logger.info('NetflixModule stopped');
  }

  // ==========================================================================
  // Task handler
  // ==========================================================================

  async resetPassword(task: Task): Promise<void> {
    const payload = task.payload as unknown as ResetPasswordPayload;
    const { email, password, newPassword } = payload;

    // 0. Setup
    const contextName = `${sanitizeEmail(email)}`;
    this.logger.info(`Starting reset password for ${email} with context ${contextName}`);

    // Create context and page
    const context = await this.getOrCreateContext(contextName);
    const page = await context.newPage();

    try {
      // 1. Auth Check
      await page.goto(CHANGE_PASSWORD_URL);

      this.logger.info('Checking auth state...');

      // Promice.race to detect state
      const loginState = await Promise.race([
        getLoginHelpAnchor(page).waitFor({ state: 'visible', timeout: 30000 }).then(() => 'not_logged_in'),
        getCurrentPasswordInput(page).waitFor({ state: 'visible', timeout: 30000 }).then(() => 'logged_in'),
        page.waitForURL((url) => url.toString().includes(LOGIN_PATH), { timeout: 30000 }).then(() => 'not_logged_in')
      ]);

      if (loginState === 'not_logged_in') {
        // 2.1 Request Reset Password
        this.logger.info('Not logged in, proceeding to request reset link');

        // Navigate to request reset URL in same page
        await page.goto(REQUEST_RESET_URL);

        // Fill email steps
        const emailRadio = getEmailRadio(page);
        await emailRadio.click();

        // Ensure radio is checked (implied by click, but could verify if strict)

        const emailInput = getEmailInput(page);
        await emailInput.fill(email);

        const sendButton = getSendEmailButton(page);
        await sendButton.click();

        this.logger.info('Reset email requested, waiting for event...');

        // Wait for event
        const eventName = `${sanitizeEmail(email)}:NETFLIX_REQ_RESET_PASSWORD`;
        const eventData = await this.waitForTaskEvent<ResetPasswordEventData>(task.id, eventName);

        const resetLink = eventData.data;
        this.logger.info(`Received reset link: ${resetLink}`);

        // Navigate to reset link
        await page.goto(resetLink);

        // Wait for new password input
        await getNewPasswordInput(page).waitFor({ state: 'visible' });

        // Fill new passwords
        await getNewPasswordInput(page).fill(newPassword);
        await getConfirmNewPasswordInput(page).fill(newPassword);

        // Check log all devices
        const checkbox = getLogAllDevicesCheckbox(page);
        if (!(await checkbox.isChecked())) {
          await checkbox.check();
        }

        // Submit
        await getSubmitButton(page).click();

      } else {
        // 2.2 Change Password (Logged In)
        this.logger.info('Logged in, proceeding to change password');

        if (!password) {
          throw new Error('Current password is required for logged-in change password flow');
        }

        await getCurrentPasswordInput(page).fill(password);
        await getNewPasswordInput(page).fill(newPassword);
        await getConfirmNewPasswordInput(page).fill(newPassword);

        // Check log all devices
        const checkbox = getLogAllDevicesCheckbox(page);
        if (!(await checkbox.isChecked())) {
          await checkbox.check();
        }

        // Submit
        await getSubmitButton(page).click();
      }

      await this.sleep(1000);
      this.logger.info('Password reset/change submitted successfully');

      // 3. Save state and cleanup
      await this.saveSession(contextName);

      // 4. send status to server
      try {
        await updateNetflixAccountStatus(this.apiBaseUrl, this.authCredentials, payload.accountId, payload.newPassword)
      } catch (error) {
        this.logger.error(
          `Berhasil reset netflix password pada ${email} tapi gagal update data app: ${error instanceof Error ? error.message : String(error)}`,
          {
            instanceId: this.instanceId
          },
          {
            level: 'NEED_ACTION',
            context: 'ResetNetflixPassword',
            customMessage: `⚠️ Berhasil reset password netflix\ntapi gagal update data di app\n\nSilahkan clear dan ubah password manual pada email tersebut.\nEmail: ${email}\nPassword baru: ${newPassword}`
          });
      }

    } catch (error) {
      this.logger.error(
        `Failed to reset netflix password for ${email}: ${error instanceof Error ? error.message : String(error)}`,
        {instanceId: this.instanceId},
        {
          level: 'NEED_ACTION',
          context: 'ResetNetflixPassword',
          customMessage: `‼️ Gagal reset password netflix pada email ${email}\n\nSilahkan lakukan reset manual.`
        }
      );
      throw error; // Re-throw to fail the task in TaskManager
    } finally {
      await page.close();
      // Save and close only the context used by this task, not all contexts
      await this.saveSession(contextName);
      const ctx = this.getContextByName(contextName);
      if (ctx) {
        await ctx.close();
        this.invalidateContext(contextName);
      }
    }
  }
}
