import { Account, AccountProfile } from '../types/account.type.js';
import { formatDateIdStandard } from './date-converter.js';

export function copyAccountTemplate(profile: AccountProfile, account: Account) {
  const template = account.product_variant.copy_template;

  if (!template) {
    return '';
  }

  const regex = /\$\$([\w.]+)/g;

  return template.replace(regex, (match, placeholderKey) => {
    const keyParts = placeholderKey.split('.');
    const mainKey = keyParts[0];

    if (mainKey === 'metadata' && keyParts.length === 2) {
      const metaKey = keyParts[1];
      const metadataItem = profile.metadata?.find((item) => item.key === metaKey);
      return metadataItem?.value ?? '';
    }

    switch (placeholderKey) {
      case 'email':
        return account.email.email;
      case 'password':
        return account.account_password;
      case 'expired':
        if (!account.batch_end_date) return '';
        return formatDateIdStandard(account.batch_end_date);
      case 'product':
        return `${account.product_variant.product?.name || ''} ${
          account.product_variant.name
        }`.trim();
      case 'profile':
        return profile.name;
      default:
        return match;
    }
  });
}
