import { Locator, Page } from 'patchright';
import { LocatorId } from '../types/locator-id.type.js';

export function getLocator(page: Page | Locator, locatorId: LocatorId): Locator {
  if (locatorId.type === 'role') {
    return page.getByRole(locatorId.role!, { name: locatorId.name });
  }

  if (locatorId.type === 'placeholder') {
    return page.getByPlaceholder(locatorId.name!);
  }

  if (locatorId.type === 'label') {
    return page.getByLabel(locatorId.name!);
  }

  return page.locator(locatorId.name!);
}
