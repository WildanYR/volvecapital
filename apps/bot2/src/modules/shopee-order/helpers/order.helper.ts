import { ElementNotFoundError } from "../../../types/errors.js";
import { sleep } from "../../../utils/time.js";
import { MIN_WAIT_TIME_MS, ORDER_CARD_ID_ATTRIBUTE } from "../constants.js";
import { getAturPengirimanButton, getBuyerUsername, getChatButton, getChatInput, getConfirmModal, getJKPAcceptButton, getJKTAcceptButton, getKirimButton, getOrderStatus, getPriceAmount, getProductList, getProductMeta, getProductName, getProductPrice, getProductQty, getTotalPriceCard } from "../locators/order-detail.js";
import { getOrderCards, getTerapkanButton } from "../locators/order-list.js";
import { Page, errors as PlaywrightError } from "playwright";

export async function extractOrderIds(page: Page) {
  const orderCards = getOrderCards(page);
  let orderIds: string[] = [];
  let message: string | null = null

  try {
    await orderCards
      .first()
      .waitFor({ state: "visible", timeout: MIN_WAIT_TIME_MS });
    const allOrderCards = await orderCards.all();
    const orderHrefs = await Promise.all(
      allOrderCards.map(async (locator) =>
        await locator.getAttribute(ORDER_CARD_ID_ATTRIBUTE),
      ),
    );
    orderIds = orderHrefs
      .map((href) => (href ? href.trim().split("/").pop() : null))
      .filter((id): id is string => id !== null && id !== undefined);
  } catch (error) {
    if (!(error instanceof PlaywrightError.TimeoutError)) {
      message = `Order card error: ${(error as Error).message}`
    }
  }

  return {orderIds, message};
}

export async function checkOrderState(
  page: Page,
): Promise<"jkt" | "jkp" | "processed"> {
  const orderStatusLocator = getOrderStatus(page);
  const kirimButton = getKirimButton(page);
  const aturPengirimanButton = getAturPengirimanButton(page);

  try {
    return await Promise.race([
      kirimButton.waitFor({ state: "visible" }).then(() => "jkt" as const),
      aturPengirimanButton
        .waitFor({ state: "visible" })
        .then(() => "jkp" as const),
      orderStatusLocator
        .waitFor({ state: "visible" })
        .then(() => "processed" as const),
    ]);
  } catch {
    throw new ElementNotFoundError(
      "tombol modal kirim atau status order tidak ditemukan",
    );
  }
}

export async function extractUsername(page: Page, orderId: string) {
  let username = orderId
  let message: string | null = null
  try {
    const usernameLocator = getBuyerUsername(page);
    await usernameLocator.waitFor({ state: "attached" });
    username = (await usernameLocator.textContent()) || orderId;
  } catch {
    message = `${orderId}: username tidak ditemukan, menggunakan order ID`
  }

  return {username, message}
}

export async function extractProducts(
  page: Page,
): Promise<{ name: string; qty: number; price: number; variant?: string }[]> {
  const productRowLocator = getProductList(page);

  try {
    await productRowLocator.first().waitFor({ state: "attached" });
  } catch {
    throw new ElementNotFoundError(
      "List produk di halaman pesanan tidak ditemukan",
    );
  }

  const allProductRows = await productRowLocator.all();

  if (!allProductRows.length) {
    throw new ElementNotFoundError(
      "List produk di halaman pesanan tidak ditemukan",
    );
  }

  const productsWithInvalid = await Promise.all(
    allProductRows.map(async (pr) => {
      const [productName, productVariant, productQty, productPrice] = await Promise.all([
        getProductName(pr)
          .first()
          .textContent({ timeout: 1000 })
          .catch(() => null),
        getProductMeta(pr)
          .first()
          .textContent({ timeout: 1000 })
          .catch(() => null),
        getProductQty(pr)
          .first()
          .textContent({ timeout: 1000 })
          .catch(() => null),
        getProductPrice(pr)
          .first()
          .textContent({ timeout: 1000 })
          .catch(() => null)
      ]);

      let normalizedVariant;

      if (productVariant?.trim().toLowerCase().startsWith("variasi:")) {
        normalizedVariant = productVariant
          .replace(/^Variasi:\s*/i, "")
          .trim();
      } else {
        normalizedVariant = undefined;
      }

      return {
        name: productName?.trim() ?? "",
        variant: normalizedVariant,
        qty: productQty ? parseInt(productQty.trim().replace(/\D+/g, "")) : 0,
        price: productPrice ? parseInt(productPrice.trim().replace(/\D+/g, "")) : 0
      };
    }),
  );

  const products = productsWithInvalid.filter((p) => !!p.name && p.qty > 0);

  if (!products.length) {
    throw new ElementNotFoundError(
      "nama atau qty dalam list produk tidak ditemukan",
    );
  }

  return products;
}

export async function extractTotalPrice(page: Page): Promise<number> {
  const totalPriceCard = getTotalPriceCard(page);
  const priceLocator = getPriceAmount(totalPriceCard);

  try {
    await priceLocator.waitFor({ state: "attached" });
  } catch {
    throw new ElementNotFoundError("harga total pesanan tidak ditemukan");
  }

  return parseInt(
    (await priceLocator.textContent())?.replace(/\D+/g, "") || "0",
  );
}

export async function processShipping(page: Page): Promise<"jkt" | "jkp"> {
  const kirimButton = getKirimButton(page);
  const aturPengirimanButton = getAturPengirimanButton(page);

  let jasaKirim: "jkt" | "jkp";

  try {
    jasaKirim = await Promise.race([
      kirimButton
        .first()
        .click()
        .then(() => "jkt" as const),
      aturPengirimanButton
        .first()
        .click()
        .then(() => "jkp" as const),
    ]);
  } catch {
    throw new ElementNotFoundError("tombol modal kirim tidak ditemukan");
  }

  // Click confirm button
  const confirmModalBox = getConfirmModal(page);
  const jktAccButton = getJKTAcceptButton(confirmModalBox);
  const jkpAccButton = getJKPAcceptButton(confirmModalBox);

  try {
    await Promise.race([
      jktAccButton.first().click(),
      jkpAccButton.first().click(),
    ]);
  } catch {
    throw new ElementNotFoundError("tombol konfirmasi kirim tidak ditemukan");
  }

  // Wait for modal to close
  if (jasaKirim === "jkt") {
    await Promise.race([
      jktAccButton.waitFor({ state: "hidden" }),
      sleep(MIN_WAIT_TIME_MS),
    ]);
  } else {
    await Promise.race([
      jkpAccButton.waitFor({ state: "hidden" }),
      sleep(MIN_WAIT_TIME_MS),
    ]);
  }

  return jasaKirim;
}

export async function ensureChatOpen(page: Page) {
  try {
    await getChatButton(page).first().click();
  } catch {
    throw new ElementNotFoundError("tombol Chat Sekarang tidak ditemukan");
  }

  const chatInput = getChatInput(page);
  try {
    await chatInput.waitFor({ state: "visible" });
  } catch {
    throw new ElementNotFoundError(
      "input untuk mengirim chat tidak ditemukan",
    );
  }

  return chatInput;
}

export async function refreshOrderList(page: Page) {
  try {
    await getTerapkanButton(page).first().click({ timeout: 2000 });
  } catch {
    await page.reload();
  }
}