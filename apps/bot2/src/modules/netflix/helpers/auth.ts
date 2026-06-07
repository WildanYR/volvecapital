import { Page } from "playwright";
import { getLoginHelpAnchor } from "../locators/changePassword.js";
import { LOGIN_PATH, LOGIN_URL, MFA_URL } from "../constants.js";
import { getMfaAlert, getMfaSuccessTitle, getNetflixLogoutDashboardButton, getNetflixLogoutHomeButton, getNetflixMFAEmailButton, getNetflixMFAOtpInput, getNetflixMFAOtpSubmitButton, getProfileManageBtn } from "../locators/dashboard.js";
import { LogContext, LogLevel } from "../../../types/logger.type.js";
import { sanitizeEmail } from "../utils.js";
import { SocketEmailEventData } from "../../../types/connector.type.js";
import { sleep } from "../../../utils/time.js";
import { getLoginAlert, getLoginContinueBtn, getLoginEmailInput, getLoginGetHelpToggle, getLoginPasswordInput, getLoginPinInput, getLoginSigninBtn, getLoginUsePasswordInstead } from "../locators/login.js";

type LoginState = 'login' | 'logout'
type LoginStateCustomCheckFn = (page: Page, timeout: number) => Promise<LoginState>[];

export async function getLoginState(page: Page, timeout = 10_000, customChecks?: LoginStateCustomCheckFn): Promise<LoginState> {
  const additionalPromises = customChecks ? customChecks(page, timeout) : [];
  try {
    const result: LoginState = await Promise.race([
      getLoginHelpAnchor(page).waitFor({state: 'visible', timeout}).then(() => 'logout' as const),
      page.waitForURL((url) => url.href.includes(LOGIN_PATH), {timeout}).then(() => 'logout' as const),
      getNetflixLogoutHomeButton(page).waitFor({state: 'attached', timeout}).then(() => 'login' as const),
      getNetflixLogoutDashboardButton(page).waitFor({state: 'attached', timeout}).then(() => 'login' as const),
      getProfileManageBtn(page).waitFor({state: 'visible', timeout}).then(() => 'login' as const),
      ...additionalPromises
    ])
    return result
  }
  catch {
    const currentUrl = page.url()
    return currentUrl.includes(LOGIN_PATH) ? 'logout' : 'login'
  }
}

export async function handleLoginPwdNetflix(page: Page, payload: {email: string; password: string}, ) {
  const handlePasswordLogin = async () => {
    try {
      const passwordInput = getLoginPasswordInput(page)
      await passwordInput.click()
      await sleep(300 + Math.random() * 200)
      await passwordInput.pressSequentially(payload.password, { delay: 50 + Math.random() * 50 })
      await getLoginSigninBtn(page).click()

      const alert = getLoginAlert(page)
      const loginStatus = await Promise.race([
        alert.waitFor({state: 'visible', timeout: 21_000}).then(() => {
          if (page.url().includes(LOGIN_PATH)) {
            return 'failed' as const
          }
          return 'success' as const
        }),
        getNetflixLogoutDashboardButton(page).waitFor({state: 'visible', timeout: 21_000}).then(() => 'success' as const),
        getNetflixLogoutHomeButton(page).waitFor({state: 'visible', timeout: 21_000}).then(() => 'success' as const),
        getProfileManageBtn(page).waitFor({state: 'visible', timeout: 21_000}).then(() => 'success' as const),
        sleep(20_000).then(() => 'timeout' as const)
      ])

      if (loginStatus !== 'success') {
        let msg = 'Timeout'
        if (loginStatus === 'failed') {
          try {
            msg = await alert.innerText({timeout: 5_000})
          } catch {
            msg = 'error tidak ditemukan'
          }
        }
        throw new Error(msg)
      }
    } catch(error) {
      throw error
    }
  }
  
  try {
    await page.goto(LOGIN_URL, {waitUntil: 'domcontentloaded'})
    
    const emailInput = getLoginEmailInput(page)
    await emailInput.click()
    await sleep(300 + Math.random() * 200)
    await emailInput.pressSequentially(payload.email, { delay: 50 + Math.random() * 50 })

    const contiuneBtn = getLoginContinueBtn(page)
    const initialLoginState = await Promise.race([
      getLoginPasswordInput(page).waitFor({state: 'visible', timeout: 10_000}).then(() => 'password' as const),
      contiuneBtn.waitFor({state: 'visible', timeout: 10_000}).then(() => 'otp' as const)
    ])

    if (initialLoginState === 'password') {
      await handlePasswordLogin()
    } else {
      await contiuneBtn.click()

      const alert = getLoginAlert(page)
      const sendEmailStatus = await Promise.race([
        getLoginPinInput(page).waitFor({state: 'visible', timeout: 21_000}).then(() => 'success' as const),
        alert.waitFor({state: 'visible', timeout: 21_000}).then(() => 'failed' as const),
        sleep(20_000).then(() => 'timeout' as const)
      ])

      if (sendEmailStatus !== 'success') {
        let msg = 'Timeout'
        if (sendEmailStatus === 'failed') {
          try {
            msg = await alert.innerText({timeout: 5_000})
          } catch {
            msg = 'error tidak ditemukan'
          }
        }
        throw new Error(msg)
      }

      await getLoginGetHelpToggle(page).click()
      await getLoginUsePasswordInstead(page).click()
      await sleep(2_000)
      await handlePasswordLogin()
    }
  } catch(error) {
    throw error
  }
}

export async function handleNetflixMFA(
  page: Page,
  payload: {email: string},
  log: (level: LogLevel, message: string, context?: LogContext) => void,
  subscribeSocketEvent: (eventName: string) => Promise<void>,
  unsubscribeSocketEvent: (eventName: string) => Promise<void>,
  waitEventResponse: <T>(eventName: string) => Promise<T>
) {
  const eventName = `${sanitizeEmail(payload.email)}:NETFLIX_MFA`;
  try {
    await subscribeSocketEvent(eventName);
    
    await page.goto(MFA_URL, {waitUntil: 'domcontentloaded'})

    await getNetflixMFAEmailButton(page).click()

    const otpInput = getNetflixMFAOtpInput(page)
    await otpInput.waitFor({state: 'visible', timeout: 15_000})
    
    const eventResponse = await waitEventResponse(eventName)
    let payload: SocketEmailEventData | null
    if (typeof eventResponse === 'string') {
      try {
        payload = JSON.parse(eventResponse);
      } catch (error) {
        payload = null
      }
    } else {
      payload = eventResponse as unknown as SocketEmailEventData;
    }
    
    if (!payload) {
      log('error', "Format email MFA tidak valid");
      throw new Error('Parse email MFA json failed')
    }

    const otpCode = payload.data

    await otpInput.click()
    await sleep(300 + Math.random() * 200)
    await otpInput.pressSequentially(otpCode, { delay: 50 + Math.random() * 50 })
    await getNetflixMFAOtpSubmitButton(page).click()
    
    const mfaAlert = getMfaAlert(page)
    const mfaStatus = await Promise.race([
      getMfaSuccessTitle(page).waitFor({state: 'visible', timeout: 31_000}).then(() => 'success' as const),
      mfaAlert.waitFor({state: 'visible', timeout: 31_000}).then(() => 'failed' as const),
      sleep(30_000).then(() => 'timeout' as const)
    ])

    if (mfaStatus !== 'success') {
      let msg = 'timeout'
      if (mfaStatus === 'failed') {
        try {
          msg = await mfaAlert.innerText({timeout: 10_000})
        } catch {
          msg = 'error tidak ditemukan'
        }
      }
      log('error', `MFA Error: ${msg}`)
      throw new Error(msg)
    }
  }
  catch (error) {
    log('error', `error mfa: ${(error as Error).message}`)
    throw error
  }
  finally {
    await unsubscribeSocketEvent(eventName);
  }
}