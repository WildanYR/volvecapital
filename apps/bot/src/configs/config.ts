import fs from 'fs';
import { load as loadToml } from 'js-toml';
import { Configuration, TomlConfiguration } from '../types/config.type.js';
import { ChatTemplate } from '../types/chat-template.type.js';

const CONFIG_FILE = 'config.toml';

export const API_BASE_URL = 'https://api.volve-capital.com';
let CONFIG: Configuration;

export function initConfig(): Configuration {
  if (CONFIG) {
    return CONFIG;
  }

  if (!fs.existsSync(CONFIG_FILE)) {
    throw new Error('File konfigurasi config.toml tidak ditemukan');
  }

  try {
    const rawConfig = fs.readFileSync(CONFIG_FILE, 'utf-8');
    const parsedConfig = loadToml(rawConfig) as TomlConfiguration;

    const chatTemplate: ChatTemplate = {
      send_before: parsedConfig.chat_template?.send_before?.length
        ? parsedConfig.chat_template.send_before.map((v) => v.message)
        : [],
      send_after: parsedConfig.chat_template?.send_after?.length
        ? parsedConfig.chat_template.send_after.map((v) => v.message)
        : [],
      send_fallback: parsedConfig.chat_template?.send_fallback?.length
        ? parsedConfig.chat_template.send_fallback.map((v) => v.message)
        : [],
    };

    CONFIG = { ...parsedConfig, chat_template: chatTemplate };
  } catch (error) {
    throw error;
  }

  if (CONFIG.min_wait_time_ms < 5000) {
    throw new Error(
      'min_wait_time_ms minimal 5000 ms (5 detik), tidak bisa kurang dari 5 detik. silahkan ubah file konfigurasi',
    );
  }

  if (CONFIG.timeout < 10000) {
    throw new Error(
      'timeout minimal 10000 ms (10 detik), tidak bisa kurang dari 10 detik. silahkan ubah file konfigurasi',
    );
  }

  return CONFIG!;
}

export function getConfig() {
  return CONFIG;
}
