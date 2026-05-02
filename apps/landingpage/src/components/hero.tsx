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
    <section className="relative min-h-screen flex flex-col items-center justify-center pt-20 overflow-hidden z-10 w-full bg-white">
      {/* Background is now pure white as requested */}
      <div className="w-full max-w-7xl px-6 relative z-10 flex flex-col items-center">
        <div className="max-w-4xl mx-auto text-center">
          {/* Badge */}
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-orange-50 border border-orange-100 mb-8"
          >
            <Zap className="size-4 text-[#f97316]" />
            <span className="text-[10px] md:text-xs font-bold tracking-wider uppercase text-[#f97316]">{badge}</span>
          </motion.div>

          {/* Headline - Navy pekat & Gradient Orange */}
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-5xl md:text-[88px] font-black mb-8 leading-[1] tracking-tight text-[#0f172a]"
          >
            {(() => {
              const words = title.split(' ')
              const lastWord = words.pop()
              const rest = words.join(' ')
              return (
                <>
                  <span className="text-[#0f172a]">{rest}</span>{' '}
                  <span className="bg-clip-text text-transparent bg-gradient-to-br from-[#f97316] to-[#ef4444]">
                    {lastWord}
                  </span>
                </>
              )
            })()}
          </motion.h1>

          {/* Subheadline - Slate pekat agar terbaca */}
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-slate-600 text-lg md:text-xl max-w-2xl mx-auto mb-12 leading-relaxed font-medium"
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
              className="px-10 py-5 bg-[#0f172a] text-white font-bold rounded-2xl flex items-center gap-3 w-full sm:w-auto justify-center text-lg shadow-[0_15px_30px_rgba(15,23,42,0.15)] hover:bg-slate-800 transition-all"
            >
              {button1Text}
              <ArrowRight className="size-5" />
            </Link>
            <Link 
              href="/redeem"
              className="px-10 py-5 bg-white text-[#0f172a] font-bold rounded-2xl border border-slate-200 hover:bg-slate-50 transition-all w-full sm:w-auto justify-center flex items-center text-lg shadow-sm"
            >
              {button2Text}
            </Link>
          </motion.div>
        </div>
      </div>

      {/* Scroll Indicator */}
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1 }}
        className="absolute bottom-10 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2"
      >
        <div className="w-[1px] h-12 bg-gradient-to-b from-slate-200 to-transparent" />
      </motion.div>
    </section>
  )
}
