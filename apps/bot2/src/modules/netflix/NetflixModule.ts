import { BaseModule } from "../../core/BaseModule.js";
import type { ModuleDependencies } from "../../types/module.type.js";
import type { ModuleConfig } from "../../types/config.type.js";
import type { Task } from "../../types/task.type.js";
import { CHANGE_PASSWORD_URL, CLEAR_COOKIE_URL } from "./constants.js";
import { sanitizeEmail } from "./utils.js";
import { ResetPasswordPayload } from "./types/payload.type.js";
import { getPwdCurrentPasswordInput } from "./locators/changePassword.js";
import { updateNetflixAccountStatus } from "./api.js";
import { generateNewPassword, handleChangePassword, handleResetPassword } from "./helpers/reset-password.js";
import { NetflixConfig } from "./types/config.type.js";
import { getLoginState, handleLoginPwdNetflix, handleNetflixMFA } from "./helpers/auth.js";

export class NetflixModule extends BaseModule {
  private moduleConfig: NetflixConfig;

  constructor(
    deps: ModuleDependencies,
    instanceId: string,
    config: ModuleConfig,
  ) {
    super(deps, instanceId, config);
    this.moduleConfig = config as unknown as NetflixConfig;
  }

  // ==========================================================================
  // Abstract method implementations
  // ==========================================================================

  async setupSchema(): Promise<void> {
    // No specific schema needed for this module as provided in specs
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

  // ==========================================================================
  // Task handler
  // ==========================================================================

  async resetPassword(task: Task): Promise<void> {
    let payload: ResetPasswordPayload | null;

    if (typeof task.payload === 'string') {
      try {
        payload = JSON.parse(task.payload);
      } catch (error) {
        payload = null
      }
    } else {
      payload = task.payload as unknown as ResetPasswordPayload;
    }
    
    if (!payload) {
      this.logger.error("Format payload tidak valid");
      throw new Error('Parse payload json failed')
    }

    const { email, password } = payload;
    const newPassword = generateNewPassword(
      this.moduleConfig.new_password_algorithm,
      this.moduleConfig.new_password_length,
      password,
      this.moduleConfig.password_list
    )

    // 0. Setup
    const contextName = `${sanitizeEmail(email)}`;
    this.logger.info(`Memulai reset password ${email}`);

    // Create context and page
    const context = await this.getOrCreateContext(contextName);
    const page = await context.newPage();

    try {
      // 1. Auth Check
      await page.goto(CHANGE_PASSWORD_URL, {waitUntil: 'domcontentloaded'});

      this.logger.info("Cek status login Netflix");
      const loginState = await getLoginState(page, 10_000, (pg, timeout) => [
        getPwdCurrentPasswordInput(pg)
          .waitFor({ state: "visible", timeout })
          .then(() => "login"),
      ])

      if (loginState === "logout") {
        // 2.1 Request Reset Password
        this.logger.info("Belum login, melanjutkan login");
        let isMfaDone = false
        try {
          await handleLoginPwdNetflix(page, {email, password})
          try {
            this.logger.info("Login berhasil, melanjutkan ganti password");
            await handleChangePassword(
              page,
              {email, password, newPassword},
              (level, message, context) => {
                this.logger.log(level, message, context)
              }
            )
          } catch(error) {
            this.logger.error("Gagal mengubah password, melanjutkan MFA");
            isMfaDone = true
            await handleNetflixMFA(
              page,
              {email},
              (level, message, context) => {
                this.logger.log(level, message, context)
              },
              (eventName) => this.subscribeSocketEvent(eventName),
              (eventName) => this.unsubscribeSocketEvent(eventName),
              (eventName) => {
                return this.waitForSocketEvent(eventName, 300_000)
              }
            )
            this.logger.info("MFA berhasil, mengulangi ubah password");
            await handleChangePassword(
              page,
              {email, password, newPassword},
              (level, message, context) => {
                this.logger.log(level, message, context)
              }
            )
          }
        } catch(error) {
          if (!isMfaDone) {
            this.logger.error("Gagal login, fallback dengan reset password");
            await page.goto(CLEAR_COOKIE_URL, {waitUntil: 'domcontentloaded'})
            await handleResetPassword(
              page,
              {
                email,
                newPassword
              },
              (level, message, context) => {
                this.logger.log(level, message, context)
              },
              (eventName) => this.subscribeSocketEvent(eventName),
              (eventName) => this.unsubscribeSocketEvent(eventName),
              (eventName) => {
                return this.waitForSocketEvent(eventName, 300_000)
              }
            )
          } else {
            throw error
          }
        }
      } else {
        this.logger.info("Login berhasil, melanjutkan ganti password");
        try {
          await handleChangePassword(
            page,
            {email, password, newPassword},
            (level, message, context) => {
              this.logger.log(level, message, context)
            }
          )
        } catch(error) {
          this.logger.error("Gagal mengubah password, melanjutkan MFA");
          await handleNetflixMFA(
            page,
            {email},
            (level, message, context) => {
              this.logger.log(level, message, context)
            },
            (eventName) => this.subscribeSocketEvent(eventName),
            (eventName) => this.unsubscribeSocketEvent(eventName),
            (eventName) => {
              return this.waitForSocketEvent(eventName, 300_000)
            }
          )
          this.logger.info("MFA berhasil, mengulangi ubah password");
          await handleChangePassword(
            page,
            {email, password, newPassword},
            (level, message, context) => {
              this.logger.log(level, message, context)
            }
          )
        }
      }

      this.logger.info(`Password Netflix ${email} berhasil diubah: ${newPassword}`);

      // 4. send status to server
      try {
        if (!payload.accountId) {
          throw new Error("Netflix reset payload missing accountId");
        }
        await updateNetflixAccountStatus(
          this.apiBaseUrl,
          this.authCredentials,
          payload.accountId,
          newPassword,
        );
      } catch (error) {
        this.logger.error(
          `Berhasil reset password Netflix pada ${email} tapi gagal update data app: ${error instanceof Error ? error.message : String(error)}`,
          {
            instanceId: this.instanceId,
          },
          {
            level: "NEED_ACTION",
            context: "ResetNetflixPassword",
            customMessage: `⚠️ Berhasil reset password netflix\ntapi gagal update data di app [${error instanceof Error ? error.message : String(error)}]\n\nSilahkan clear dan ubah password manual pada email tersebut.\nEmail: ${email}\nPassword baru: ${newPassword}`,
          },
        );
      }
    } catch (error) {
      this.logger.error(
        `Failed to reset netflix password for ${email}: ${error instanceof Error ? error.message : String(error)}`,
        { instanceId: this.instanceId },
        {
          level: "NEED_ACTION",
          context: "ResetNetflixPassword",
          customMessage: `‼️ Gagal reset password netflix pada email ${email}\n[${error instanceof Error ? error.message : String(error)}]\n\nSilahkan lakukan reset manual.`,
        },
      );
      throw error;
    } finally {
      await this.saveSession(contextName);
      await page.close();
      const ctx = this.getContextByName(contextName);
      if (ctx) {
        await ctx.close();
        this.invalidateContext(contextName);
      }
    }
  }
}
