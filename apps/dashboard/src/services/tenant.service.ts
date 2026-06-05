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

  const getDeviceSessions = async () => {
    const url = new URL(`${baseUrl}/tenant/owner/device-sessions`)
    const response = await fetch(url.toString(), {
      method: 'GET',
      headers: {
        'Authorization': `VC ${token}`,
        'x-tenant-id': tenantId,
      },
    })
    if (!response.ok) throw new Error('Gagal mengambil daftar perangkat')
    return response.json()
  }

  const revokeDeviceSession = async (sessionId: string) => {
    const url = new URL(`${baseUrl}/tenant/owner/device-sessions/${sessionId}/revoke`)
    const response = await fetch(url.toString(), {
      method: 'POST',
      headers: {
        'Authorization': `VC ${token}`,
        'x-tenant-id': tenantId,
      },
    })
    if (!response.ok) throw new Error('Gagal mengakhiri sesi')
    return response.json()
  }

  const getAllDeviceSessions = async () => {
    const url = new URL(`${baseUrl}/tenant/owner/all-device-sessions`)
    const response = await fetch(url.toString(), {
      method: 'GET',
      headers: {
        'Authorization': `VC ${token}`,
        'x-tenant-id': tenantId,
      },
    })
    if (!response.ok) throw new Error('Gagal mengambil semua perangkat')
    return response.json()
  }

  const revokeAnyDeviceSession = async (sessionId: string) => {
    const url = new URL(`${baseUrl}/tenant/owner/all-device-sessions/${sessionId}/revoke`)
    const response = await fetch(url.toString(), {
      method: 'POST',
      headers: {
        'Authorization': `VC ${token}`,
        'x-tenant-id': tenantId,
      },
    })
    if (!response.ok) throw new Error('Gagal mengakhiri sesi')
    return response.json()
  }

  return {
    changePassword,
    getDeviceSessions,
    revokeDeviceSession,
    getAllDeviceSessions,
    revokeAnyDeviceSession,
  }
}
