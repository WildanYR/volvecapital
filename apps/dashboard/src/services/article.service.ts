export interface ArticleStep {
  title: string;
  description: string;
  image_url: string;
}

export interface Article {
  id: string;
  title: string;
  slug: string;
  subtitle?: string;
  thumbnail_url?: string;
  category?: string;
  is_published: boolean;
  content_steps: ArticleStep[];
  created_at: string;
  updated_at: string;
}

export interface CreateArticlePayload {
  title: string;
  subtitle?: string;
  thumbnail_url?: string;
  category?: string;
  is_published?: boolean;
  content_steps?: ArticleStep[];
}

export interface UpdateArticlePayload extends Partial<CreateArticlePayload> {}

export function ArticleServiceGenerator(apiUrl: string, accessToken: string, tenantId: string) {
  const headers = {
    'Authorization': `VC ${accessToken}`,
    'x-tenant-id': tenantId,
    'Content-Type': 'application/json',
  };

  const getAllArticles = async ({ signal }: { signal?: AbortSignal } = {}): Promise<Article[]> => {
    const response = await fetch(`${apiUrl}/article`, { headers, signal });
    if (!response.ok) throw new Error('Gagal mengambil data artikel');
    return response.json();
  };

  const getArticleById = async (id: string): Promise<Article> => {
    const response = await fetch(`${apiUrl}/article/${id}`, { headers });
    if (!response.ok) throw new Error('Gagal mengambil detail artikel');
    return response.json();
  };

  const createArticle = async (payload: CreateArticlePayload): Promise<Article> => {
    const response = await fetch(`${apiUrl}/article`, {
      method: 'POST',
      headers,
      body: JSON.stringify(payload),
    });
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Gagal membuat artikel');
    }
    return response.json();
  };

  const updateArticle = async (id: string, payload: UpdateArticlePayload): Promise<Article> => {
    const response = await fetch(`${apiUrl}/article/${id}`, {
      method: 'PUT',
      headers,
      body: JSON.stringify(payload),
    });
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Gagal memperbarui artikel');
    }
    return response.json();
  };

  const deleteArticle = async (id: string): Promise<{ success: boolean }> => {
    const response = await fetch(`${apiUrl}/article/${id}`, {
      method: 'DELETE',
      headers,
    });
    if (!response.ok) throw new Error('Gagal menghapus artikel');
    return response.json();
  };

  return {
    getAllArticles,
    getArticleById,
    createArticle,
    updateArticle,
    deleteArticle,
  };
}
