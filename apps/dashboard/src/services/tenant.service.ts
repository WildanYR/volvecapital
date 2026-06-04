export function TenantServiceGenerator(baseUrl: string, token: string, tenantId: string) {
  const changePassword = async (payload: any) => {
    const url = new URL(`${baseUrl}/tenant/owner/change-password`)
    const response = await fetch(url.toString(), {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `VC ${token}`,
        'x-tenant-id': tenantId,
      },
      body: JSON.stringify(payload),
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      throw new Error(errorData.message || 'Gagal mengubah password')
    }

    return response.json()
  }

  return {
    changePassword,
  }
}
