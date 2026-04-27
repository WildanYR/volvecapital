export interface TutorialStep {
  label: string;
  title: string;
  description: string;
  image_url: string;
}

export interface Tutorial {
  id: string;
  title: string;
  slug: string;
  subtitle?: string;
  thumbnail_url?: string;
  is_published: boolean;
  steps: TutorialStep[];
  created_at: string;
  updated_at: string;
}

export interface CreateTutorialPayload {
  title: string;
  subtitle?: string;
  thumbnail_url?: string;
  is_published?: boolean;
  steps?: TutorialStep[];
}

export interface UpdateTutorialPayload extends Partial<CreateTutorialPayload> {}

export function TutorialServiceGenerator(apiUrl: string, accessToken: string, tenantId: string) {
  const headers = {
    'Authorization': `VC ${accessToken}`,
    'x-tenant-id': tenantId,
    'Content-Type': 'application/json',
  };

  const getAllTutorials = async ({ signal }: { signal?: AbortSignal } = {}): Promise<Tutorial[]> => {
    const response = await fetch(`${apiUrl}/tutorial`, { headers, signal });
    if (!response.ok) throw new Error('Gagal mengambil data tutorial');
    return response.json();
  };

  const getTutorialById = async (id: string): Promise<Tutorial> => {
    const response = await fetch(`${apiUrl}/tutorial/${id}`, { headers });
    if (!response.ok) throw new Error('Gagal mengambil detail tutorial');
    return response.json();
  };

  const createTutorial = async (payload: CreateTutorialPayload): Promise<Tutorial> => {
    const response = await fetch(`${apiUrl}/tutorial`, {
      method: 'POST',
      headers,
      body: JSON.stringify(payload),
    });
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Gagal membuat tutorial');
    }
    return response.json();
  };

  const updateTutorial = async (id: string, payload: UpdateTutorialPayload): Promise<Tutorial> => {
    const response = await fetch(`${apiUrl}/tutorial/${id}`, {
      method: 'PUT',
      headers,
      body: JSON.stringify(payload),
    });
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Gagal memperbarui tutorial');
    }
    return response.json();
  };

  const deleteTutorial = async (id: string): Promise<{ success: boolean }> => {
    const response = await fetch(`${apiUrl}/tutorial/${id}`, {
      method: 'DELETE',
      headers,
    });
    if (!response.ok) throw new Error('Gagal menghapus tutorial');
    return response.json();
  };

  return {
    getAllTutorials,
    getTutorialById,
    createTutorial,
    updateTutorial,
    deleteTutorial,
  };
}
