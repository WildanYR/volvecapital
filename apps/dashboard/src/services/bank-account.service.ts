import { generateApiFetch, parseApiResponse } from '@/dashboard/lib/api-fetch.util'

export interface BankAccount {
  id: string
  bank_name: string
  account_number: string
  account_holder: string
  is_verified: boolean
  created_at: string
}

export function BankAccountServiceGenerator(apiUrl: string, accessToken: string, tenantId: string) {
  const getBankAccounts = async (): Promise<BankAccount[]> => {
    const response = await generateApiFetch(apiUrl, accessToken, tenantId, '/bank-accounts', undefined)
    if (!response.ok) {
      const errorData = await parseApiResponse(response)
      throw new Error(errorData.message || 'Failed to fetch bank accounts')
    }
    return response.json()
  }

  const addBankAccount = async (data: {
    bank_name: string
    account_number: string
    account_holder: string
  }): Promise<{ id: string, message: string, expires_at: string }> => {
    const response = await generateApiFetch(apiUrl, accessToken, tenantId, '/bank-accounts', undefined, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    })
    if (!response.ok) {
      const errorData = await response.json()
      const errorMessage = Array.isArray(errorData.message)
        ? errorData.message[0]
        : errorData.message
      throw new Error(errorMessage || 'Failed to add bank account')
    }
    return response.json()
  }

  const verifyOtp = async (id: string, otp_code: string): Promise<{ message: string }> => {
    const response = await generateApiFetch(apiUrl, accessToken, tenantId, `/bank-accounts/${id}/verify`, undefined, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ otp_code }),
    })
    if (!response.ok) {
      const errorData = await response.json()
      const errorMessage = Array.isArray(errorData.message)
        ? errorData.message[0]
        : errorData.message
      throw new Error(errorMessage || 'OTP verification failed')
    }
    return response.json()
  }

  const deleteBankAccount = async (id: string): Promise<{ message: string }> => {
    const response = await generateApiFetch(apiUrl, accessToken, tenantId, `/bank-accounts/${id}`, undefined, {
      method: 'DELETE',
    })
    if (!response.ok) {
      const errorData = await response.json()
      const errorMessage = Array.isArray(errorData.message)
        ? errorData.message[0]
        : errorData.message
      throw new Error(errorMessage || 'Failed to delete bank account')
    }
    return response.json()
  }

  return {
    getBankAccounts,
    addBankAccount,
    verifyOtp,
    deleteBankAccount,
  }
}
