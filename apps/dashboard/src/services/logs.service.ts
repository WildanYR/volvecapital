import type { GetAllServiceFn } from '../types/get-all-service.type'
import { z } from 'zod'
import { generateApiFetch } from '../lib/api-fetch.util'
import { BaseQueryParamsSchema } from '../types/get-all-service.type'

export const LogsFilterSchema = z.object({
  level: z.string().optional(),
  context: z.string().optional(),
})

export type LogsFilter = z.infer<typeof LogsFilterSchema>

export const GetLogsParamsSchema = BaseQueryParamsSchema.merge(
  LogsFilterSchema,
)

export type GetLogsParams = z.infer<typeof GetLogsParamsSchema>

export interface Logs {
  id: string
  level: string
  context: string
  message: string
  stack?: string
  tenant_id?: string
  created_at: Date
}

export function LogsServiceGenerator(apiUrl: string, accessToken: string, tenantId: string) {
  const getLogs: GetAllServiceFn<Logs, LogsFilter> = async (params) => {
    const response = await generateApiFetch(apiUrl, accessToken, tenantId, '/log', params)
    if (!response.ok) {
      const errorData = await response.json()
      const errorMessage = Array.isArray(errorData.message)
        ? errorData.message[0]
        : errorData.message
      throw new Error(errorMessage || 'Failed to fetch logs')
    }

    const data = await response.json()
    const logs = data.items?.length
      ? (data.items as Array<Logs>).map(log => ({
          ...log,
          created_at: new Date(log.created_at),
        }))
      : []

    return {
      ...data,
      items: logs,
    }
  }

  return {
    getLogs,
  }
}
