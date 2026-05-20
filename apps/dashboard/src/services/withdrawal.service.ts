import { generateApiFetch, parseApiResponse } from '@/dashboard/lib/api-fetch.util'

export interface WalletBalance {
  available_balance: number
  pending_balance: number
  total_profit: number
  total_withdrawal: number
}

export interface WithdrawalHistoryItem {
  id: string
  amount: number
  admin_fee: number
  status: string
  bank_info: {
    bank_name: string
    account_number: string
    account_holder: string
  }
  created_at: string
}

export interface CreateWithdrawalPayload {
  amount: number
  bank_account_id: string
}

export function WithdrawalServiceGenerator(apiUrl: string, accessToken: string, tenantId: string) {
  const getWalletBalance = async (): Promise<WalletBalance> => {
    const response = await generateApiFetch(
      apiUrl,
      accessToken,
      tenantId,
      '/withdrawals/balance',
      undefined,
    )
    if (!response.ok) {
      const errorData = await parseApiResponse(response)
      throw new Error(errorData.message || 'Failed to fetch wallet balance')
    }
    return response.json()
  }

  const getWithdrawalHistory = async (): Promise<WithdrawalHistoryItem[]> => {
    const response = await generateApiFetch(
      apiUrl,
      accessToken,
      tenantId,
      '/withdrawals/history',
      undefined,
    )
    if (!response.ok) {
      const errorData = await parseApiResponse(response)
      throw new Error(errorData.message || 'Failed to fetch withdrawal history')
    }
    return response.json()
  }

  const requestWithdrawal = async (payload: CreateWithdrawalPayload): Promise<void> => {
    const response = await generateApiFetch(
      apiUrl,
      accessToken,
      tenantId,
      '/withdrawals',
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
      throw new Error(errorMessage || 'Failed to request withdrawal')
    }
  }

  const getAdminPendingRequests = async (): Promise<(WithdrawalHistoryItem & { tenant_id: string })[]> => {
    const response = await generateApiFetch(
      apiUrl,
      accessToken,
      tenantId,
      '/withdrawals/admin/pending',
      undefined,
    )
    if (!response.ok) {
      const errorData = await parseApiResponse(response)
      throw new Error(errorData.message || 'Failed to fetch pending requests')
    }
    return response.json()
  }

  const approveWithdrawal = async (targetTenantId: string, requestId: string): Promise<void> => {
    const response = await generateApiFetch(
      apiUrl,
      accessToken,
      tenantId, // keep caller tenantId in headers if necessary
      `/withdrawals/admin/${targetTenantId}/approve/${requestId}`,
      undefined,
      {
        method: 'POST',
      },
    )
    if (!response.ok) {
      const errorData = await response.json()
      const errorMessage = Array.isArray(errorData.message)
        ? errorData.message[0]
        : errorData.message
      throw new Error(errorMessage || 'Failed to approve withdrawal')
    }
  }

  return {
    getWalletBalance,
    getWithdrawalHistory,
    requestWithdrawal,
    getAdminPendingRequests,
    approveWithdrawal,
  }
}
