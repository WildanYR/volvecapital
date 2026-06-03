import type { GetAllServiceFn } from '@/dashboard/types/get-all-service.type'
import { z } from 'zod'
import { generateApiFetch, parseApiResponse } from '@/dashboard/lib/api-fetch.util'
import { BaseQueryParamsSchema } from '@/dashboard/types/get-all-service.type'

export const EmailSubjectFilterSchema = z.object({
  subject: z.string().optional(),
  context: z.string().optional(),
})

export type EmailSubjectFilter = z.infer<typeof EmailSubjectFilterSchema>

export const GetEmailSubjectsParamsSchema
  = BaseQueryParamsSchema.merge(EmailSubjectFilterSchema)

export type GetEmailSubjectsParams = z.infer<typeof GetEmailSubjectsParamsSchema>

export interface EmailSubject {
  id: string
  subject: string
  context: string
  extract_method: string
}

export interface CreateEmailSubjectPayload {
  subject: string
  context: string
  extract_method: string
}

export interface UpdateEmailSubjectPayload {
  subject?: string
  context?: string
  extract_method?: string
}

export function EmailSubjectServiceGenerator(apiUrl: string, accessToken: string, tenantId: string) {
  const getAllEmailSubject: GetAllServiceFn<EmailSubject, EmailSubjectFilter> = async (params) => {
    const response = await generateApiFetch(
      apiUrl,
      accessToken,
      tenantId,
      '/email-subject',
      params,
    )
    if (!response.ok) {
      const errorData = await parseApiResponse(response)
      const errorMessage = Array.isArray(errorData.message)
        ? errorData.message[0]
        : errorData.message
      throw new Error(errorMessage || 'Failed to fetch email subjects')
    }

    return response.json()
  }

  const getEmailSubjectById = async (id: string, signal?: AbortSignal): Promise<EmailSubject> => {
    const response = await generateApiFetch(
      apiUrl,
      accessToken,
      tenantId,
      `/email-subject/${id}`,
      { signal },
    )
    if (!response.ok) {
      const errorData = await response.json()
      const errorMessage = Array.isArray(errorData.message)
        ? errorData.message[0]
        : errorData.message
      throw new Error(errorMessage || 'Failed to fetch email subject')
    }

    return response.json()
  }

  const createEmailSubject = async (
    payload: CreateEmailSubjectPayload,
  ): Promise<EmailSubject> => {
    const response = await generateApiFetch(
      apiUrl,
      accessToken,
      tenantId,
      '/email-subject',
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
      throw new Error(errorMessage || 'Failed to create email subject')
    }

    return response.json()
  }

  const updateEmailSubject = async (
    id: string,
    payload: UpdateEmailSubjectPayload,
  ): Promise<EmailSubject> => {
    const response = await generateApiFetch(
      apiUrl,
      accessToken,
      tenantId,
      `/email-subject/${id}`,
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
      throw new Error(errorMessage || 'Failed to update email subject')
    }

    return response.json()
  }

  const deleteEmailSubject = async (id: string): Promise<void> => {
    const response = await generateApiFetch(
      apiUrl,
      accessToken,
      tenantId,
      `/email-subject/${id}`,
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
      throw new Error(errorMessage || 'Failed to delete email subject')
    }
  }

  return {
    getAllEmailSubject,
    getEmailSubjectById,
    createEmailSubject,
    updateEmailSubject,
    deleteEmailSubject,
  }
}
