import { ChatTemplate } from './chat-template.type.js';
import { ShopeeShop } from './shopee-shop.type.js';

export interface IConfig {
  MAIN_LOOP_MIN_MS: number;
  MAIN_LOOP_MAX_MS: number;
  PAGE_TIMEOUT: number;
  MAX_RETRY_ATTEMPT: number;
}

export interface Configuration {
  appId: string;
  appSecret: string;
  timeout: number;
  max_retry_attempt: number;
  min_wait_time_ms: number;
  max_wait_time_ms: number;
  concurrency: number;
  shopee_shop: ShopeeShop[];
  chat_template?: ChatTemplate;
}

interface TomlChatTemplate {
  send_before?: { message: string }[];
  send_after?: { message: string }[];
  send_fallback?: { message: string }[];
}

export interface TomlConfiguration {
  appId: string;
  appSecret: string;
  timeout: number;
  max_retry_attempt: number;
  min_wait_time_ms: number;
  max_wait_time_ms: number;
  concurrency: number;
  shopee_shop: ShopeeShop[];
  chat_template?: TomlChatTemplate;
}
