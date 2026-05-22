/**
 * ShopeeOrderModule - Module untuk memproses order baru di Shopee seller dashboard
 */

import type { Page } from "playwright";
import { BaseModule } from "../../core/BaseModule.js";
import type { ModuleDependencies } from "../../types/module.type.js";
import type { ModuleConfig } from "../../types/config.type.js";
import type { Task } from "../../types/task.type.js";
import { ElementNotFoundError } from "../../types/errors.js";
import {
  AlreadyProcessedError,
  NoProductBindError,
  NoAccountError,
  TransactionExistNoAccountError,
} from "./errors.js";
import {
  ORDER_LIST_URL,
  ORDER_DETAIL_URL,
  URL_PATTERNS,
  STATUS_PATTERNS,
  DEFAULT_TIMEOUT_MS,
  MAX_RETRY_ATTEMPT,
  MAX_WAIT_TIME_MS,
  MIN_WAIT_TIME_MS,
} from "./constants.js";
import {
  checkProductNames,
  generateAccountTransaction,
  copyAccountTemplate,
} from "./api.js";

// Locators
import {
  getOrderStatus,
} from "./locators/order-detail.js";
import {
  TransactionAccountPayload,
  FailedAccountUser,
  AccountUser,
} from "./types/api.type.js";
import { ShopeeOrderConfig } from "./types/config.type.js";
import { OrderStatus, OrderRecord } from "./types/order.type.js";
import { selectLanguage } from "./helpers/language-selector.helper.js";
import { handleLogin, handleVerify } from "./helpers/login.helper.js";
import { jitter, randBetween } from "../../utils/time.js";
import {
  checkOrderState,
  ensureChatOpen,
  extractOrderIds,
  extractProducts,
  extractTotalPrice,
  extractUsername,
  processShipping,
  refreshOrderList
} from "./helpers/order.helper.js";
import { ProductList } from "./types/product.type.js";
import { generateItemPayload } from "./helpers/product-payload.helper.js";

export class ShopeeOrderModule extends BaseModule {
  private moduleConfig: ShopeeOrderConfig;
  private loopPage: Page | null = null;
  private isLanguageSelected: boolean = false

  constructor(
    deps: ModuleDependencies,
    instanceId: string,
    config: ModuleConfig,
  ) {
    super(deps, instanceId, config);
    this.moduleConfig = config as unknown as ShopeeOrderConfig;
  }

  // ==========================================================================
  // Abstract method implementations
  // ==========================================================================

  async setupSchema(): Promise<void> {
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS orders (
        module_instance_id TEXT NOT NULL,
        orderId TEXT NOT NULL,
        status TEXT NOT NULL,
        createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
        PRIMARY KEY (orderId, module_instance_id)
      )
    `);
    this.logger.info("Database schema initialized");
  }

  async init(): Promise<void> {
    this.setRunning(true);
    this.logger.info("ShopeeOrderModule initialized");
  }

  async stop(): Promise<void> {
    await this.cleanup();
    this.loopPage = null;
    this.logger.info("ShopeeOrderModule stopped");
  }

  // ==========================================================================
  // Loop handler
  // ==========================================================================

  async executeLoop(): Promise<void> {
    // Gunakan dedicated page untuk loop, buat baru jika belum ada atau sudah ditutup
    if (!this.loopPage || this.loopPage.isClosed()) {
      const context = await this.getOrCreateContext("shopee");
      this.loopPage = await context.newPage();
      this.loopPage.setDefaultTimeout(DEFAULT_TIMEOUT_MS);
    }

    if (this.loopPage.url() === "about:blank") {
      await this.loopPage.goto(ORDER_LIST_URL, { waitUntil: 'domcontentloaded' });
      if (!this.isLanguageSelected) {
        await selectLanguage(this.loopPage)
        this.isLanguageSelected = true
      }
    }

    // Check if on login this.loopPage
    if (this.loopPage.url().includes(URL_PATTERNS.LOGIN)) {
      try {
        this.logger.info("Mencoba Login ke Shopee");
        await handleLogin(this.loopPage, this.moduleConfig.loginKey, this.moduleConfig.password);
        this.logger.info("Login ke Shopee Berhasil");
        await this.saveSession("shopee");
      } catch (error) {
        await this.requestStop((error as Error).message);
        this.logger.error(
          `Module akan dihentikan karena Shopee Gagal Login: ${(error as Error).message}`,
          {
            instanceId: this.instanceId,
          },
          {
            level: "ERROR",
            context: "ShopeeLogin",
            customMessage: `‼️ Shopee ${this.instanceId} pada bot akan dihentikan.\nTerjadi kegagalan saat login: ${(error as Error).message}`,
          },
        );
        throw error;
      }
    }

    // Check if on verify this.loopPage
    if (this.loopPage.url().includes(URL_PATTERNS.VERIFY)) {
      try {
        await handleVerify(this.loopPage);
      } catch (error) {
        await this.requestStop((error as Error).message);
        this.logger.error(
          `Module akan dihentikan karena Shopee Gagal Verify login: ${(error as Error).message}`,
          {
            instanceId: this.instanceId,
          },
          {
            level: "ERROR",
            context: "ShopeeLogin",
            customMessage: `‼️ Shopee ${this.instanceId} pada bot akan dihentikan.\nTerjadi kegagalan saat Verify login: ${(error as Error).message}`,
          },
        );
        throw error;
      }
    }

    // Ensure we're on order list this.loopPage after login/verify
    if (!this.loopPage.url().includes(URL_PATTERNS.NEW_ORDER_LIST)) {
      await this.loopPage.goto(ORDER_LIST_URL, {
        waitUntil: "domcontentloaded",
      });
    } else {
      // Get order cards
      const { orderIds, message: extractOrderErrorMsg } = await extractOrderIds(this.loopPage);

      if (extractOrderErrorMsg) {
        this.logger.warn(extractOrderErrorMsg)
      }

      if (orderIds.length > 0) {
        // Update status to queued
        for (const id of orderIds) {
          this.addNewOrder(id);
        }
      }

      // Claim queued orders before enqueueing so the same orderId is only scheduled once.
      const processableOrders = this.claimQueuedOrdersForEnqueue();
      for (const order of processableOrders) {
        this.enqueueTask("processOrder", {
          orderId: order.orderId,
          status: order.status,
        });
      }

      // Reload this.loopPage and wait before next loop
      await this.sleep(randBetween(MIN_WAIT_TIME_MS, MAX_WAIT_TIME_MS));
      await refreshOrderList(this.loopPage);
    }
  }

  // ==========================================================================
  // Task handlers
  // ==========================================================================

  async processOrder(task: Task): Promise<void> {
    const { orderId, status: initialStatus } = task.payload as {
      orderId: string;
      status: OrderStatus;
    };

    const currentOrder = this.getOrder(orderId);
    if (!currentOrder) {
      this.logger.warn(
        `Skipping order ${orderId}: order record tidak ditemukan`,
      );
      return;
    }

    if (currentOrder.status === "success" || currentOrder.status === "failed") {
      this.logger.info(
        `Skipping order ${orderId}: status sudah ${currentOrder.status}`,
      );
      return;
    }

    if (!this.claimOrderForProcessing(orderId)) {
      const latestStatus =
        this.getOrder(orderId)?.status || currentOrder.status;
      this.logger.info(
        `Skipping order ${orderId}: sudah diklaim task lain (status: ${latestStatus})`,
      );
      return;
    }

    this.logger.info(`Processing order ${orderId}`);

    let orderStatus = initialStatus;
    const context = await this.getOrCreateContext("shopee");
    const page = await context.newPage();
    page.setDefaultTimeout(DEFAULT_TIMEOUT_MS);

    const orderUrl = ORDER_DETAIL_URL(orderId);
    await page.goto(orderUrl, { waitUntil: "domcontentloaded" });

    for (let attempt = 1; attempt <= MAX_RETRY_ATTEMPT; attempt++) {
      try {
        // Check order status
        const orderState = await checkOrderState(page);

        if (orderState === "processed") {
          const stateText =
            (await getOrderStatus(page).textContent())?.trim() || "";
          if (!stateText) {
            throw new ElementNotFoundError("status pesanan tidak ditemukan");
          }
          if (
            STATUS_PATTERNS.ALREADY_PROCESSED.test(stateText) &&
            orderStatus !== "processing"
          ) {
            throw new AlreadyProcessedError("Pesanan telah diproses manual");
          }
          if (STATUS_PATTERNS.CANCELLED.test(stateText)) {
            throw new AlreadyProcessedError("Pesanan dibatalkan pembeli");
          }
        }

        // Get order data
        const { username, message: usernameErrorMsg } = await extractUsername(page, orderId);
        if (usernameErrorMsg) {
          this.logger.warn(usernameErrorMsg);
        }
        const products = await extractProducts(page);
        const totalPrice = await extractTotalPrice(page);

        // Process shipping if not already processing
        let jasaKirim = "";
        if (orderStatus !== "processing") {
          jasaKirim = await processShipping(page);
          this.updateOrderStatus(orderId, "processing");
          orderStatus = "processing";
        }

        // Reload and open chat
        await page.reload({ waitUntil: "domcontentloaded" });
        const chatInput = await ensureChatOpen(page);

        // Request accounts from server
        const platformProducts = await checkProductNames(
          this.apiBaseUrl,
          this.authCredentials,
          products.map((p) => ({ name: p.name, variant: p.variant })),
        );
        const productList: ProductList[] =
          [];

        for (const [index, pp] of platformProducts.entries()) {
          const sourceProduct = products[index];

          if (!pp.isFound) {
            this.logger.warn(
              `${orderId}: ${pp.name}${pp.variant ? ` (${pp.variant})` : ""} tidak terdaftar di produk platform aplikasi`,
            );
          } else if (!pp.product_variant_id) {
            this.logger.warn(
              `${orderId}: ${pp.name}${pp.variant ? ` (${pp.variant})` : ""} tidak memiliki product variant id`,
            );
          } else {
            for (let i = 0; i < sourceProduct.qty; i++) {
              productList.push({
                id: pp.product_variant_id,
                name: pp.name,
                price: sourceProduct.price,
                variant: pp.variant,
              });
            }
          }
        }

        if (!productList.length) {
          throw new NoProductBindError(
            "Tidak ada nama produk yang terdaftar di produk platform aplikasi",
          );
        }

        const itemPayload = generateItemPayload(productList, totalPrice)
        const transactionPayload: TransactionAccountPayload = {
          customer: username,
          platform: "Shopee",
          total_price: totalPrice,
          items: itemPayload,
        };

        const generatedAccounts = await generateAccountTransaction(
          this.apiBaseUrl,
          this.authCredentials,
          orderId,
          transactionPayload,
        );

        // Build messages to send
        let messagesToSend: string[] = [];

        for (const acc of generatedAccounts) {
          if ((acc as FailedAccountUser).availability_status) {
            const status =
              (acc as FailedAccountUser).availability_status === "COOLDOWN"
                ? "COOLDOWN"
                : "AKUN TIDAK TERSEDIA";
            this.logger.warn(
              `${orderId}: gagal generate akun untuk item ${(acc as FailedAccountUser).product_name}. status: ${status}`,
            );
          } else {
            const template = copyAccountTemplate(
              (acc as AccountUser).profile,
              (acc as AccountUser).account,
            );
            if (template) {
              messagesToSend.push(template);
            }
          }
        }

        if (!messagesToSend.length) {
          throw new NoAccountError("Tidak ada akun yang bisa dikirimkan");
        }

        // Add before/after messages
        if (this.moduleConfig.message_before?.length) {
          messagesToSend = [
            ...this.moduleConfig.message_before,
            ...messagesToSend,
          ];
        }
        if (this.moduleConfig.message_after?.length) {
          messagesToSend = [
            ...messagesToSend,
            ...this.moduleConfig.message_after,
          ];
        }

        // Send messages
        for (const msg of messagesToSend) {
          await chatInput.fill(msg);
          await page.keyboard.press("Enter");
          await this.sleep(500);
        }

        this.updateOrderStatus(orderId, "success");
        this.logger.info(`Order ${orderId} berhasil diproses`);

        if (jasaKirim === "jkp") {
          this.logger.warn(
            `${orderId}: Jasa kirim toko tidak terdeteksi, silahkan chat CS shopee untuk pengiriman`,
            { instanceId: this.instanceId },
            {
              level: "NEED_ACTION",
              context: "ShopeeProcessOrder",
              customMessage: `⚠️ Jasa kirim toko tidak terdeteksi, silahkan chat CS shopee untuk pengiriman.\n\nProses order berhasil, perlu langkah manual untuk menyelesaikan pesananmu.\n\nOrder Id: ${orderId}\nUrl: ${orderUrl}`,
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

        if (!nonRetryError && attempt < MAX_RETRY_ATTEMPT) {
          this.logger.warn(
            `${orderId}: Mengulangi proses pesanan (${attempt + 1}/${MAX_RETRY_ATTEMPT}): ${(error as Error).message}`,
          );
          const waitTime = jitter(400 * Math.pow(2, attempt - 1));
          await this.sleep(waitTime);
          await page.reload({ waitUntil: "domcontentloaded" });
          continue;
        }

        this.updateOrderStatus(orderId, "failed");
        this.logger.error(
          `${orderId}: Gagal memproses pesanan: ${(error as Error).message}`,
          { instanceId: this.instanceId },
          {
            level: "ERROR",
            context: "ShopeeProcessOrder",
            customMessage: `‼️ Gagal Memproses Pesanan Shopee: ${(error as Error).message}\n\nUrl Order: ${orderUrl}`,
          },
        );

        if (this.moduleConfig.message_fallback) {
          try {
            await page.reload({ waitUntil: "domcontentloaded" });
            const chatInput = await ensureChatOpen(page);
            await chatInput.fill(this.moduleConfig.message_fallback);
            await page.keyboard.press("Enter");
            await this.sleep(500);
          } catch { }
        }

        break;
      }
    }

    await page.close();
  }

  // Database helpers
  private addNewOrder(orderId: string): void {
    this.db.run(
      `INSERT INTO orders (module_instance_id, orderId, status)
       VALUES (?, ?, ?)
       ON CONFLICT(orderId, module_instance_id)
       DO NOTHING`,
      [this.instanceId, orderId, "queued"],
    );
  }

  private updateOrderStatus(orderId: string, status: OrderStatus): void {
    this.db.run(
      `INSERT INTO orders (module_instance_id, orderId, status)
       VALUES (?, ?, ?)
       ON CONFLICT(orderId, module_instance_id)
       DO UPDATE SET status = excluded.status`,
      [this.instanceId, orderId, status],
    );
  }

  private claimQueuedOrdersForEnqueue(): OrderRecord[] {
    return this.db.transaction(() => {
      const queuedOrders = this.db.all<OrderRecord>(
        `SELECT * FROM orders
         WHERE module_instance_id = ?
         AND status = 'queued'`,
        [this.instanceId],
      );

      if (!queuedOrders.length) {
        return [];
      }

      this.db.run(
        `UPDATE orders
         SET status = 'enqueued'
         WHERE module_instance_id = ?
         AND status = 'queued'`,
        [this.instanceId],
      );

      return queuedOrders.map((order) => ({
        ...order,
        status: "enqueued" as const,
      }));
    });
  }

  private claimOrderForProcessing(orderId: string): boolean {
    const result = this.db.run(
      `UPDATE orders
       SET status = 'processing'
       WHERE module_instance_id = ?
       AND orderId = ?
       AND status = 'enqueued'`,
      [this.instanceId, orderId],
    );

    return result.changes > 0;
  }

  private getOrder(orderId: string): OrderRecord | undefined {
    return this.db.get<OrderRecord>(
      `SELECT * FROM orders
       WHERE module_instance_id = ?
       AND orderId = ?`,
      [this.instanceId, orderId],
    );
  }
}
