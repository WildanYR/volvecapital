import type { GetAllServiceFn } from '@/dashboard/types/get-all-service.type'
import { z } from 'zod'
import {
  generateApiFetch,
  parseApiResponse,
} from '@/dashboard/lib/api-fetch.util'
import { BaseQueryParamsSchema } from '@/dashboard/types/get-all-service.type'

export const ExpenseFilterSchema = z.object({
  subject_id: z.string().optional(),
  type: z.string().optional(),
})

export type ExpenseFilter = z.infer<typeof ExpenseFilterSchema>

export const GetExpensesParamsSchema
  = BaseQueryParamsSchema.merge(ExpenseFilterSchema)

export type GetExpenseParams = z.infer<typeof GetExpensesParamsSchema>

export interface Expense {
  id: string
  amount: string
  note?: string
  subject_id?: string
  type: string
  created_at: Date
}

export interface CreateExpensePayload {
  amount: number
  note?: string
  subject_id?: string
  type: string
}

export function ExpenseServiceGenerator(
  apiUrl: string,
  accessToken: string,
  tenantId: string,
) {
  const getAllExpense: GetAllServiceFn<Expense, ExpenseFilter> = async (
    params,
  ) => {
    const response = await generateApiFetch(
      apiUrl,
      accessToken,
      tenantId,
      '/expense',
      params,
    )
    if (!response.ok) {
      const errorData = await parseApiResponse(response)
      const errorMessage = Array.isArray(errorData.message)
        ? errorData.message[0]
        : errorData.message
      throw new Error(errorMessage || 'Failed to fetch account expenses')
    }

    const data = await response.json()
    return {
      ...data,
      items: data.items.map((item: any) => ({
        ...item,
        created_at: new Date(item.created_at),
      })),
    }
  }

  const createExpense = async (
    payload: CreateExpensePayload,
  ): Promise<Expense> => {
    const response = await generateApiFetch(
      apiUrl,
      accessToken,
      tenantId,
      '/expense',
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
      throw new Error(errorMessage || 'Failed to create account expense')
    }

    return response.json()
  }

  const deleteExpense = async (id: string): Promise<void> => {
    const response = await generateApiFetch(
      apiUrl,
      accessToken,
      tenantId,
      `/expense/${id}`,
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
      throw new Error(errorMessage || 'Failed to delete account expense')
    }
  }

  return {
    getAllExpense,
    createExpense,
    deleteExpense,
  }
}
