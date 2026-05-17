'use client'

import { ArrowRight, Zap } from 'lucide-react'
import Link from 'next/link'
import type { LandingHeroConfig } from '@volvecapital/shared/types'
import { useEffect, useState } from 'react'

interface HeroProps {
  config?: LandingHeroConfig | null
}

export function Hero({ config }: HeroProps) {
  const badge = config?.badge || "Sistem Voucher Otomatis 24/7"
  const title = config?.title || "Akses Layanan Premium Seketika."
  const subtitle = config?.subtitle || "Dapatkan akses instan ke hiburan favoritmu. Proses otomatis, pembayaran aman, dan voucher terkirim detik ini juga."
  const button1Text = config?.button1Text || "Mulai Berlangganan"
  const button2Text = config?.button2Text || "Tukarkan Voucher"

  const [mounted, setMounted] = useState(false)
  useEffect(() => {
    setMounted(true)
  }, [])

  const words = title.split(' ')
  const lastWord = words.pop()
  const rest = words.join(' ')

  return (
    <section className={`relative min-h-screen flex flex-col items-center justify-center pt-20 overflow-hidden z-10 w-full ${config?.backgroundImageUrl ? 'bg-background' : 'bg-background'}`}>
      {/* Background Image & Gradient Overlay */}
      {config?.backgroundImageUrl && (
        <div className="absolute inset-0 z-0" style={{ transform: 'translateZ(0)' }}>
          <img
            src={config.backgroundImageUrl}
            alt="Hero Background"
            className="w-full h-full object-cover opacity-50"
            loading="eager"
            //@ts-ignore
            fetchPriority="high"
          />
          {/* Layer 1: Horizontal Tint - no blend mode on mobile */}
          <div className="absolute inset-0 bg-gradient-to-r from-blue-950/95 via-blue-900/90 to-indigo-900/80 md:mix-blend-multiply opacity-90" />
          {/* Layer 2: Vertical Darkening */}
          <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-slate-900/90" />
        </div>
      )}

      <div className="w-full max-w-7xl px-6 relative z-10 flex flex-col items-center">
        <div className="max-w-4xl mx-auto text-center">
          {/* Badge */}
          <div
            className={`inline-flex items-center gap-2 px-4 py-1.5 rounded-full border ${config?.backgroundImageUrl ? 'bg-background/10 border-white/20' : 'bg-primary/10 border-primary/20'} mb-8 reveal-hidden ${mounted ? 'reveal-visible' : ''}`}
          >
            <Zap className={`size-4 ${config?.backgroundImageUrl ? 'text-white' : 'text-primary'}`} />
            <span className={`text-[10px] md:text-xs font-bold tracking-wider uppercase ${config?.backgroundImageUrl ? 'text-white' : 'text-primary'}`}>{badge}</span>
          </div>

          {/* Headline */}
          <h1
            className={`text-5xl md:text-[88px] font-black mb-8 leading-[1] tracking-tight ${config?.backgroundImageUrl ? 'text-white' : 'text-foreground'} reveal-hidden delay-100 ${mounted ? 'reveal-visible' : ''}`}
          >
            <span>{rest}</span>{' '}
            <span className="bg-clip-text text-transparent bg-gradient-to-br from-primary to-primary/80">
              {lastWord}
            </span>
          </h1>

          {/* Subheadline */}
          <p
            className={`${config?.backgroundImageUrl ? 'text-slate-200' : 'text-muted-foreground'} text-lg md:text-xl max-w-2xl mx-auto mb-12 leading-relaxed font-medium reveal-hidden delay-200 ${mounted ? 'reveal-visible' : ''}`}
          >
            {subtitle}
          </p>

          {/* CTAs */}
          <div
            className={`flex flex-col sm:flex-row items-center justify-center gap-5 reveal-hidden delay-300 ${mounted ? 'reveal-visible' : ''}`}
          >
            <Link
              href="/product"
              className={`px-10 py-5 ${config?.backgroundImageUrl ? 'bg-primary hover:bg-primary/90' : 'bg-primary hover:bg-primary/90'} text-primary-foreground font-bold rounded-2xl flex items-center gap-3 w-full sm:w-auto justify-center text-lg shadow-xl hover:scale-110 active:scale-95 transition-all`}
            >
              {button1Text}
              <ArrowRight className="size-5" />
            </Link>
            <Link
              href="/redeem"
              className={`px-10 py-5 ${config?.backgroundImageUrl ? 'bg-background/10 border-white/20 text-white hover:bg-background/20' : 'bg-background text-foreground border-border hover:bg-muted/50'} font-bold rounded-2xl border hover:scale-110 active:scale-95 transition-all w-full sm:w-auto justify-center flex items-center text-lg shadow-sm`}
            >
              {button2Text}
            </Link>
          </div>
        </div>
      </div>
    </section>
  )
}
