import { generateApiFetch } from '../lib/api-fetch.util'

export interface EmailSubject {
  id: string;
  context: string;
  subject: string;
  created_at: string;
  updated_at: string;
}

export function EmailSubjectServiceGenerator(apiUrl: string, accessToken: string, tenantId: string) {
  const getEmailSubjects = async (): Promise<EmailSubject[]> => {
    const response = await generateApiFetch(apiUrl, accessToken, tenantId, '/email-subject')
    if (!response.ok) {
      throw new Error('Failed to fetch email subjects')
    }
    return response.json()
  }

  const createEmailSubject = async (data: { context: string; subject: string }): Promise<EmailSubject> => {
    const response = await generateApiFetch(apiUrl, accessToken, tenantId, '/email-subject', {}, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    })
    if (!response.ok) {
      throw new Error('Failed to create email subject')
    }
    return response.json()
  }

  const deleteEmailSubject = async (id: string): Promise<void> => {
    const response = await generateApiFetch(apiUrl, accessToken, tenantId, `/email-subject/${id}`, {}, {
      method: 'DELETE',
    })
    if (!response.ok) {
      throw new Error('Failed to delete email subject')
    }
  }

  return {
    getEmailSubjects,
    createEmailSubject,
    deleteEmailSubject,
  }
}
