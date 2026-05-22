import { Locator, Page } from "playwright"

export const getLanguageSelectionModal = (page: Page) =>
  page.locator('.language-selection')

export const getBahasaIndonesiaButton = (locator: Locator) =>
  locator.getByRole('button', {name: 'Bahasa Indonesia'})