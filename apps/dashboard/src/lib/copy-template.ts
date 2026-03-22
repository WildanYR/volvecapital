import type { Account, AccountProfile } from '@/dashboard/services/account.service'
import { formatDateIdStandard } from './time-converter.util'

export function copyAccountTemplate(
  profile: AccountProfile,
  account: Account,
): string {
  const template = account.product_variant.copy_template

  // Jika tidak ada template, kembalikan string kosong
  if (!template) {
    return ''
  }

  // Regex untuk menemukan semua placeholder seperti $$email, $$metadata.pin, dll.
  const regex = /\$\$([\w.]+)/g

  return template.replace(regex, (match, placeholderKey: string) => {
    // Memisahkan key jika ada tanda titik (untuk kasus metadata)
    const keyParts = placeholderKey.split('.')
    const mainKey = keyParts[0]

    // 1. Penanganan untuk metadata dinamis: $$metadata.[key]
    if (mainKey === 'metadata' && keyParts.length === 2) {
      const metaKey = keyParts[1]
      const metadataItem = profile.metadata?.find(
        item => item.key === metaKey,
      )
      return metadataItem?.value ?? '' // Kembalikan value atau string kosong jika tidak ada
    }

    // 2. Penanganan untuk placeholder statis
    switch (placeholderKey) {
      case 'email':
        return account.email.email
      case 'password':
        return account.account_password
      case 'expired':
        if (!account.batch_end_date)
          return ''
        return formatDateIdStandard(account.batch_end_date)
      case 'product':
        return `${account.product_variant.product?.name || ''} ${account.product_variant.name}`.trim()
      case 'profile':
        return profile.name
      default:
        // Jika placeholder tidak dikenali, kembalikan placeholder aslinya
        return match
    }
  })
}
