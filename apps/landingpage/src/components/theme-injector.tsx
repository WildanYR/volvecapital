"use client"

import { useEffect } from "react"
import { useTenant } from "@/hooks/use-tenant"
import { useSettings } from "@/hooks/use-settings"

// ID yang sama dengan yang di-inject server-side (layout.tsx)
const STYLE_ID = "tenant-theme-css"

function applyThemeCss(css: string) {
  // Cari tag <style> yang sudah ada (dari SSR), update isinya in-place.
  // Kalau belum ada (SSR gagal / first client load), buat baru.
  // Ini memastikan CSS tidak pernah hilang dari DOM — tidak ada gap reconciliation.
  let el = document.getElementById(STYLE_ID) as HTMLStyleElement | null
  if (!el) {
    el = document.createElement("style")
    el.id = STYLE_ID
    document.head.appendChild(el)
  }
  el.textContent = css
}

export function ThemeInjector() {
  const { tenantId } = useTenant()
  const { data: settings } = useSettings(tenantId)

  useEffect(() => {
    if (settings?.LANDING_THEME_CSS) {
      applyThemeCss(settings.LANDING_THEME_CSS)
    }
  }, [settings])

  // Render nothing — CSS dikelola langsung lewat DOM
  return null
}
