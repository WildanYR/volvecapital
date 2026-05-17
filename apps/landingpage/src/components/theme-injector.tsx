"use client"

import { useEffect, useState } from "react"
import { api } from "@/lib/api"
import { useTenant } from "@/hooks/use-tenant"

export function ThemeInjector() {
  const [themeCss, setThemeCss] = useState<string | null>(null)
  const { tenantId } = useTenant()

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const { data } = await api.get('/public/settings')
        if (data.LANDING_THEME_CSS) {
          setThemeCss(data.LANDING_THEME_CSS)
        }
      } catch (error) {
        console.error('Failed to fetch theme settings:', error)
      }
    }

    if (tenantId) {
      fetchSettings()
    }
  }, [tenantId])

  if (!themeCss) return null

  return (
    <style dangerouslySetInnerHTML={{ __html: themeCss }} />
  )
}
