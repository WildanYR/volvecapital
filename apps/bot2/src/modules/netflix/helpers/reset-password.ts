import { Page } from "playwright";
import { NewPasswordAlgorithm } from "../types/password.type.js";
import { CHANGE_PASSWORD_URL, CLEAR_COOKIE_URL, REQUEST_RESET_URL, RESET_PASSWORD_SUCCESS_PATTERN } from "../constants.js";
import { getRstPwdAlert, getRstPwdEmailInput, getRstPwdEmailRadio, getRstPwdEmailSentTitle, getRstPwdEmailValidationError, getRstPwdSendEmailButton } from "../locators/requestReset.js";
import { getPwdAlert, getPwdAllInputValidation, getPwdConfirmNewPasswordInput, getPwdCurrentPasswordInput, getPwdLogAllDevicesCheckbox, getPwdNewPasswordInput, getPwdSubmitButton } from "../locators/changePassword.js";
import { sanitizeEmail } from "../utils.js";
import { sleep } from "../../../utils/time.js";
import { LogContext, LogLevel } from "../../../types/logger.type.js";
import { SocketEmailEventData } from "../../../types/connector.type.js";

export function generateNewPassword(
  algorithm: NewPasswordAlgorithm = 'random',
  length: number = 8,
  currentPassword: string = '',
  list: string[] = [],
): string {
  
  const letters: string = 'abcdefghjkmnpqrstuvwxyz';
  const numbers: string = '0123456789';
  const alphaNumeric: string = letters + numbers;

  // Helper function dengan return type string
  const getRandomChar = (source: string | string[]): string => {
    return source[Math.floor(Math.random() * source.length)];
  };

  // Validasi fallback jika algoritma 'list' tapi array kosong
  if (algorithm === 'list' && (!list || !list.length)) {
    algorithm = 'random';
  }

  let newPassword = '';
  let attempts = 0;

  do {
    newPassword = '';

    switch (algorithm) {
      case 'list': {
        newPassword = getRandomChar(list);
        break;
      }

      case 'random': {
        for (let i = 0; i < length; i++) {
          newPassword += getRandomChar(alphaNumeric);
        }
        break;
      }

      case 'wordNumber': {
        const letterLength = Math.ceil(length / 2);
        const numberLength = length - letterLength;

        for (let i = 0; i < letterLength; i++) {
          newPassword += getRandomChar(letters);
        }
        for (let i = 0; i < numberLength; i++) {
          newPassword += getRandomChar(numbers);
        }
        break;
      }

      case 'repeatWord': {
        if (length % 2 === 0) {
          // Pola Genap: len 6 (dnndnn), len 8 (tofftoff) -> chunk + chunk
          const sliceLen = length / 2;
          let chunk = '';
          for (let i = 0; i < sliceLen; i++) {
            chunk += getRandomChar(letters);
          }
          
          if (length === 4) { // Pola khusus len 4 sesuai contoh: ghhg (mirror)
            newPassword = chunk + chunk.split('').reverse().join('');
          } else {
            newPassword = chunk + chunk;
          }
        } else {
          // Pola Ganjil: len 3 (xyy), len 5 (jkkjk)
          const baseLen = Math.floor(length / 2);
          let firstPart = '';
          for (let i = 0; i < baseLen; i++) {
            firstPart += getRandomChar(letters);
          }
          const middleChar = getRandomChar(letters);
          
          if (length === 3) {
            newPassword = firstPart + middleChar + middleChar;
          } else {
            newPassword = firstPart + middleChar + firstPart;
          }
        }

        // Failsafe adjustment untuk memastikan panjang string pas
        if (newPassword.length > length) {
          newPassword = newPassword.substring(0, length);
        } else {
          while (newPassword.length < length) {
            newPassword += getRandomChar(letters);
          }
        }
        break;
      }
    }

    attempts++;
    // Terus mengulang jika password baru persis sama dengan currentPassword (maksimal 20 kali coba)
  } while (newPassword === currentPassword && attempts < 20);

  return newPassword;
}

export async function handleResetPassword(
  page: Page,
  payload: {email: string; newPassword: string},
  log: (level: LogLevel, message: string, context?: LogContext) => void,
  subscribeSocketEvent: (eventName: string) => Promise<void>,
  unsubscribeSocketEvent: (eventName: string) => Promise<void>,
  waitEventResponse: <T>(eventName: string) => Promise<T>
) {
  const eventName = `${sanitizeEmail(payload.email)}:NETFLIX_REQ_RESET_PASSWORD`;
  let isResetPasswordSuccess = false
  try {
    await subscribeSocketEvent(eventName);

    for (let attempt = 1; attempt <= 3; attempt++) {
      if (attempt > 1) {
        await page.goto(CLEAR_COOKIE_URL, {waitUntil: 'domcontentloaded'})
      }

      await page.goto(REQUEST_RESET_URL, {waitUntil: 'domcontentloaded'})
      await getRstPwdEmailRadio(page).click()
      const emailInput = getRstPwdEmailInput(page)
      await emailInput.click()
      await sleep(300 + Math.random() * 200)
      await emailInput.pressSequentially(payload.email, { delay: 50 + Math.random() * 50 })
      await getRstPwdSendEmailButton(page).click()

      const rstPwdAlert = getRstPwdAlert(page)
      const rstPwdValidationError = getRstPwdEmailValidationError(page)
      const resetStatus = await Promise.race([
        rstPwdAlert.waitFor({state: 'visible', timeout: 16_000}).then(() => 'failed' as const),
        rstPwdValidationError.waitFor({state: 'visible', timeout: 16_000}).then(() => 'validationError' as const),
        getRstPwdEmailSentTitle(page).waitFor({state: 'visible', timeout: 16_000}).then(() => 'success' as const),
        sleep(15_000).then(() => 'timeout' as const)
      ])
      if (resetStatus !== 'success') {
        let msg = ''
        if (resetStatus === 'timeout') {
          msg = 'timeout'
        }
        if (resetStatus === 'failed') {
          try {
            msg = await rstPwdAlert.innerText()
          } catch {
            msg = 'status error tidak didapatkan'
          }
        }
        if (resetStatus === 'validationError') {
          try {
            msg = await rstPwdValidationError.innerText()
          } catch {
            msg = 'validasi error tidak ditemukan'
          }
        }

        log('warn', `mengulang reset password (${attempt}/3): ${msg}`)
        continue
      }

      const eventResponse = await waitEventResponse(eventName)
      let eventObj: SocketEmailEventData | null
      if (typeof eventResponse === 'string') {
        try {
          eventObj = JSON.parse(eventResponse);
        } catch (error) {
          eventObj = null
        }
      } else {
        eventObj = eventResponse as unknown as SocketEmailEventData;
      }
      
      if (!eventObj) {
        log('error', "Format email reset link tidak valid");
        throw new Error('Parse email reset link json failed')
      }

      const resetLink = eventObj.data

      await page.goto(resetLink, {waitUntil: 'domcontentloaded'})
      const newPwdInput = getPwdNewPasswordInput(page)
      await newPwdInput.click()
      await sleep(300 + Math.random() * 200)
      await newPwdInput.pressSequentially(payload.newPassword, { delay: 50 + Math.random() * 50 })

      const confirmPwdInput = getPwdConfirmNewPasswordInput(page)
      await confirmPwdInput.click()
      await sleep(300 + Math.random() * 200)
      await confirmPwdInput.pressSequentially(payload.newPassword, { delay: 50 + Math.random() * 50 })

      const checkbox = getPwdLogAllDevicesCheckbox(page);
      if (!(await checkbox.isChecked())) {
        await checkbox.check();
      }

      await getPwdSubmitButton(page).click();
      
      const alert = getRstPwdAlert(page)
      const resetPasswordStatus = await Promise.race([
        page.waitForURL((url) => url.href.includes(RESET_PASSWORD_SUCCESS_PATTERN), {timeout: 91_000}).then(() => 'success' as const),
        alert.waitFor({state: 'visible', timeout: 91_000}).then(() => 'failed' as const),
        sleep(90_000).then(() => 'timeout' as const)
      ])

      if (resetPasswordStatus === 'success') {
        isResetPasswordSuccess = true
        break;
      } else {
        let msg = ''
        if (resetPasswordStatus === 'failed') {
          try {
            msg = await alert.innerText({timeout: 10_000})
          } catch {
            msg = 'error tidak ditemukan'
          }
        } else {
          msg = 'timeout'
        }
        log('warn', `mengulang reset password (${attempt}/3): ${msg}`)
      }
    }

    if (!isResetPasswordSuccess) {
      throw new Error("gagal setelah 3 kali percobaan");
    }
  }
  catch (error) {
    log('error', `error reset password: ${(error as Error).message}`)
    throw error
  }
  finally {
    await unsubscribeSocketEvent(eventName);
  }
}

export async function handleChangePassword(
  page: Page,
  payload: {email: string; password: string; newPassword: string},
  log: (level: LogLevel, message: string, context?: LogContext) => void,
) {
  try {
    await page.goto(CHANGE_PASSWORD_URL, {waitUntil: 'domcontentloaded'})

    const currentPwdInput = getPwdCurrentPasswordInput(page)
    await currentPwdInput.click()
    await sleep(300 + Math.random() * 200)
    await currentPwdInput.pressSequentially(payload.password, { delay: 50 + Math.random() * 50 })

    const newPwdInput = getPwdNewPasswordInput(page)
    await newPwdInput.click()
    await sleep(300 + Math.random() * 200)
    await newPwdInput.pressSequentially(payload.newPassword, { delay: 50 + Math.random() * 50 })

    const confirmPwdInput = getPwdConfirmNewPasswordInput(page)
    await confirmPwdInput.click()
    await sleep(300 + Math.random() * 200)
    await confirmPwdInput.pressSequentially(payload.newPassword, { delay: 50 + Math.random() * 50 })

    const checkbox = getPwdLogAllDevicesCheckbox(page)
    if (!(await checkbox.isChecked())) {
      await checkbox.check()
    }

    await getPwdSubmitButton(page).click()

    const allInputValidation = getPwdAllInputValidation(page)
    const alert = getPwdAlert(page)
    const changePasswordStatus = await Promise.race([
      allInputValidation.waitFor({state: 'visible', timeout: 31_000}).then(() => 'validationError' as const),
      alert.waitFor({state: 'visible', timeout: 31_000}).then(() => 'alertError' as const),
      page.waitForURL((url) => url.href.includes(RESET_PASSWORD_SUCCESS_PATTERN), {timeout: 31_000}).then(() => 'success' as const)
    ])
    
    if (changePasswordStatus !== 'success') {
      let errorMsg = ''
      if (changePasswordStatus === 'validationError') {
        try {
          errorMsg = (await allInputValidation.allInnerTexts()).join(', ')
        } catch {
          errorMsg = 'pesan error vaildasi tidak ditemukan'
        }
      }
      if (changePasswordStatus === 'alertError') {
        try {
          errorMsg = await alert.innerText()
        } catch {
          errorMsg = 'pesan error tidak ditemukan'
        }
      }
      throw new Error(errorMsg)
    }
  }
  catch(error) {
    log('error', `error ubah password: ${(error as Error).message}`)
    throw error
  }
}