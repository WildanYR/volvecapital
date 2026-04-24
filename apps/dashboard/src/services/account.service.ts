import type { Email } from './email.service'
import type { ProductVariant } from './product.service'
import type { MetadataObject } from '@/dashboard/lib/metadata-converter'
import type { GetAllServiceFn } from '@/dashboard/types/get-all-service.type'
import { z } from 'zod'
import { generateApiFetch, parseApiResponse } from '@/dashboard/lib/api-fetch.util'
import { convertStringToMetadataObject } from '@/dashboard/lib/metadata-converter'
import { BaseQueryParamsSchema } from '@/dashboard/types/get-all-service.type'

export const AccountFilterSchema = z.object({
  email_id: z.string().optional(),
  product_variant_id: z.string().optional(),
  product_id: z.string().optional(),
  product_slug: z.string().optional(),
  status: z.string().optional(),
  email: z.string().optional(),
  user: z.string().optional(),
  billing: z.string().optional(),
})

export type AccountFilter = z.infer<typeof AccountFilterSchema>

export const GetAccountsParamsSchema
  = BaseQueryParamsSchema.merge(AccountFilterSchema)

export interface AccountProfileUser {
  id: string
  name: string
  status?: string
  created_at: Date
  updated_at: Date
  expired_at?: Date
}

export interface AccountProfile {
  id: string
  name: string
  max_user: number
  allow_generate: boolean
  metadata?: Array<MetadataObject>
  user?: Array<AccountProfileUser>
}

export interface AccountModifier {
  id: string
  modifier_id: string
  metadata: Array<MetadataObject>
}

export interface Account {
  id: string
  account_password: string
  subscription_expiry: Date
  status?: string
  billing?: string
  label?: string
  batch_start_date?: Date
  batch_end_date?: Date
  freeze_until?: Date
  email_id: string
  product_variant_id: string
  email: Email
  product_variant: ProductVariant
  profile: Array<AccountProfile>
  modifier?: Array<AccountModifier>
  pinned?: boolean
}

export interface CreateAccountProfilePayload {
  account_id?: string
  name: string
  max_user: number
  allow_generate: boolean
  metadata?: string
}

export interface CreateAccountModifierPayload {
  modifier_id: string
  metadata: string
}

export interface CreateAccountPayload {
  account_password: string
  subscription_expiry: Date
  status?: string
  billing?: string
  label?: string
  email_id: string
  product_variant_id: string
  profile?: Array<CreateAccountProfilePayload>
  modifier?: Array<CreateAccountModifierPayload>
}

export interface CreateAccountUserTransaction {
  platform: string
  total_price: number
}

export interface CreateAccountUserPayload {
  name: string
  product_variant_id: string
  status?: string
  account_profile_id?: string
  transaction?: CreateAccountUserTransaction
  expired_at?: Date
}

export interface UpdateAccountUserPayload {
  name?: string
  expired_at?: Date
  status?: string
}

export interface UpdateAccountProfilePayload {
  name?: string
  max_user?: number
  allow_generate?: boolean
  metadata?: string
}

export interface UpdateAccountModifierPayload {
  modifier: Array<{
    action: 'ADD' | 'UPDATE' | 'REMOVE'
    modifier_id: string
    metadata?: string
  }>
}

export interface UpdateAccountPayload {
  account_password?: string
  subscription_expiry?: Date
  status?: string
  billing?: string
  label?: string
  email_id?: string
  product_variant_id?: string
}

export interface FreezeAccountPayload {
  duration: number
}

export interface CountStatusAccount {
  accounts_with_slots: number
  accounts_full: number
  profiles_available: number
  accounts_disabled_or_frozen: number
  profiles_locked_but_has_slot: number
  accounts_expiring_today: number
}

export function AccountServiceGenerator(apiUrl: string, accessToken: string, tenantId: string) {
  const getAllAccount: GetAllServiceFn<Account, AccountFilter> = async (
    params,
  ) => {
    const response = await generateApiFetch(
      apiUrl,
      accessToken,
      tenantId,
      '/account',
      params,
    )
    if (!response.ok) {
      const errorData = await parseApiResponse(response)
      const errorMessage = Array.isArray(errorData.message)
        ? errorData.message[0]
        : errorData.message
      throw new Error(errorMessage || 'Failed to fetch account')
    }

    const data = await response.json()

    const accounts = data.items?.length
      ? (data.items as Array<Account>).map(account => ({
          ...account,
          subscription_expiry: new Date(account.subscription_expiry),
          batch_start_date: account.batch_start_date
            ? new Date(account.batch_start_date)
            : undefined,
          batch_end_date: account.batch_end_date
            ? new Date(account.batch_end_date)
            : undefined,
          freeze_until: account.freeze_until
            ? new Date(account.freeze_until)
            : undefined,
          profile: account.profile.map(profile => ({
            ...profile,
            metadata: convertStringToMetadataObject(profile.metadata as any),
            user: profile.user
              ? profile.user.map(user => ({
                  ...user,
                  created_at: new Date(user.created_at),
                  updated_at: new Date(user.updated_at),
                  expired_at: user.expired_at ? new Date(user.expired_at) : undefined,
                }))
              : undefined,
          })),
          modifier: account.modifier?.length
            ? account.modifier.map(modifier => ({
                ...modifier,
                metadata: convertStringToMetadataObject(
                  modifier.metadata as any,
                ),
              }))
            : [],
        }))
      : []
    return {
      ...data,
      items: accounts,
    }
  }

  const getAccountById = async (accountId: string, signal?: AbortSignal): Promise<Account> => {
    const response = await generateApiFetch(
      apiUrl,
      accessToken,
      tenantId,
      `/account/${accountId}`,
      { signal },
    )
    if (!response.ok) {
      const errorData = await response.json()
      const errorMessage = Array.isArray(errorData.message)
        ? errorData.message[0]
        : errorData.message
      throw new Error(errorMessage || 'Failed to fetch account')
    }

    const account = await response.json()
    return {
      ...account,
      subscription_expiry: new Date(account.subscription_expiry),
      batch_start_date: account.batch_start_date
        ? new Date(account.batch_start_date)
        : undefined,
      batch_end_date: account.batch_end_date
        ? new Date(account.batch_end_date)
        : undefined,
      freeze_until: account.freeze_until
        ? new Date(account.freeze_until)
        : undefined,
      profile: account.profile.map((profile: AccountProfile) => ({
        ...profile,
        metadata: convertStringToMetadataObject(profile.metadata as any),
      })),
      modifier: account.modifier?.length
        ? account.modifier.map((modifier: AccountModifier) => ({
            ...modifier,
            metadata: convertStringToMetadataObject(modifier.metadata as any),
          }))
        : [],
    }
  }

  const createNewAccount = async (
    payload: CreateAccountPayload,
  ): Promise<Account> => {
    const response = await generateApiFetch(
      apiUrl,
      accessToken,
      tenantId,
      '/account',
      undefined,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      },
    )

    if (!response.ok) {
      const errorData = await response.json()
      const errorMessage = Array.isArray(errorData.message)
        ? errorData.message[0]
        : errorData.message
      throw new Error(errorMessage || 'Failed to create account')
    }

    return response.json()
  }

  const createNewAccountProfile = async (
    payload: CreateAccountProfilePayload,
  ): Promise<Account> => {
    const response = await generateApiFetch(
      apiUrl,
      accessToken,
      tenantId,
      '/account-profile',
      undefined,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      },
    )

    if (!response.ok) {
      const errorData = await response.json()
      const errorMessage = Array.isArray(errorData.message)
        ? errorData.message[0]
        : errorData.message
      throw new Error(errorMessage || 'Failed to create account')
    }

    return response.json()
  }

  const createNewAccountUser = async (
    payload: CreateAccountUserPayload,
  ): Promise<{ account: Account, profile: AccountProfile }> => {
    const response = await generateApiFetch(
      apiUrl,
      accessToken,
      tenantId,
      '/account-user',
      undefined,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      },
    )

    if (!response.ok) {
      const errorData = await response.json()
      const errorMessage = Array.isArray(errorData.message)
        ? errorData.message[0]
        : errorData.message
      throw new Error(errorMessage || 'Failed to create account user')
    }

    const data = await response.json()
    const profile = {
      ...data.profile,
      metadata: data.profile.metadata
        ? convertStringToMetadataObject(data.profile.metadata)
        : undefined,
    }
    return { ...data, profile }
  }

  const updateAccountUser = async (userId: string, payload: UpdateAccountUserPayload): Promise<void> => {
    const response = await generateApiFetch(
      apiUrl,
      accessToken,
      tenantId,
      `/account-user/${userId}`,
      undefined,
      {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      },
    )

    if (!response.ok) {
      const errorData = await response.json()
      const errorMessage = Array.isArray(errorData.message)
        ? errorData.message[0]
        : errorData.message
      throw new Error(errorMessage || 'Failed to update account user')
    }
  }

  const updateAccount = async (
    accountId: string,
    payload: UpdateAccountPayload,
  ): Promise<Account> => {
    const response = await generateApiFetch(
      apiUrl,
      accessToken,
      tenantId,
      `/account/${accountId}`,
      undefined,
      {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      },
    )

    if (!response.ok) {
      const errorData = await response.json()
      const errorMessage = Array.isArray(errorData.message)
        ? errorData.message[0]
        : errorData.message
      throw new Error(errorMessage || 'Failed to update account')
    }

    return response.json()
  }

  const updateAccountProfile = async (
    accountProfileId: string,
    payload: UpdateAccountProfilePayload,
  ): Promise<Account> => {
    const response = await generateApiFetch(
      apiUrl,
      accessToken,
      tenantId,
      `/account-profile/${accountProfileId}`,
      undefined,
      {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      },
    )

    if (!response.ok) {
      const errorData = await response.json()
      const errorMessage = Array.isArray(errorData.message)
        ? errorData.message[0]
        : errorData.message
      throw new Error(errorMessage || 'Failed to update account profile')
    }

    return response.json()
  }

  const updateAccountModifier = async (
    accountId: string,
    payload: UpdateAccountModifierPayload,
  ): Promise<void> => {
    const response = await generateApiFetch(
      apiUrl,
      accessToken,
      tenantId,
      `/account/${accountId}/modifier`,
      undefined,
      {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      },
    )

    if (!response.ok) {
      const errorData = await response.json()
      const errorMessage = Array.isArray(errorData.message)
        ? errorData.message[0]
        : errorData.message
      throw new Error(errorMessage || 'Failed to update account modifier')
    }
  }

  const freezeAccount = async (
    accountId: string,
    payload: FreezeAccountPayload,
  ) => {
    const response = await generateApiFetch(
      apiUrl,
      accessToken,
      tenantId,
      `/account/${accountId}/freeze`,
      undefined,
      {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      },
    )

    if (!response.ok) {
      const errorData = await response.json()
      const errorMessage = Array.isArray(errorData.message)
        ? errorData.message[0]
        : errorData.message
      throw new Error(errorMessage || 'Failed to freeze account')
    }
  }

  const unfreezeAccount = async (accountId: string) => {
    const response = await generateApiFetch(
      apiUrl,
      accessToken,
      tenantId,
      `/account/${accountId}/unfreeze`,
      undefined,
      {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
      },
    )

    if (!response.ok) {
      const errorData = await response.json()
      const errorMessage = Array.isArray(errorData.message)
        ? errorData.message[0]
        : errorData.message
      throw new Error(errorMessage || 'Failed to unfreeze account')
    }
  }

  const deleteAccount = async (accountId: string): Promise<void> => {
    const response = await generateApiFetch(
      apiUrl,
      accessToken,
      tenantId,
      `/account/${accountId}`,
      undefined,
      {
        method: 'DELETE',
      },
    )

    if (!response.ok) {
      const errorData = await response.json()
      const errorMessage = Array.isArray(errorData.message)
        ? errorData.message[0]
        : errorData.message
      throw new Error(errorMessage || 'Failed to delete account')
    }
  }

  const deleteAccountProfile = async (
    accountProfileId: string,
  ): Promise<void> => {
    const response = await generateApiFetch(
      apiUrl,
      accessToken,
      tenantId,
      `/account-profile/${accountProfileId}`,
      undefined,
      {
        method: 'DELETE',
      },
    )

    if (!response.ok) {
      const errorData = await response.json()
      const errorMessage = Array.isArray(errorData.message)
        ? errorData.message[0]
        : errorData.message
      throw new Error(errorMessage || 'Failed to delete account profile')
    }
  }

  const countStatusAccount = async (
    filter?: { product_variant_id?: string, product_id?: string, product_slug?: string },
    signal?: AbortSignal,
  ): Promise<CountStatusAccount> => {
    const response = await generateApiFetch(
      apiUrl,
      accessToken,
      tenantId,
      '/account/count',
      { ...filter, signal },
    )
    if (!response.ok) {
      const errorData = await response.json()
      const errorMessage = Array.isArray(errorData.message)
        ? errorData.message[0]
        : errorData.message
      throw new Error(errorMessage || 'Failed to fetch count account')
    }

    return await response.json()
  }

  const pinAccount = async (accountId: string, pinned: boolean) => {
    const response = await generateApiFetch(
      apiUrl,
      accessToken,
      tenantId,
      `/account/${accountId}`,
      undefined,
      {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pinned }),
      },
    )

    if (!response.ok) {
      const errorData = await response.json()
      const errorMessage = Array.isArray(errorData.message)
        ? errorData.message[0]
        : errorData.message
      throw new Error(errorMessage || 'Failed to pin account')
    }
  }

  return {
    getAllAccount,
    getAccountById,
    createNewAccount,
    createNewAccountProfile,
    createNewAccountUser,
    updateAccountUser,
    updateAccount,
    updateAccountProfile,
    updateAccountModifier,
    freezeAccount,
    unfreezeAccount,
    deleteAccount,
    deleteAccountProfile,
    countStatusAccount,
    pinAccount,
  }
}
