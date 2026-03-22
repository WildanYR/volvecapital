import { BrowserContext } from 'patchright';
import path from 'path';

export async function saveStorageState(context: BrowserContext, shopName: string) {
  await context.storageState({ path: generateStorageStatePath(shopName) });
}

export function generateStorageStatePath(shopName: string) {
  return path.join('browser-session', `${generateBrowserContextName(shopName)}.json`);
}

export function generateBrowserContextName(shopName: string) {
  return shopName.trim().replaceAll(' ', '-');
}
