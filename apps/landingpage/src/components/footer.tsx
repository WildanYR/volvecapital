'use client'

import { useState, useEffect } from 'react'
import { Crown, Instagram, Twitter, MessageCircle } from 'lucide-react'
import Link from 'next/link'
import { useTenant } from '@/hooks/use-tenant'
import { api } from '@/lib/api'
import type { LandingFooterConfig, LandingNavbarConfig } from '@volvecapital/shared/types'

interface FooterProps {
  config?: LandingFooterConfig | null
}

export function Footer({ config: initialConfig }: FooterProps) {
  const [config, setConfig] = useState<LandingFooterConfig | null>(initialConfig || null)
  const [brandName, setBrandName] = useState('DIGITAL PREMIUM')
  const [logoIcon, setLogoIcon] = useState<string | null>(null)
  const { tenantId } = useTenant()

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const { data } = await api.get('/public/settings')
        
        if (data.LANDING_FOOTER) {
          setConfig(JSON.parse(data.LANDING_FOOTER))
        }
        
        if (data.LANDING_NAVBAR) {
          const navConfig = JSON.parse(data.LANDING_NAVBAR) as LandingNavbarConfig
          if (navConfig.logoText) {
            setBrandName(navConfig.logoText)
          }
          if (navConfig.logoIconEmbed) {
            setLogoIcon(navConfig.logoIconEmbed)
          }
        }
      } catch (error) {
        console.error('Failed to fetch footer settings:', error)
      }
    }

    if (tenantId) {
      fetchSettings()
    }
  }, [tenantId])

  const address = config?.address || 'Solusi hiburan premium terbaik dengan sistem otomatisasi voucher 24/7. Cepat, aman, dan terpercaya.'
  const email = config?.email || 'support@volvecapital.com'

  const renderLogoIcon = () => {
    if (!logoIcon) {
      return (
        <div className="bg-gradient-to-br from-primary to-primary/80 p-2.5 rounded-2xl shadow-lg transition-transform duration-300">
          <Crown className="size-6 text-white" />
        </div>
      )
    }

    if (logoIcon.startsWith('<svg')) {
      return (
        <div 
          className="h-11 w-auto flex items-center justify-center transition-transform duration-300"
          dangerouslySetInnerHTML={{ __html: logoIcon }}
        />
      )
    }

    return (
      <div className="h-11 w-auto flex items-center justify-center transition-transform duration-300">
        <img src={logoIcon} alt={brandName} className="h-full w-auto object-contain" />
      </div>
    )
  }

  return (
    <footer className="py-24 px-6 w-full flex justify-center bg-background border-t border-border">
      <div className="w-full max-w-7xl relative z-10">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 md:gap-12 lg:gap-16 mb-20">
          <div className="md:col-span-2 lg:col-span-2 space-y-8">
            <Link href="/" className="flex items-center gap-3 group">
              {renderLogoIcon()}
              <span className="text-3xl font-black tracking-tighter text-foreground uppercase">
                {brandName}
              </span>
            </Link>
            <p className="text-muted-foreground text-lg max-w-md leading-relaxed font-medium">
              {address}
            </p>
            <div className="flex items-center gap-6">
              <Link href="#" className="size-12 rounded-2xl bg-muted/50 border border-border flex items-center justify-center text-muted-foreground hover:text-primary hover:border-primary/30 hover:bg-primary/5 transition-all">
                <Instagram className="size-6" />
              </Link>
              <Link href="#" className="size-12 rounded-2xl bg-muted/50 border border-border flex items-center justify-center text-muted-foreground hover:text-primary hover:border-primary/30 hover:bg-primary/5 transition-all">
                <Twitter className="size-6" />
              </Link>
              <Link href="#" className="size-12 rounded-2xl bg-muted/50 border border-border flex items-center justify-center text-muted-foreground hover:text-primary hover:border-primary/30 hover:bg-primary/5 transition-all">
                <MessageCircle className="size-6" />
              </Link>
            </div>
          </div>

          <div>
            <h4 className="text-foreground font-black uppercase tracking-[0.2em] text-xs mb-8">Navigasi</h4>
            <ul className="space-y-5">
              <li><Link href="/" className="text-muted-foreground hover:text-primary transition-colors text-base font-bold">Beranda</Link></li>
              <li><Link href="/product" className="text-muted-foreground hover:text-primary transition-colors text-base font-bold">Semua Produk</Link></li>
              <li><Link href="/redeem" className="text-muted-foreground hover:text-primary transition-colors text-base font-bold">Tukar Voucher</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="text-foreground font-black uppercase tracking-[0.2em] text-xs mb-8">Bantuan</h4>
            <ul className="space-y-5">
              <li><Link href="/terms" className="text-muted-foreground hover:text-primary transition-colors text-base font-bold">Syarat & Ketentuan</Link></li>
              <li><Link href="/privacy" className="text-muted-foreground hover:text-primary transition-colors text-base font-bold">Kebijakan Privasi</Link></li>
            </ul>
          </div>
        </div>

        {/* Improved Bottom Bar - Centered on Mobile like Rapatonline */}
        <div className="pt-10 border-t border-border flex flex-col md:flex-row justify-between items-center text-center md:text-left gap-6">
          <p className="text-xs text-muted-foreground font-bold uppercase tracking-[0.2em] w-full md:w-auto">
            © 2026 {brandName}. All rights reserved.
          </p>
          <div className="flex items-center justify-center md:justify-end gap-2 text-[10px] text-muted-foreground font-black uppercase tracking-widest w-full md:w-auto">
            <span>Powered by</span>
            <span className="text-foreground">Digital Premium Infrastructure</span>
          </div>
        </div>
      </div>
    </footer>
  )
}
