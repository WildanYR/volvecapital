import { useEffect } from 'react'
import { useNavigate, useLocation } from '@tanstack/react-router'
import { useQuery } from '@tanstack/react-query'
import { useAuth } from '@/dashboard/context-providers/auth.provider'
import { API_URL } from '@/dashboard/constants/api-url.cont'

export function AttendanceCheck() {
  const auth = useAuth()
  const navigate = useNavigate()
  const { pathname } = useLocation()

  const { data, isLoading } = useQuery({
    queryKey: ['attendance', 'today'],
    queryFn: async () => {
      const res = await fetch(`${API_URL}/attendance/me/today`, {
        headers: {
          'Authorization': `VC ${auth.tenant?.accessToken}`,
          'x-tenant-id': auth.tenant?.id || '',
        },
      })
      if (!res.ok) throw new Error('Failed to fetch')
      return res.json()
    },
    enabled: auth.tenant?.role === 'DASHBOARD_USER',
  })

  useEffect(() => {
    if (isLoading || !data) return
    
    // If not started and not on day off, redirect to attendance page
    if (
      data.status === 'not_started' && 
      !data.is_off && 
      pathname !== '/dashboard/attendance/me'
    ) {
      navigate({ to: '/dashboard/attendance/me' })
    }
  }, [data, isLoading, pathname, navigate])

  return null
}
