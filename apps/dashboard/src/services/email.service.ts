import type { GetAllServiceFn } from '@/dashboard/types/get-all-service.type'
import { z } from 'zod'
import { generateApiFetch, parseApiResponse } from '@/dashboard/lib/api-fetch.util'
import { BaseQueryParamsSchema } from '@/dashboard/types/get-all-service.type'

export const EmailFilterSchema = z.object({
  email: z.string().optional(),
})

export type EmailFilter = z.infer<typeof EmailFilterSchema>

export const GetEmailsParamsSchema
  = BaseQueryParamsSchema.merge(EmailFilterSchema)

export type GetEmailsParams = z.infer<typeof GetEmailsParamsSchema>

export interface Email {
  id: string
  email: string
  password?: string
}

export interface CreateEmailPayload {
  email: string
  password?: string
}

export interface UpdateEmailPayload {
  email?: string
  password?: string
}

export function EmailServiceGenerator(apiUrl: string, accessToken: string, tenantId: string) {
  const getAllEmail: GetAllServiceFn<Email, EmailFilter> = async (params) => {
    const response = await generateApiFetch(
      apiUrl,
      accessToken,
      tenantId,
      '/email',
      params,
    )
    if (!response.ok) {
      const errorData = await parseApiResponse(response)
      const errorMessage = Array.isArray(errorData.message)
        ? errorData.message[0]
        : errorData.message
      throw new Error(errorMessage || 'Failed to fetch email')
    }

    return response.json()
  }

  const getEmailById = async (emailId: string, signal?: AbortSignal): Promise<Email> => {
    const response = await generateApiFetch(
      apiUrl,
      accessToken,
      tenantId,
      `/email/${emailId}`,
      { signal },
    )
    if (!response.ok) {
      const errorData = await response.json()
      const errorMessage = Array.isArray(errorData.message)
        ? errorData.message[0]
        : errorData.message
      throw new Error(errorMessage || 'Failed to fetch email')
    }

    return response.json()
  }

  const createNewEmail = async (
    payload: CreateEmailPayload,
  ): Promise<Email> => {
    const response = await generateApiFetch(
      apiUrl,
      accessToken,
      tenantId,
      '/email',
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
      throw new Error(errorMessage || 'Failed to create email')
    }

    return response.json()
  }

  const updateEmail = async (
    emailId: string,
    payload: UpdateEmailPayload,
  ): Promise<Email> => {
    const response = await generateApiFetch(
      apiUrl,
      accessToken,
      tenantId,
      `/email/${emailId}`,
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
      throw new Error(errorMessage || 'Failed to update email')
    }

    return response.json()
  }

  const deleteEmail = async (emailId: string): Promise<void> => {
    const response = await generateApiFetch(
      apiUrl,
      accessToken,
      tenantId,
      `/email/${emailId}`,
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
      throw new Error(errorMessage || 'Failed to delete email')
    }
  }

  return {
    getAllEmail,
    getEmailById,
    createNewEmail,
    updateEmail,
    deleteEmail,
  }
}
