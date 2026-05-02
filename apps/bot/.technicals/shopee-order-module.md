# Shopee Order Module

## Description

ini adalah module untuk memproses order baru di seller shopee dashboard.

## Locator, URL, and Constant

### URL

- order list: https://seller.shopee.co.id/portal/sale/order?type=toship
- order detail: https://seller.shopee.co.id/portal/sale/order/${id}
- new order list pattern: ?type=toship
- login pattern: /login
- login verify pattern: /verify

### Constant

- order status already processes: /Sudah\s*Kirim/i
- order status cancelled: /dibatalkan/i
- order card attribute to get order id: href

### Locator

#### Login Page

- loginkey input: input[name="loginKey"]
- login password input: input[name="password"]
- login button: { name: 'Log in', role: 'button' }
- login error alert box: { role: 'alert' }

#### Verify Page
- modal to verify login: { name: 'Verifikasi melalui link', role: 'button' }
  - verify login button: { name: 'Click the button to send the authentication link through WhatsAPP', role: 'button' }

#### Order List Page

- order cards: a.order-card
- account info: .account-info

#### Order Detail Page

- order status: .order-status-wrapper .name
- modal confirm order: .eds-modal__box
  - confirm step 1 button (jasa kirim toko): { name: 'Kirim', role: 'button' }
  - confirm step 2 button (jasa kirim toko): { name: 'Kirim', role: 'button' }
  - confirm step 1 button (jasa kirim standart): { name: 'Atur Pengiriman', role: 'button' }
  - confirm step 2 button (jasa kirim standart): { name: 'Konfirmasi', role: 'button' }
- buyer username: .username
- product list: .product-list-item
  - product name: .product-name
  - product qty: .qty
- total price card: div[type="FinalAmount"]
  - price (inside price card): .amount
- open chat button: { name: 'Chat Sekarang', role: 'button' }
- chat input (after chat panel open): { type: 'placeholder', name: 'Tulis pesan' }

## Functionality

### Loop

ini adalah fungsi yang berada dalam executeLoop module.
di bawah ini aku berikan kode dari app lain yang sudah berjalan, analisa dan pahami flownya kemudian implementasikan ke dalam module ini.

```typescript
export function loopCheckOrder(
  page: Page,
  shopData: ShopeeShop,
  config: Configuration,
  workerManager: WorkerManager,
) {
  return async () => {
    /**
     * ======================
     * Pastikan Login dan URL ada di Pesanan Belum Dikirim
     * ======================
     */
    await sleep(500);
    if (page.url().includes(SHP_LOGIN_URL_PART)) {
      logger.log(`${colors.yellowBright(shopData.name)} Mencoba Login ke Shopee`, {
        notifyContext: 'INFO',
        notifyMessage: `🔑 (${shopData.name}) Mencoba Login ke Shopee`,
      });
      const loginKeyInput = getLocator(page, SHP_LOGINKEY_INPUT);
      const passwordInput = getLocator(page, SHP_PASSWORD_INPUT);
      const loginButton = getLocator(page, SHP_LOGIN_BUTTON);

      try {
        await loginKeyInput.first().fill(shopData.loginKey);
        await passwordInput.first().fill(shopData.password);
        await loginButton.first().click();
      } catch (error) {
        await stopLoopCheckOrder(
          page.context(),
          workerManager,
          shopData.name,
          `Login Gagal: input loginKey, password, atau tombol login tidak ditemukan. Menghentikan Shopee ${shopData.name}`,
        );
      }

      const loginAlert = getLocator(page, SHP_LOGIN_ALERT);
      const accountInfo = getLocator(page, SHP_ACCOUNT_INFO);

      let afterLoginStatus = '';
      try {
        afterLoginStatus = await Promise.race([
          page.waitForURL((url) => url.pathname.includes(SHP_VERIFY_URL_PART)).then(() => 'verify'),
          accountInfo.waitFor({ state: 'visible' }).then(() => 'success'),
          loginAlert.waitFor({ state: 'visible' }).then(() => 'error'),
        ]);
      } catch (error) {
        await stopLoopCheckOrder(
          page.context(),
          workerManager,
          shopData.name,
          `Login Gagal: status login tidak berubah. Menghentikan Shopee ${shopData.name}`,
        );
      }

      if (afterLoginStatus === 'verify') {
        const verifyOpenModalButton = getLocator(page, SHP_VERIFY_OPEN_MODAL_BUTTON);
        const verifyByWhatsappButton = getLocator(page, SHP_VERIFY_BY_WHATSAPP_BUTTON);

        try {
          await verifyOpenModalButton.first().click();
          await verifyByWhatsappButton.first().click();
        } catch (error) {
          await stopLoopCheckOrder(
            page.context(),
            workerManager,
            shopData.name,
            `Verify Gagal: modal untuk verify tidak ditemukan. Menghentikan Shopee ${shopData.name}`,
          );
        }

        let elapsedTimeMs = 0;
        while (page.url().includes(SHP_VERIFY_URL_PART) && elapsedTimeMs < 600000) {
          elapsedTimeMs += config.min_wait_time_ms;
          await sleep(config.min_wait_time_ms);
        }

        if (elapsedTimeMs >= 600000) {
          logger.error(
            `${colors.yellowBright(shopData.name)} Verify Shopee Gagal: timeout lebih dari 10 menit tanpa tindakan`,
            undefined,
            {
              notifyContext: 'ERROR',
              notifyMessage: `❌🔑 (${shopData.name}) Verify Shopee Gagal: timeout lebih dari 10 menit tanpa tindakan`,
            },
          );

          await stopLoopCheckOrder(
            page.context(),
            workerManager,
            shopData.name,
            `Verify Shopee Gagal: timeout lebih dari 10 menit tanpa tindakan. Menghentikan Shopee ${shopData.name}`,
          );
        }
      } else if (afterLoginStatus === 'error') {
        let errorMessage = '';
        try {
          const alertMsg = await loginAlert.textContent();

          if (alertMsg) {
            errorMessage = alertMsg;
          }
        } catch (error) {
          if (error instanceof PlaywrightErrors.TimeoutError) {
            errorMessage = 'Pesan Error Login Shopee tidak ditemukan';
          } else {
            errorMessage = (error as Error).message;
          }

          logger.error(
            `${colors.yellowBright(shopData.name)} Login ke Shopee Gagal: ${errorMessage}`,
            (error as Error).stack,
            {
              notifyContext: 'ERROR',
              notifyMessage: `❌🔑 (${shopData.name}) Login ke Shopee Gagal: ${errorMessage}`,
            },
          );

          await stopLoopCheckOrder(
            page.context(),
            workerManager,
            shopData.name,
            `Login ke Shopee Gagal: ${errorMessage}. Menghentikan Shopee ${shopData.name}`,
          );
        }
      }

      logger.log(`${colors.yellowBright(shopData.name)} Login ke Shopee Berhasil`, {
        notifyContext: 'INFO',
        notifyMessage: `✅🔑 (${shopData.name}) Login ke Shopee Berhasil`,
      });
      if (!page.url().includes(SHP_ORDER_LIST_URL_PART)) {
        await page.goto(SHP_ORDER_LIST_URL);
      }
      await sleep(5000);
      await saveStorageState(page.context(), shopData.name);
    } else if (!page.url().includes(SHP_ORDER_LIST_URL_PART)) {
      await page.goto(SHP_ORDER_LIST_URL);
      await sleep(1000);
    }

    /**
     * ======================
     * Dapatkan Order Card jika ada
     * ======================
     */
    const orderCards = getLocator(page, SHP_ORDER_CARD);
    let orderIds: string[] = [];
    try {
      await orderCards.first().waitFor({ state: 'visible', timeout: config.min_wait_time_ms });
      const allOrderCards = await orderCards.all();
      const orderHrefWithNull = await Promise.all(
        allOrderCards.map((locator) => locator.getAttribute(SHP_ORDER_CARDS_ID_ATTRIBUTE)),
      );
      orderIds = orderHrefWithNull
        .map((href) => (href ? href.trim().split('/').pop() : null))
        .filter((id) => id !== null && id !== undefined);
    } catch (error) {
      if (!(error instanceof PlaywrightErrors.TimeoutError)) {
        logger.warn(
          `${colors.yellowBright(shopData.name)} order card error warning: ${(error as Error).message}`,
          {
            notifyContext: 'ERROR',
            notifyMessage: `❌ (${shopData.name}) order card error: ${(error as Error).message}`,
          },
        );
      }
    }

    if (orderIds.length) {
      for (const id of orderIds) {
        updateOrderStatus(id, 'queued', shopData.name);
      }
    }

    /**
     * ======================
     * Enqueue Order yang ditemukan dan yang belum diselesaikan
     * ======================
     */
    const processableOrder = getProcessableOrders(shopData.name);
    if (processableOrder.length) {
      for (const order of processableOrder) {
        workerManager.enqueue(
          ProcessShopeeOrder(page.context(), order.orderId, order.status, config, shopData),
          `${shopData.name}#${order.orderId}`,
        );
      }
    }

    /**
     * ======================
     * Reload Page
     * ======================
     */
    await sleep(randBetween(config.min_wait_time_ms, config.max_wait_time_ms));
    await page.reload();
    await sleep(1000);
  };
}
```
Note: karena di kode tersebut page sudah diarahkan untuk membuka order list url, untuk implementasi di module ini, maka buat logika untuk cek dulu apakah page sudah diarahkan ke order list url atau tidak. jika sudah maka reload page. jika belum atau page masih blank maka arahkan ke order list url, selanjutnya ikuti flow dari kode yang aku berikan, yaitu mulai dari cek login dan verify sampai masukkan order id yang ditemukan ke task untuk di proses pada fungsi process order.

### Process Order

ini adalah fungsi one-time call untuk memproses order yang didapat dari loop.
di bawah ini aku berikan kode dari app lain yang sudah berjalan, analisa dan pahami flownya kemudian implementasikan ke dalam module ini.

```typescript
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
```

## Database

ini adalah bagian yang menjelaskan schema database sqlite yang digunakan di module ini.

### Table

```sql
CREATE TABLE IF NOT EXISTS orders (
  module_instance_id  TEXT NOT NULL,
  orderId TEXT NOT NULL,
  status  TEXT NOT NULL,
  createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (orderId, module_instance_id)
);
```

tabel ini digunakan untuk menyimpan order id yang ditemukan di shopee order list page dan statusnya bagaimana, apakah success, pending, failed, atau queued.