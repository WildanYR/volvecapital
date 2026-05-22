import { Page } from "playwright";
import { getLoginAlert, getLoginButton, getLoginKeyInput, getPasswordInput } from "../locators/login.js";
import { ElementNotFoundError } from "../../../types/errors.js";
import { URL_PATTERNS, ORDER_LIST_URL, VERIFY_TIMEOUT_MS, MIN_WAIT_TIME_MS } from "../constants.js";
import { getAccountInfo } from "../locators/order-list.js";
import { getVerifyOpenModalButton, getVerifyByWhatsappButton } from "../locators/verify.js";
import { sleep } from "../../../utils/time.js";

export async function handleLogin(page: Page, loginKey: string, password: string): Promise<void> {
  await page.waitForLoadState("domcontentloaded");

  try {
    await getLoginKeyInput(page).first().fill(loginKey);
    await getPasswordInput(page).first().fill(password);
    await getLoginButton(page).first().click();
  } catch (error) {
    throw new ElementNotFoundError(
      "Login Gagal: input loginKey, password, atau tombol login tidak ditemukan",
    );
  }

  // Wait for login result
  let afterLoginStatus = "";
  try {
    afterLoginStatus = await Promise.race([
      page
        .waitForURL((url) => url.pathname.includes(URL_PATTERNS.VERIFY))
        .then(() => "verify"),
      getAccountInfo(page)
        .waitFor({ state: "visible" })
        .then(() => "success"),
      getLoginAlert(page)
        .waitFor({ state: "visible" })
        .then(() => "error"),
    ]);
  } catch {
    throw new ElementNotFoundError("Login Gagal: status login tidak berubah");
  }

  if (afterLoginStatus === "verify") {
    await handleVerify(page);
  } else if (afterLoginStatus === "error") {
    const errorMessage =
      (await getLoginAlert(page).textContent())?.trim() || "Unknown error";
    throw new Error(`Login ke Shopee Gagal: ${errorMessage}`);
  }
}

export async function handleVerify(page: Page): Promise<void> {
  try {
    await getVerifyOpenModalButton(page).first().click();
    await getVerifyByWhatsappButton(page).first().click();
  } catch {
    throw new ElementNotFoundError(
      "Verify Gagal: modal untuk verify tidak ditemukan",
    );
  }

  // Wait for verify to complete (max 10 minutes)
  let elapsedTimeMs = 0;
  while (
    page.url().includes(URL_PATTERNS.VERIFY) &&
    elapsedTimeMs < VERIFY_TIMEOUT_MS
  ) {
    elapsedTimeMs += MIN_WAIT_TIME_MS;
    await sleep(MIN_WAIT_TIME_MS);
  }

  if (elapsedTimeMs >= VERIFY_TIMEOUT_MS) {
    throw new Error(
      "Verify Shopee Gagal: timeout lebih dari 10 menit tanpa tindakan",
    );
  }

  // Redirect ke order list jika belum di halaman yang benar
  if (!page.url().includes(URL_PATTERNS.NEW_ORDER_LIST)) {
    await page.goto(ORDER_LIST_URL, { waitUntil: "domcontentloaded" });
  }
}