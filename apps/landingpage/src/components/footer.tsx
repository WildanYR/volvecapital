'use client'

import { useState, useEffect } from 'react'
import { Crown, Instagram, Twitter, MessageCircle } from 'lucide-react'
import Link from 'next/link'
import { useTenant } from '@/hooks/use-tenant'
import { useSettings } from '@/hooks/use-settings'
import { api } from '@/lib/api'
import type { LandingFooterConfig, LandingNavbarConfig } from '@volvecapital/shared/types'

interface FooterProps {
  config?: LandingFooterConfig | null
}

export function Footer({ config: initialConfig }: FooterProps) {
  const { tenantId } = useTenant()
  const { data: settings } = useSettings(tenantId)
  const [config, setConfig] = useState<LandingFooterConfig | null>(initialConfig || null)
  const [brandName, setBrandName] = useState(tenantId ? tenantId.toUpperCase() : '')
  const [logoIcon, setLogoIcon] = useState<string | null>(null)

  useEffect(() => {
    if (initialConfig) {
      setConfig(initialConfig)
      // Attempt to extract brand details from initialConfig if present, or just let it fall back
      return
    }
    
    if (settings) {
      if (settings.LANDING_FOOTER) {
        try {
          setConfig(JSON.parse(settings.LANDING_FOOTER))
        } catch (e) {
          console.error(e)
        }
      }
      
      if (settings.LANDING_NAVBAR) {
        try {
          const navConfig = JSON.parse(settings.LANDING_NAVBAR) as LandingNavbarConfig
          if (navConfig.logoText) {
            setBrandName(navConfig.logoText)
          }
          if (navConfig.logoIconEmbed) {
            setLogoIcon(navConfig.logoIconEmbed)
          }
        } catch (e) {
          console.error(e)
        }
      }
    }
  }, [initialConfig, settings])

  const address = config?.address || 'Solusi hiburan premium terbaik dengan sistem otomatisasi voucher 24/7. Cepat, aman, dan terpercaya.'
  const email = config?.email || (tenantId ? `support@${tenantId}.com` : 'support@volvecapital.com')

  const renderLogoIcon = () => {
    if (!logoIcon) {
      return (
        <div className="bg-gradient-to-br from-primary to-primary/80 p-2.5 rounded-2xl shadow-lg transition-transform duration-300">
          <Crown className="size-6 text-white" />
        </div>
      )
    }

    if (logoIcon.startsWith('<svg')) {
      const encodedSvg = `data:image/svg+xml;utf8,${encodeURIComponent(logoIcon)}`;
      return (
        <div className="relative h-11 w-auto flex items-center transition-all duration-500 text-primary">
          <div 
            className="absolute inset-0 bg-current transition-colors duration-500"
            style={{
              maskImage: `url('${encodedSvg}')`,
              WebkitMaskImage: `url('${encodedSvg}')`,
              maskSize: 'contain',
              maskRepeat: 'no-repeat',
              maskPosition: 'left center',
              WebkitMaskSize: 'contain',
              WebkitMaskRepeat: 'no-repeat',
              WebkitMaskPosition: 'left center',
            }}
          />
          <div 
            className="h-full w-auto opacity-0 [&>svg]:h-full [&>svg]:w-auto pointer-events-none"
            dangerouslySetInnerHTML={{ __html: logoIcon }}
          />
        </div>
      )
    }

    return (
      <div className="h-11 w-auto flex items-center justify-center transition-colors duration-500 overflow-hidden text-primary">
        <img 
          src={logoIcon} 
          alt={brandName} 
          className="h-full w-auto object-contain transition-all duration-500"
          style={{
            transform: 'translateX(-9999px)',
            filter: 'drop-shadow(9999px 0 0 currentColor)'
          }}
        />
      </div>
    )
  }

  return (
    <footer className="py-24 px-6 w-full flex justify-center bg-muted/50 border-t border-border">
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
