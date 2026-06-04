export interface Permission {
  id: string
  name: string
  description: string
}

export function PermissionServiceGenerator(baseUrl: string, token: string, tenantId: string) {
  const headers = {
    'Content-Type': 'application/json',
    'Authorization': `VC ${token}`,
    'x-tenant-id': tenantId,
  }

  const getAll = async (): Promise<Permission[]> => {
    const response = await fetch(`${baseUrl}/permission`, { headers })
    if (!response.ok) {
      const err = await response.json().catch(() => ({}))
      throw new Error(err.message || 'Gagal memuat permissions')
    }
    return response.json()
  }

  return { getAll }
}
