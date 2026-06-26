import { generateApiFetch, parseApiResponse } from '@/dashboard/lib/api-fetch.util'

export function AccountingServiceGenerator(
  apiUrl: string,
  accessToken: string,
  tenantId: string,
) {
  return {
    getCoaList: async (params?: { signal?: AbortSignal }) => {
      const response = await generateApiFetch(apiUrl, accessToken, tenantId, '/accounting/coa', params)
      return parseApiResponse(response)
    },
    createCoa: async (data: { code: string, name: string, type: string, normal_balance: string }) => {
      const response = await generateApiFetch(apiUrl, accessToken, tenantId, '/accounting/coa', undefined, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })
      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.message || 'Gagal membuat COA')
      }
      return parseApiResponse(response)
    },
    updateCoa: async (id: string, data: { code?: string, name?: string, type?: string, normal_balance?: string, is_active?: boolean }) => {
      const response = await generateApiFetch(apiUrl, accessToken, tenantId, `/accounting/coa/${id}`, undefined, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })
      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.message || 'Gagal mengubah COA')
      }
      return parseApiResponse(response)
    },
    deleteCoa: async (id: string) => {
      const response = await generateApiFetch(apiUrl, accessToken, tenantId, `/accounting/coa/${id}`, undefined, {
        method: 'DELETE',
      })
      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.message || 'Gagal menghapus COA')
      }
      return parseApiResponse(response)
    },
    
    getJournalEntries: async (params?: { signal?: AbortSignal }) => {
      const response = await generateApiFetch(apiUrl, accessToken, tenantId, '/accounting/journal', params)
      return parseApiResponse(response)
    },
    
    createJournalEntry: async (data: any, params?: { signal?: AbortSignal }) => {
      const response = await generateApiFetch(
        apiUrl, 
        accessToken, 
        tenantId, 
        '/accounting/journal', 
        params,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(data)
        }
      )
      
      if (!response.ok) {
        const errorData = await parseApiResponse(response)
        throw new Error(errorData.message || 'Failed to create journal entry')
      }
      
      return parseApiResponse(response)
    },
    
    getLedger: async (coaId: string, params?: { signal?: AbortSignal }) => {
      const response = await generateApiFetch(apiUrl, accessToken, tenantId, '/accounting/ledger', {
        coa_id: coaId,
        ...params
      })
      return parseApiResponse(response)
    },
    
    getTrialBalance: async (params?: { signal?: AbortSignal }) => {
      const response = await generateApiFetch(apiUrl, accessToken, tenantId, '/accounting/trial-balance', params)
      return parseApiResponse(response)
    },
    
    voidJournal: async (id: string, params?: { signal?: AbortSignal }) => {
      const response = await generateApiFetch(apiUrl, accessToken, tenantId, `/accounting/journal/${id}/void`, params, { method: 'PUT' })
      return parseApiResponse(response)
    },
    
    getIncomeStatement: async (params?: { startDate?: string, endDate?: string, signal?: AbortSignal }) => {
      const response = await generateApiFetch(apiUrl, accessToken, tenantId, '/accounting/income-statement', params)
      return parseApiResponse(response)
    },
    
    getBalanceSheet: async (params?: { asOfDate?: string, signal?: AbortSignal }) => {
      const response = await generateApiFetch(apiUrl, accessToken, tenantId, '/accounting/balance-sheet', params)
      return parseApiResponse(response)
    },
    
    getPeriods: async (params?: { signal?: AbortSignal }) => {
      const response = await generateApiFetch(apiUrl, accessToken, tenantId, '/accounting/periods', params)
      return parseApiResponse(response)
    },
    
    closePeriod: async (data: { periodName: string, startDate: string, endDate: string }, params?: { signal?: AbortSignal }) => {
      const response = await generateApiFetch(apiUrl, accessToken, tenantId, '/accounting/periods/close', params, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      })
      if (!response.ok) {
        const errorData = await parseApiResponse(response)
        throw new Error(errorData.message || 'Failed to close period')
      }
      return parseApiResponse(response)
    },
    
    getPlatformSettings: async (params?: { signal?: AbortSignal }) => {
      const response = await generateApiFetch(apiUrl, accessToken, tenantId, '/accounting/platform-settings', params)
      return parseApiResponse(response)
    },
    
    createPlatformSetting: async (data: any, params?: { signal?: AbortSignal }) => {
      const response = await generateApiFetch(apiUrl, accessToken, tenantId, '/accounting/platform-settings', params, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      })
      if (!response.ok) {
        const errorData = await parseApiResponse(response)
        throw new Error(errorData.message || 'Failed to create platform setting')
      }
      return parseApiResponse(response)
    },
    
    updatePlatformSetting: async (id: string, data: any, params?: { signal?: AbortSignal }) => {
      const response = await generateApiFetch(apiUrl, accessToken, tenantId, `/accounting/platform-settings/${id}`, params, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      })
      if (!response.ok) {
        const errorData = await parseApiResponse(response)
        throw new Error(errorData.message || 'Failed to update platform setting')
      }
      return parseApiResponse(response)
    },
    
    deletePlatformSetting: async (id: string, params?: { signal?: AbortSignal }) => {
      const response = await generateApiFetch(apiUrl, accessToken, tenantId, `/accounting/platform-settings/${id}`, params, {
        method: 'DELETE'
      })
      if (!response.ok) {
        const errorData = await parseApiResponse(response)
        throw new Error(errorData.message || 'Failed to delete platform setting')
      }
      return parseApiResponse(response)
    },
    
    // --- Journal Templates ---
    getJournalTemplates: async (params?: { signal?: AbortSignal }) => {
      const response = await generateApiFetch(apiUrl, accessToken, tenantId, '/accounting/templates', params)
      if (!response.ok) throw new Error('Failed to fetch templates')
      return parseApiResponse(response)
    },

    createJournalTemplate: async (payload: any, params?: { signal?: AbortSignal }) => {
      const response = await generateApiFetch(apiUrl, accessToken, tenantId, '/accounting/templates', params, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      })
      if (!response.ok) {
        const errorData = await parseApiResponse(response)
        throw new Error(errorData.message || 'Failed to create template')
      }
      return parseApiResponse(response)
    },

    updateJournalTemplate: async (id: string, payload: any, params?: { signal?: AbortSignal }) => {
      const response = await generateApiFetch(apiUrl, accessToken, tenantId, `/accounting/templates/${id}`, params, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      })
      if (!response.ok) {
        const errorData = await parseApiResponse(response)
        throw new Error(errorData.message || 'Failed to update template')
      }
      return parseApiResponse(response)
    },

    deleteJournalTemplate: async (id: string, params?: { signal?: AbortSignal }) => {
      const response = await generateApiFetch(apiUrl, accessToken, tenantId, `/accounting/templates/${id}`, params, {
        method: 'DELETE'
      })
      if (!response.ok) {
        const errorData = await parseApiResponse(response)
        throw new Error(errorData.message || 'Failed to delete template')
      }
      return parseApiResponse(response)
    }
  }
}
