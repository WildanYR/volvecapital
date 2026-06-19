export interface ManualBookCategory {
  id: string;
  name: string;
  slug: string;
  parent_id?: string | null;
  description?: string;
  children?: ManualBookCategory[];
  created_at: string;
  updated_at: string;
}

export interface CreateManualBookCategoryPayload {
  name: string;
  slug: string;
  parent_id?: string | null;
  description?: string;
}

export interface UpdateManualBookCategoryPayload extends Partial<CreateManualBookCategoryPayload> {}

export interface ManualBook {
  id: string;
  category_id: string;
  title: string;
  slug: string;
  content?: string;
  status: 'DRAFT' | 'PUBLISHED';
  category?: ManualBookCategory;
  created_at: string;
  updated_at: string;
}

export interface CreateManualBookPayload {
  category_id: string;
  title: string;
  slug: string;
  content?: string;
  status?: 'DRAFT' | 'PUBLISHED';
}

export interface UpdateManualBookPayload extends Partial<CreateManualBookPayload> {}

export function ManualBookServiceGenerator(apiUrl: string, accessToken: string, tenantId: string) {
  const headers = {
    'Authorization': `VC ${accessToken}`,
    'x-tenant-id': tenantId,
    'Content-Type': 'application/json',
  };

  // --- Category APIs ---
  const getAllCategories = async ({ signal }: { signal?: AbortSignal } = {}): Promise<ManualBookCategory[]> => {
    const response = await fetch(`${apiUrl}/manual-book-category`, { headers, signal });
    if (!response.ok) throw new Error('Gagal mengambil data kategori manual book');
    return response.json();
  };

  const createCategory = async (payload: CreateManualBookCategoryPayload): Promise<ManualBookCategory> => {
    const response = await fetch(`${apiUrl}/manual-book-category`, {
      method: 'POST',
      headers,
      body: JSON.stringify(payload),
    });
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Gagal membuat kategori');
    }
    return response.json();
  };

  const updateCategory = async (id: string, payload: UpdateManualBookCategoryPayload): Promise<ManualBookCategory> => {
    const response = await fetch(`${apiUrl}/manual-book-category/${id}`, {
      method: 'PUT',
      headers,
      body: JSON.stringify(payload),
    });
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Gagal memperbarui kategori');
    }
    return response.json();
  };

  const deleteCategory = async (id: string): Promise<{ success: boolean }> => {
    const response = await fetch(`${apiUrl}/manual-book-category/${id}`, { method: 'DELETE', headers });
    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error(error.message || 'Gagal menghapus kategori');
    }
    return response.json().catch(() => ({ success: true }));
  };

  // --- Manual Book APIs ---
  const getAllManualBooks = async (params?: { status?: string, category_id?: string, q?: string }, { signal }: { signal?: AbortSignal } = {}): Promise<ManualBook[]> => {
    const url = new URL(`${apiUrl}/manual-book`);
    if (params?.status) url.searchParams.append('status', params.status);
    if (params?.category_id) url.searchParams.append('category_id', params.category_id);
    if (params?.q) url.searchParams.append('q', params.q);
    
    const response = await fetch(url.toString(), { headers, signal });
    if (!response.ok) throw new Error('Gagal mengambil data manual book');
    return response.json();
  };

  const getManualBookById = async (id: string): Promise<ManualBook> => {
    const response = await fetch(`${apiUrl}/manual-book/${id}`, { headers });
    if (!response.ok) throw new Error('Gagal mengambil detail manual book');
    return response.json();
  };

  const getManualBookBySlug = async (slug: string): Promise<ManualBook> => {
    const response = await fetch(`${apiUrl}/manual-book/slug/${slug}`, { headers });
    if (!response.ok) throw new Error('Gagal mengambil detail manual book (slug)');
    return response.json();
  };

  const createManualBook = async (payload: CreateManualBookPayload): Promise<ManualBook> => {
    const response = await fetch(`${apiUrl}/manual-book`, {
      method: 'POST',
      headers,
      body: JSON.stringify(payload),
    });
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Gagal membuat manual book');
    }
    return response.json();
  };

  const updateManualBook = async (id: string, payload: UpdateManualBookPayload): Promise<ManualBook> => {
    const response = await fetch(`${apiUrl}/manual-book/${id}`, {
      method: 'PUT',
      headers,
      body: JSON.stringify(payload),
    });
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Gagal memperbarui manual book');
    }
    return response.json();
  };

  const deleteManualBook = async (id: string): Promise<{ success: boolean }> => {
    const response = await fetch(`${apiUrl}/manual-book/${id}`, { method: 'DELETE', headers });
    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error(error.message || 'Gagal menghapus manual book');
    }
    return response.json().catch(() => ({ success: true }));
  };

  return {
    getAllCategories,
    createCategory,
    updateCategory,
    deleteCategory,
    getAllManualBooks,
    getManualBookById,
    getManualBookBySlug,
    createManualBook,
    updateManualBook,
    deleteManualBook,
  };
}
