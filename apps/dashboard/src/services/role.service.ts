import type { Permission } from './permission.service'

export interface Role {
  id: string
  name: string
  description?: string
  permissions: Permission[]
  created_at: string
  updated_at: string
}

export function RoleServiceGenerator(baseUrl: string, token: string, tenantId: string) {
  const headers = {
    'Content-Type': 'application/json',
    'Authorization': `VC ${token}`,
    'x-tenant-id': tenantId,
  }

  const getAll = async (): Promise<Role[]> => {
    const response = await fetch(`${baseUrl}/role`, { headers })
    if (!response.ok) {
      const err = await response.json().catch(() => ({}))
      throw new Error(err.message || 'Gagal memuat roles')
    }
    return response.json()
  }

  const getOne = async (id: string): Promise<Role> => {
    const response = await fetch(`${baseUrl}/role/${id}`, { headers })
    if (!response.ok) {
      const err = await response.json().catch(() => ({}))
      throw new Error(err.message || 'Gagal memuat role')
    }
    return response.json()
  }

  const create = async (payload: { name: string, description?: string, permission_ids?: string[] }): Promise<Role> => {
    const response = await fetch(`${baseUrl}/role`, {
      method: 'POST',
      headers,
      body: JSON.stringify(payload),
    })
    if (!response.ok) {
      const err = await response.json().catch(() => ({}))
      throw new Error(err.message || 'Gagal membuat role')
    }
    return response.json()
  }

  const update = async (id: string, payload: { name?: string, description?: string }): Promise<Role> => {
    const response = await fetch(`${baseUrl}/role/${id}`, {
      method: 'PATCH',
      headers,
      body: JSON.stringify(payload),
    })
    if (!response.ok) {
      const err = await response.json().catch(() => ({}))
      throw new Error(err.message || 'Gagal memperbarui role')
    }
    return response.json()
  }

  const setPermissions = async (id: string, permission_ids: string[]): Promise<Role> => {
    const response = await fetch(`${baseUrl}/role/${id}/permissions`, {
      method: 'PUT',
      headers,
      body: JSON.stringify({ permission_ids }),
    })
    if (!response.ok) {
      const err = await response.json().catch(() => ({}))
      throw new Error(err.message || 'Gagal mengatur permissions')
    }
    return response.json()
  }

  const remove = async (id: string): Promise<void> => {
    const response = await fetch(`${baseUrl}/role/${id}`, { method: 'DELETE', headers })
    if (!response.ok) {
      const err = await response.json().catch(() => ({}))
      throw new Error(err.message || 'Gagal menghapus role')
    }
  }

  return { getAll, getOne, create, update, setPermissions, remove }
}
