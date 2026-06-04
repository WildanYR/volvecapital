import type { Role } from './role.service'

export interface DashboardUser {
  id: string
  name: string
  email: string
  is_active: boolean
  role: Role
  created_at: string
  updated_at: string
}

export function DashboardUserServiceGenerator(baseUrl: string, token: string, tenantId: string) {
  const headers = {
    'Content-Type': 'application/json',
    'Authorization': `VC ${token}`,
    'x-tenant-id': tenantId,
  }

  const getAll = async (): Promise<DashboardUser[]> => {
    const response = await fetch(`${baseUrl}/dashboard-user`, { headers })
    if (!response.ok) {
      const err = await response.json().catch(() => ({}))
      throw new Error(err.message || 'Gagal memuat staff')
    }
    return response.json()
  }

  const create = async (payload: {
    name: string
    email: string
    password: string
    role_id: string
  }): Promise<DashboardUser> => {
    const response = await fetch(`${baseUrl}/dashboard-user`, {
      method: 'POST',
      headers,
      body: JSON.stringify(payload),
    })
    if (!response.ok) {
      const err = await response.json().catch(() => ({}))
      throw new Error(err.message || 'Gagal membuat staff')
    }
    return response.json()
  }

  const update = async (id: string, payload: {
    name?: string
    email?: string
    password?: string
    role_id?: string
    is_active?: boolean
  }): Promise<DashboardUser> => {
    const response = await fetch(`${baseUrl}/dashboard-user/${id}`, {
      method: 'PATCH',
      headers,
      body: JSON.stringify(payload),
    })
    if (!response.ok) {
      const err = await response.json().catch(() => ({}))
      throw new Error(err.message || 'Gagal memperbarui staff')
    }
    return response.json()
  }

  const remove = async (id: string): Promise<void> => {
    const response = await fetch(`${baseUrl}/dashboard-user/${id}`, {
      method: 'DELETE',
      headers,
    })
    if (!response.ok) {
      const err = await response.json().catch(() => ({}))
      throw new Error(err.message || 'Gagal menghapus staff')
    }
  }

  const changePassword = async (payload: any): Promise<{ message: string }> => {
    const response = await fetch(`${baseUrl}/dashboard-user/change-password`, {
      method: 'PATCH',
      headers,
      body: JSON.stringify(payload),
    })
    if (!response.ok) {
      const err = await response.json().catch(() => ({}))
      throw new Error(err.message || 'Gagal mengubah password')
    }
    return response.json()
  }

  return { getAll, create, update, remove, changePassword }
}
