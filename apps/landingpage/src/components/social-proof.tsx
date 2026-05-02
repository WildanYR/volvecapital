'use client'

import { motion } from 'framer-motion'
import { Star, Users, Sparkles } from 'lucide-react'

interface SocialProofProps {
  config?: {
    stats_transactions?: string
    stats_rating?: string
    stats_automation?: string
  } | null
}

export function SocialProof({ config }: SocialProofProps) {
  const stats = [
    {
      label: 'Transaksi Berhasil',
      value: config?.stats_transactions || '94.469+',
      icon: Users,
    },
    {
      label: 'Rating Layanan',
      value: config?.stats_rating || '4.9/5',
      icon: Star,
      fill: true
    },
    {
      label: 'Sistem Otomatis',
      value: config?.stats_automation || '24/7',
      icon: Sparkles,
    }
  ]

  return (
    <section className="py-12 bg-white relative z-10">
      <div className="max-w-7xl mx-auto px-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="flex flex-wrap items-center justify-center gap-10 md:gap-24"
        >
          {stats.map((stat, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, scale: 0.9 }}
              whileInView={{ opacity: 1, scale: 1 }}
              transition={{ delay: i * 0.1 }}
              viewport={{ once: true }}
              className="flex items-center gap-5 group"
            >
              <div className="size-14 rounded-2xl bg-orange-50 flex items-center justify-center group-hover:scale-110 group-hover:bg-orange-100 transition-all duration-300">
                <stat.icon className={`size-7 text-[#f97316] ${stat.fill ? 'fill-[#f97316]' : ''}`} />
              </div>
              <div className="text-left">
                <div className="text-2xl font-black text-[#0f172a] tracking-tight">{stat.value}</div>
                <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-none mt-1">{stat.label}</div>
              </div>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  )
}
