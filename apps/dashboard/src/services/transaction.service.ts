import type { Account, AccountProfile } from './account.service'
import type { GetAllServiceFn } from '@/dashboard/types/get-all-service.type'
import { toast } from 'sonner'
import { z } from 'zod'
import { generateApiFetch, parseApiResponse } from '@/dashboard/lib/api-fetch.util'
import { convertStringToMetadataObject } from '@/dashboard/lib/metadata-converter'
import { BaseQueryParamsSchema } from '@/dashboard/types/get-all-service.type'

export const TransactionFilterSchema = z.object({
  customer: z.string().optional(),
  from_date: z.string().optional(),
  to_date: z.string().optional(),
})

export type TransactionFilter = z.infer<typeof TransactionFilterSchema>

export const GetTransactionParamsSchema = BaseQueryParamsSchema.merge(
  TransactionFilterSchema,
)

export type GetTransactionParams = z.infer<typeof GetTransactionParamsSchema>

interface TransactionItemUser {
  id: string
  name: string
  status?: string
  account_id: string
  account_profile_id: string
  account: Account
  profile: AccountProfile
}

interface TransactionItem {
  id: string
  name: string
  transaction_id: string
  account_user_id?: number
  user?: TransactionItemUser
}

export interface Transaction {
  id: string
  customer: string
  platform: string
  total_price: number
  items: Array<TransactionItem>
  created_at: Date
}

interface CreateTransactionUserFailed {
  availability_status: 'NOT_AVAILABLE' | 'COOLDOWN'
  product_variant_id: string
  produc_name: string
}

export interface CreateTransactionResponse {
  transaction?: Transaction
  account_user: Array<TransactionItemUser | CreateTransactionUserFailed>
}

interface CreateTransactionItemPayload {
  product_variant_id: string
}

export interface CreateTransactionPayload {
  customer: string
  platform: string
  total_price: number
  items: Array<CreateTransactionItemPayload>
}

export function TransactionServiceGenerator(apiUrl: string, accessToken: string, tenantId: string) {
  const getAllTransaction: GetAllServiceFn<
    Transaction,
    TransactionFilter
  > = async (params) => {
    const response = await generateApiFetch(
      apiUrl,
      accessToken,
      tenantId,
      '/transaction',
      params,
    )
    if (!response.ok) {
      const errorData = await parseApiResponse(response)
      const errorMessage = Array.isArray(errorData.message)
        ? errorData.message[0]
        : errorData.message
      throw new Error(errorMessage || 'Failed to fetch transaction')
    }

    const data = await response.json()
    const transactions = data.items?.length
      ? (data.items as Array<Transaction>).map(transaction => ({
          ...transaction,
          created_at: new Date(transaction.created_at),
          items: transaction.items.map(item => ({
            ...item,
            user: item.user
              ? ({
                  ...item.user,
                  profile: {
                    ...item.user.profile,
                    metadata: convertStringToMetadataObject(
                      item.user.profile.metadata as any,
                    ),
                  },
                } as TransactionItemUser)
              : undefined,
          })),
        }))
      : []

    return {
      ...data,
      items: transactions,
    }
  }

  const createNewTransaction = async (
    payload: CreateTransactionPayload,
  ): Promise<CreateTransactionResponse> => {
    const response = await generateApiFetch(
      apiUrl,
      accessToken,
      tenantId,
      '/transaction',
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
      throw new Error(errorMessage || 'Failed to create transaction')
    }

    const data: CreateTransactionResponse = await response.json()
    if (data.account_user.length) {
      const warnMessages: Array<string> = []
      for (const usr of data.account_user as Array<CreateTransactionUserFailed>) {
        if (usr.availability_status === 'COOLDOWN') {
          warnMessages.push(`${usr.produc_name}: akun cooldown`)
        }
        if (usr.availability_status === 'NOT_AVAILABLE') {
          warnMessages.push(`${usr.produc_name}: akun penuh`)
        }
      }
      if (warnMessages.length) {
        toast.warning(`Gagal generate akun pada:\n${warnMessages.join('\n')}`)
      }
    }
    return data
  }

  const deleteTransaction = async (transactionId: string): Promise<void> => {
    const response = await generateApiFetch(
      apiUrl,
      accessToken,
      tenantId,
      `/transaction/${transactionId}`,
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
      throw new Error(errorMessage || 'Failed to delete transaction')
    }
  }

  return {
    getAllTransaction,
    createNewTransaction,
    deleteTransaction,
  }
}
