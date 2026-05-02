'use client'

import { motion } from 'framer-motion'
import { ArrowRight, Zap } from 'lucide-react'
import Link from 'next/link'

import type { LandingHeroConfig } from '@volvecapital/shared/types'

interface HeroProps {
  config?: LandingHeroConfig | null
}

export function Hero({ config }: HeroProps) {
  const badge = config?.badge || "Sistem Voucher Otomatis 24/7"
  const title = config?.title || "Akses Layanan Premium Seketika."
  const subtitle = config?.subtitle || "Dapatkan akses instan ke hiburan favoritmu. Proses otomatis, pembayaran aman, dan voucher terkirim detik ini juga."
  const button1Text = config?.button1Text || "Mulai Berlangganan"
  const button2Text = config?.button2Text || "Tukarkan Voucher"

  return (
    <section className={`relative min-h-screen flex flex-col items-center justify-center pt-20 overflow-hidden z-10 w-full ${config?.backgroundImageUrl ? 'bg-slate-900' : 'bg-white'}`}>
      {/* Background Image & Double Gradient Overlay (Rapatonline Style) */}
      {config?.backgroundImageUrl && (
        <div className="absolute inset-0 z-0">
          <img 
            src={config.backgroundImageUrl} 
            alt="Hero Background" 
            className="w-full h-full object-cover opacity-50"
          />
          {/* Layer 1: Horizontal Tint with Multiply Blend */}
          <div className="absolute inset-0 bg-gradient-to-r from-blue-950/95 via-blue-900/90 to-indigo-900/80 mix-blend-multiply" />
          
          {/* Layer 2: Vertical Darkening for Text Contrast */}
          <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-slate-900/90" />
        </div>
      )}

      <div className="w-full max-w-7xl px-6 relative z-10 flex flex-col items-center">
        <div className="max-w-4xl mx-auto text-center">
          {/* Badge */}
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className={`inline-flex items-center gap-2 px-4 py-1.5 rounded-full ${config?.backgroundImageUrl ? 'bg-white/10 border-white/20' : 'bg-orange-50 border-orange-100'} mb-8`}
          >
            <Zap className={`size-4 ${config?.backgroundImageUrl ? 'text-white' : 'text-[#f97316]'}`} />
            <span className={`text-[10px] md:text-xs font-bold tracking-wider uppercase ${config?.backgroundImageUrl ? 'text-white' : 'text-[#f97316]'}`}>{badge}</span>
          </motion.div>

          {/* Headline */}
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className={`text-5xl md:text-[88px] font-black mb-8 leading-[1] tracking-tight ${config?.backgroundImageUrl ? 'text-white' : 'text-[#0f172a]'}`}
          >
            {(() => {
              const words = title.split(' ')
              const lastWord = words.pop()
              const rest = words.join(' ')
              return (
                <>
                  <span>{rest}</span>{' '}
                  <span className="bg-clip-text text-transparent bg-gradient-to-br from-[#f97316] to-[#ef4444]">
                    {lastWord}
                  </span>
                </>
              )
            })()}
          </motion.h1>

          {/* Subheadline */}
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className={`${config?.backgroundImageUrl ? 'text-slate-200' : 'text-slate-600'} text-lg md:text-xl max-w-2xl mx-auto mb-12 leading-relaxed font-medium`}
          >
            {subtitle}
          </motion.p>

          {/* CTAs */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="flex flex-col sm:flex-row items-center justify-center gap-5"
          >
            <Link 
              href="/product"
              className={`px-10 py-5 ${config?.backgroundImageUrl ? 'bg-[#f97316] hover:bg-orange-600' : 'bg-[#0f172a] hover:bg-slate-800'} text-white font-bold rounded-2xl flex items-center gap-3 w-full sm:w-auto justify-center text-lg shadow-xl hover:scale-110 active:scale-95 transition-all`}
            >
              {button1Text}
              <ArrowRight className="size-5" />
            </Link>
            <Link 
              href="/redeem"
              className={`px-10 py-5 ${config?.backgroundImageUrl ? 'bg-white/10 border-white/20 text-white hover:bg-white/20' : 'bg-white text-[#0f172a] border-slate-200 hover:bg-slate-50'} font-bold rounded-2xl border hover:scale-110 active:scale-95 transition-all w-full sm:w-auto justify-center flex items-center text-lg shadow-sm`}
            >
              {button2Text}
            </Link>
          </motion.div>
        </div>
      </div>

    </section>
  )
}
