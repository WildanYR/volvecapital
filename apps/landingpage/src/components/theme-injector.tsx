"use client"

import { useEffect, useState } from "react"
import { useTenant } from "@/hooks/use-tenant"
import { useSettings } from "@/hooks/use-settings"

export function ThemeInjector() {
  const { tenantId } = useTenant()
  const { data: settings } = useSettings(tenantId)
  const [themeCss, setThemeCss] = useState<string | null>(null)

  useEffect(() => {
    if (settings && settings.LANDING_THEME_CSS) {
      setThemeCss(settings.LANDING_THEME_CSS)
    }
  }, [settings])

  if (!themeCss) return null

  return (
    <style dangerouslySetInnerHTML={{ __html: themeCss }} />
  )
}
