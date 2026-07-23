import type { Account, AccountProfile } from '@/dashboard/services/account.service'
import { formatDateIdStandard } from './time-converter.util'

export async function copyAccountTemplate(
  profile: AccountProfile,
  account: Account,
  fetchNetflixToken?: () => Promise<any>
): Promise<string> {
  const template = account.product_variant.copy_template

  if (!template) {
    return ''
  }

  const regex = /\$\$([\w.]+)/g
  const matches = [...template.matchAll(regex)]
  let result = template

  const needsToken = matches.some(m => {
    const key = m[1].toLowerCase()
    return ['pclink', 'mobilelink', 'tvlink', 'generallink'].includes(key)
  })

  let netflixTokenData: any = null
  if (needsToken && fetchNetflixToken) {
    try {
      netflixTokenData = await fetchNetflixToken()
    } catch (err) {
      // Ignore if fetch fails, placeholder will be empty or raw
    }
  }

  for (const match of matches) {
    const placeholderKey = match[1]
    let replacement = match[0]

    const keyParts = placeholderKey.split('.')
    const mainKey = keyParts[0]

    if (mainKey === 'metadata' && keyParts.length === 2) {
      const metaKey = keyParts[1]
      const metadataItem = profile.metadata?.find(
        item => item.key === metaKey,
      )
      replacement = metadataItem?.value ?? ''
    } else {
      switch (placeholderKey.toLowerCase()) {
        case 'email':
          replacement = account.email.email
          break
        case 'password':
          replacement = account.account_password
          break
        case 'expired':
          replacement = account.batch_end_date ? formatDateIdStandard(account.batch_end_date) : ''
          break
        case 'product':
          replacement = `${account.product_variant.product?.name || ''} ${account.product_variant.name}`.trim()
          break
        case 'profile':
          replacement = profile.name
          break
        case 'pclink':
          replacement = (netflixTokenData?.pcLink || '').replace(/^https?:\/\//, '')
          break
        case 'mobilelink':
          replacement = (netflixTokenData?.mobileLink || '').replace(/^https?:\/\//, '')
          break
        case 'tvlink':
          replacement = (netflixTokenData?.tvLink || '').replace(/^https?:\/\//, '')
          break
        case 'generallink':
          replacement = (netflixTokenData?.generalLink || '').replace(/^https?:\/\//, '')
          break
      }
    }

    result = result.replace(match[0], replacement)
  }

  return result
}
