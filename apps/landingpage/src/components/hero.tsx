'use client'

import { motion } from 'framer-motion'
import { ArrowRight, ShoppingBag, Sparkles, Star, Users } from 'lucide-react'
import Link from 'next/link'

import type { LandingHeroConfig } from '@volvecapital/shared/types'

interface HeroProps {
  config?: LandingHeroConfig | null
}

export function Hero({ config }: HeroProps) {
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
        delayChildren: 0.3,
      },
    },
  }

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.8, ease: "easeOut" } },
  }

  // Default values
  const badge = config?.badge || "Sistem Voucher Otomatis 24/7"
  const title = config?.title || "Akses Layanan Premium Seketika."
  const subtitle = config?.subtitle || "Dapatkan akses instan ke hiburan favoritmu. Proses otomatis, pembayaran aman, dan voucher terkirim detik ini juga."
  const button1Text = config?.button1Text || "Mulai Berlangganan"
  const button2Text = config?.button2Text || "Tukarkan Voucher"
  const showBadge = config?.showBadge ?? true
  const showCTAs = config?.showCTAs ?? true
  const showSocialProof = config?.showSocialProof ?? true

  return (
    <section className="relative min-h-screen flex items-center justify-center pt-32 pb-20 overflow-hidden z-10 w-full">
      <div className="w-full max-w-7xl px-6 md:px-12 relative z-10">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="max-w-5xl mx-auto text-center"
        >
          {/* Badge */}
          {showBadge && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.2 }}
              className="inline-flex items-center gap-3 px-6 py-2 rounded-full glass border-primary/20 mb-10 shadow-[0_0_30px_rgba(255,184,0,0.1)]"
            >
              <Sparkles className="size-4 text-primary animate-pulse" />
              <span className="text-[10px] md:text-xs font-black tracking-[0.3em] uppercase text-primary">{badge}</span>
            </motion.div>
          )}

          {/* Headline */}
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="text-6xl md:text-9xl font-black mb-8 leading-[0.95] tracking-tightest text-white"
          >
            {(() => {
              const words = title.split(' ')
              if (words.length <= 1) return title
              
              // Split approximately in half
              const halfIndex = Math.ceil(words.length / 2)
              
              return words.map((word, i) => (
                <span key={i}>
                  <span className={i >= halfIndex ? "inline-block text-gradient" : "text-white"}>
                    {word}
                  </span>
                  {i < words.length - 1 ? ' ' : ''}
                </span>
              ))
            })()}
          </motion.h1>

          {/* Subheadline */}
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="text-gray-400 text-lg md:text-2xl max-w-2xl mx-auto mb-14 leading-relaxed px-4 font-medium"
          >
            {subtitle}
          </motion.p>

          {/* CTAs */}
          {showCTAs && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
              className="flex flex-col sm:flex-row items-center justify-center gap-6 px-4 mb-20"
            >
              <Link 
                href="/product"
                className="group relative px-12 py-5 bg-gradient-gold text-black font-black rounded-2xl transition-all hover:scale-105 active:scale-95 flex items-center gap-3 w-full sm:w-auto justify-center shadow-[0_15px_40px_rgba(255,184,0,0.3)]"
              >
                {button1Text}
                <ArrowRight className="size-5 group-hover:translate-x-1 transition-transform" />
              </Link>
              <Link 
                href="/redeem"
                className="group relative px-12 py-5 bg-green-500 text-black font-black rounded-2xl transition-all hover:scale-105 active:scale-95 flex items-center gap-3 w-full sm:w-auto justify-center shadow-[0_15px_40px_rgba(255,184,0,0.3)]"
              >
                {button2Text}
              </Link>
            </motion.div>
          )}

          {/* Social Proof */}
          {showSocialProof && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.7 }}
              className="flex flex-wrap items-center justify-center gap-8 md:gap-16 pt-16 border-t border-white/5"
            >
              {(config?.socialProofItems && config.socialProofItems.length > 0 
                ? config.socialProofItems 
                : [{ id: 'default-1', number: '2.000+', label: 'Pelanggan Aktif', iconEmbed: '' }]
              ).map((item) => (
                <div key={item.id} className="flex flex-col items-center gap-1">
                  <div className="flex items-center gap-2 text-white font-black text-2xl">
                    {item.iconEmbed ? (
                      item.iconEmbed.startsWith('http') ? (
                        <img src={item.iconEmbed} alt={item.label} className="size-6 object-contain" />
                      ) : (
                        <div dangerouslySetInnerHTML={{ __html: item.iconEmbed }} />
                      )
                    ) : (
                      <Users className="size-5 text-primary" />
                    )}
                    {item.number}
                  </div>
                  <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">{item.label}</span>
                </div>
              ))}
              
              {/* Hardcoded Rating for now, or user can add it to the list */}
              <div className="flex flex-col items-center gap-1">
                <div className="flex items-center gap-2 text-white font-black text-2xl">
                  <Star className="size-5 text-primary fill-primary" />
                  4.9/5
                </div>
                <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Rating Layanan</span>
              </div>
            </motion.div>
          )}
        </motion.div>
      </div>
    </section>
  )
}
