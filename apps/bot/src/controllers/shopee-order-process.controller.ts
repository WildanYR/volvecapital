import { BrowserContext, Page, errors as PlaywrightErrors } from 'patchright';
import colors from 'yoctocolors';
import { Configuration } from '../types/config.type.js';
import {
  SHP_CHAT_BUTTON,
  SHP_CHAT_INPUT,
  SHP_CONFIRM_ACCEPT_JKP_BUTTON,
  SHP_CONFIRM_ACCEPT_JKT_BUTTON,
  SHP_CONFIRM_MODAL_BOX,
  SHP_CONFIRM_MODAL_JKP_BUTTON,
  SHP_CONFIRM_MODAL_JKT_BUTTON,
  SHP_FINAL_PRICE_CARD,
  SHP_FINAL_PRICE_TEXT,
  SHP_ORDER_DETAIL_URL,
  SHP_ORDER_PRODUCT_LIST,
  SHP_ORDER_PRODUCT_NAME,
  SHP_ORDER_PRODUCT_QTY,
  SHP_ORDER_STATUS_NAME,
  SHP_ORDER_USERNAME,
  SHP_STATUS_CANCELLED,
  SHP_STATUS_PROCESSED,
} from '../constants/shopee.const.js';
import { getLocator } from '../utils/page-locator.js';
import {
  AlreadyProcessedError,
  ElementNotFoundError,
  NoAccountError,
  NoProductBindError,
  TransactionExistNoAccountError,
} from '../utils/errors.js';
import { jitter, sleep } from '../utils/time.js';
import { updateOrderStatus } from '../core/store.js';
import { checkProductNames } from '../services/platform-product.service.js';
import { TransactionAccountPayload } from '../types/transaction-account.type.js';
import { generateAccountTransaction } from '../services/transaction-account.service.js';
import { AccountUser, FailedAccountUser } from '../types/account.type.js';
import { copyAccountTemplate } from '../utils/copy-template.js';
import { logger } from '../utils/logger.js';
import { ShopeeShop } from '../types/shopee-shop.type.js';

async function ensureChatOpen(page: Page) {
  const chatButtonLocator = getLocator(page, SHP_CHAT_BUTTON);
  try {
    await chatButtonLocator.first().click();
  } catch {
    throw new ElementNotFoundError('tombol Chat Sekarang tidak ditemukan');
  }

  const chatInputLocator = getLocator(page, SHP_CHAT_INPUT);
  try {
    await chatInputLocator.waitFor({ state: 'visible' });
  } catch {
    throw new ElementNotFoundError('input untuk mengirim chat tidak ditemukan');
  }

  return chatInputLocator;
}

function headerLogText(shopName: string, orderId: string) {
  return `${colors.yellowBright(shopName)} ${colors.bold(orderId)}`;
}

export function ProcessShopeeOrder(
  browserContext: BrowserContext,
  orderId: string,
  orderStatus: string,
  config: Configuration,
  shopData: ShopeeShop,
) {
  return async () => {
    logger.log(`${headerLogText(shopData.name, orderId)} Memproses Pesanan`);
    let order_status = orderStatus;
    const page = await browserContext.newPage();
    page.setDefaultTimeout(config.timeout);
    page.setDefaultNavigationTimeout(config.timeout);

    const orderUrl = SHP_ORDER_DETAIL_URL(orderId);
    await page.goto(orderUrl, { waitUntil: 'domcontentloaded' });

    for (let attempt = 1; attempt <= config.max_retry_attempt; attempt++) {
      try {
        /**
         * ======================
         * Cek Order Status
         * ======================
         */
        const orderStatusLocator = getLocator(page, SHP_ORDER_STATUS_NAME);
        const confirmJktModalButton = getLocator(page, SHP_CONFIRM_MODAL_JKT_BUTTON);
        const confirmJkpModalButton = getLocator(page, SHP_CONFIRM_MODAL_JKP_BUTTON);

        let orderState: string;
        try {
          orderState = await Promise.race([
            confirmJktModalButton.waitFor({ state: 'visible' }).then(() => 'jkt'),
            confirmJkpModalButton.waitFor({ state: 'visible' }).then(() => 'jkp'),
            orderStatusLocator.waitFor({ state: 'visible' }).then(() => 'processed'),
          ]);
        } catch {
          throw new ElementNotFoundError('tombol modal kirim atau status order tidak ditemukan');
        }

        if (orderState === 'processed') {
          const stateText = (await orderStatusLocator.textContent())?.trim() || '';
          if (!stateText) {
            throw new ElementNotFoundError('status pesanan tidak ditemukan');
          }
          if (SHP_STATUS_PROCESSED.test(stateText) && order_status !== 'processing') {
            throw new AlreadyProcessedError('Pesanan telah diproses manual');
          }
          if (SHP_STATUS_CANCELLED.test(stateText)) {
            throw new AlreadyProcessedError('Pesanan dibatalkan pembeli');
          }
        }
        /**
         * ======================
         * Get Order Data: Username
         * ======================
         */
        let username: string;
        try {
          const usernameLocator = getLocator(page, SHP_ORDER_USERNAME);
          await usernameLocator.waitFor({ state: 'attached' });
          username = (await usernameLocator.textContent()) || orderId;
        } catch (error) {
          logger.warn(
            `${headerLogText(shopData.name, orderId)} username tidak ditemukan. mengganti dengan id pesanan`,
            {
              notifyContext: 'WARN',
              notifyMessage: `⚠️ **${shopData.name}** *${orderId}*\nusername tidak ditemukan. mengganti dengan id pesanan`,
            },
          );
          username = orderId;
        }

        /**
         * ======================
         * Get Order Data: Produk
         * ======================
         */
        const productRowLocator = getLocator(page, SHP_ORDER_PRODUCT_LIST);
        try {
          await productRowLocator.first().waitFor({ state: 'attached' });
        } catch (error) {
          throw new ElementNotFoundError('List produk di halaman pesanan shopee tidak ditemukan');
        }

        const allProductRow = await productRowLocator.all();

        if (!allProductRow.length) {
          throw new ElementNotFoundError('List produk di halaman pesanan shopee tidak ditemukan');
        }

        const productsWithInvalid = await Promise.all(
          allProductRow.map(async (pr) => {
            const productNameLocator = getLocator(pr, SHP_ORDER_PRODUCT_NAME);
            const productQtyLocator = getLocator(pr, SHP_ORDER_PRODUCT_QTY);

            const [productName, productQty] = await Promise.all([
              productNameLocator
                .first()
                .textContent({ timeout: 1000 })
                .catch(() => null),
              productQtyLocator
                .first()
                .textContent({ timeout: 1000 })
                .catch(() => null),
            ]);

            return {
              name: productName?.trim() ?? '',
              qty: productQty ? parseInt(productQty.trim().replace(/\D+/g, '')) : 0,
            };
          }),
        );

        const products: { name: string; qty: number }[] = [];

        for (const p of productsWithInvalid) {
          if (!!p.name && p.qty > 0) {
            products.push(p);
          }
        }

        if (!products.length) {
          throw new ElementNotFoundError('nama atau qty dalam list produk tidak ditemukan');
        }

        /**
         * ======================
         * Get Order Data: Harga Total
         * ======================
         */
        const totalPriceCardLocator = getLocator(page, SHP_FINAL_PRICE_CARD);
        const totalPriceLocator = getLocator(totalPriceCardLocator, SHP_FINAL_PRICE_TEXT);

        try {
          await totalPriceLocator.waitFor({ state: 'attached' });
        } catch (error) {
          throw new ElementNotFoundError('harga total pesanan tidak ditemukan');
        }

        const totalPrice = parseInt(
          (await totalPriceLocator.textContent())?.replace(/\D+/g, '') || '0',
        );

        /**
         * ======================
         * Proses Pengiriman
         * ======================
         */
        let jasaKirim = '';
        if (order_status !== 'processing') {
          try {
            jasaKirim = await Promise.race([
              confirmJktModalButton
                .first()
                .click()
                .then(() => 'jkt'),
              confirmJkpModalButton
                .first()
                .click()
                .then(() => 'jkp'),
            ]);
          } catch {
            throw new ElementNotFoundError('tombol modal kirim tidak ditemukan');
          }

          const confirmModalBox = getLocator(page, SHP_CONFIRM_MODAL_BOX);
          const acceptJktButton = getLocator(confirmModalBox, SHP_CONFIRM_ACCEPT_JKT_BUTTON);
          const acceptJkpButton = getLocator(confirmModalBox, SHP_CONFIRM_ACCEPT_JKP_BUTTON);

          try {
            await Promise.race([acceptJktButton.first().click(), acceptJkpButton.first().click()]);
          } catch {
            throw new ElementNotFoundError('tombol konfirmasi kirim tidak ditemukan');
          }

          try {
            if (jasaKirim === 'jkt') {
              await acceptJktButton.waitFor({ state: 'hidden' });
            } else if (jasaKirim === 'jkp') {
              await acceptJkpButton.waitFor({ state: 'hidden' });
            } else {
              await sleep(config.min_wait_time_ms);
            }
          } catch {}

          updateOrderStatus(orderId, 'processing', shopData.name);
          order_status = 'processing';
        }

        /**
         * ======================
         * Buka Chat
         * ======================
         */

        await page.reload({ waitUntil: 'domcontentloaded' });

        const chatInputLocator = await ensureChatOpen(page);

        /**
         * ======================
         * Request akun ke server
         * ======================
         */
        const platformProducts = await checkProductNames(products.map((p) => p.name));
        const productList: { id: string; name: string }[] = [];

        for (const pp of platformProducts) {
          if (!pp.isFound) {
            logger.warn(
              `${headerLogText(shopData.name, orderId)} ${pp.name} tidak terdaftar di produk platform aplikasi`,
              {
                notifyContext: 'WARN',
                notifyMessage: `⚠️ **${shopData.name}** *${orderId}*\n${pp.name} tidak terdaftar di produk platform aplikasi`,
              },
            );
          } else {
            for (const p of products) {
              if (pp.name === p.name) {
                for (let i = 0; i < p.qty; i++) {
                  productList.push({
                    id: pp.product_variant_id,
                    name: pp.name,
                  });
                }
              }
            }
          }
        }

        if (!productList.length) {
          throw new NoProductBindError(
            'Tidak ada nama produk yang terdaftar di produk platform aplikasi',
          );
        }

        const transactionAccountPayload: TransactionAccountPayload = {
          customer: username,
          platform: 'Shopee',
          total_price: totalPrice,
          items: productList.map((p) => ({ product_variant_id: p.id })),
        };
        const generatedAccount = await generateAccountTransaction(
          orderId,
          transactionAccountPayload,
        );

        /**
         * ======================
         * Kirim akun di chat
         * ======================
         */
        let messageToSend: string[] = [];
        for (const acc of generatedAccount) {
          if ((acc as FailedAccountUser).availability_status) {
            const status =
              (acc as FailedAccountUser).availability_status === 'COOLDOWN'
                ? 'COOLDOWN'
                : 'AKUN TIDAK TERSEDIA';
            logger.warn(
              `${headerLogText(shopData.name, orderId)} gagal generate akun untuk item ${(acc as FailedAccountUser).product_name}. status: ${status}`,
              {
                notifyContext: 'NEED_ACTION',
                notifyMessage: `⚠️ **${shopData.name}** *${orderId}*\ngagal generate akun untuk item ${(acc as FailedAccountUser).product_name}. status: ${status}\n\nSilahkan buatkan akun manual dan kirim di transaksi ${orderUrl}`,
              },
            );
          } else {
            const template = copyAccountTemplate(
              (acc as AccountUser).profile,
              (acc as AccountUser).account,
            );
            messageToSend.push(template);
          }
        }

        if (!messageToSend.length) {
          throw new NoAccountError('Tidak ada akun yang bisa dikirimkan');
        }

        if (config.chat_template?.send_before?.length) {
          messageToSend = [...config.chat_template.send_before, ...messageToSend];
        }
        if (config.chat_template?.send_after?.length) {
          messageToSend = [...messageToSend, ...config.chat_template.send_after];
        }

        for (const msg of messageToSend) {
          await chatInputLocator.fill(msg);
          await page.keyboard.press('Enter');
          await sleep(500);
        }

        updateOrderStatus(orderId, 'success', shopData.name);

        logger.log(`${headerLogText(shopData.name, orderId)} Pesanan berhasil diproses`, {
          notifyContext: 'INFO',
          notifyMessage: `✅ **${shopData.name}** *${orderId}*\nPesanan berhasil diproses`,
        });
        if (jasaKirim === 'jkp') {
          logger.warn(
            `${headerLogText(shopData.name, orderId)} Jasa kirim toko tidak terdeteksi, silahkan chat CS shopee untuk pengiriman pada transaksi ${orderUrl}`,
            {
              notifyContext: 'NEED_ACTION',
              notifyMessage: `🛵 **${shopData.name}** *${orderId}*\nJasa kirim toko tidak terdeteksi, silahkan chat CS shopee untuk pengiriman pada transaksi ${orderUrl}`,
            },
          );
        }
        break;
      } catch (error) {
        const nonRetryError =
          error instanceof AlreadyProcessedError ||
          error instanceof NoAccountError ||
          error instanceof NoProductBindError ||
          error instanceof TransactionExistNoAccountError;

        if (!nonRetryError && attempt < config.max_retry_attempt) {
          logger.error(
            `${headerLogText(shopData.name, orderId)} Mengulangi proses pesanan (${attempt + 1}/${config.max_retry_attempt}): ${(error as Error).message}`,
            (error as Error).stack,
          );
          const waitTime = jitter(400 * Math.pow(2, attempt - 1));
          await sleep(waitTime);
          await page.reload({ waitUntil: 'domcontentloaded' });
          continue;
        }

        updateOrderStatus(orderId, 'failed', shopData.name);
        logger.error(
          `${headerLogText(shopData.name, orderId)} Gagal memproses pesanan: ${(error as Error).message}`,
          (error as Error).stack,
          {
            notifyContext: 'ERROR',
            notifyMessage: `**${shopData.name}** *${orderId}*\nGagal memproses pesanan: ${(error as Error).message}\n\nUrl Pesanan: ${orderUrl}`,
          },
        );
        if (config.chat_template?.send_fallback?.length) {
          try {
            await page.reload({ waitUntil: 'domcontentloaded' });
            const chatInputLocator = await ensureChatOpen(page);
            for (const msg of config.chat_template.send_fallback) {
              await chatInputLocator.fill(msg);
              await page.keyboard.press('Enter');
              await sleep(500);
            }
          } catch {
            logger.error(
              `${headerLogText(shopData.name, orderId)} Gagal mengirim pesan fallback: chat input tidak ditemukan`,
              undefined,
              {
                notifyContext: 'ERROR',
                notifyMessage: `**${shopData.name}** *${orderId}*\nGagal mengirim pesan fallback: chat input tidak ditemukan`,
              },
            );
          }
        }
        break;
      }
    }

    await page.close();
  };
}
