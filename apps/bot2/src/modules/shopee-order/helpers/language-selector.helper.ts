import { Page } from "playwright";
import { getBahasaIndonesiaButton, getLanguageSelectionModal } from "../locators/global-locator.js";

export async function selectLanguage(page: Page) {
  try {
    const languageSelectionModal = getLanguageSelectionModal(page)
    await getBahasaIndonesiaButton(languageSelectionModal).first().click({timeout: 15_000});
  } catch {}
}