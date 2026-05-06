'use client'

import { motion } from 'framer-motion'
import { UserMinus, Zap, Clock, MessageCircle, ShieldCheck, CreditCard } from 'lucide-react'
import type { LandingFeatureConfig } from '@volvecapital/shared/types'

interface FeaturesProps {
  config?: LandingFeatureConfig | null
}

export function Features({ config }: FeaturesProps) {
  const defaultFeatures = [
    { id: 'd1', lucideIcon: UserMinus, title: "Tanpa Login", description: "Beli voucher tanpa perlu membuat akun. Cukup masukkan email/WA.", color: "bg-blue-50 text-blue-500" },
    { id: 'd2', lucideIcon: Zap, title: "Proses Instan", description: "Voucher otomatis terkirim sesaat setelah pembayaran terkonfirmasi.", color: "bg-orange-50 text-orange-500" },
    { id: 'd3', lucideIcon: CreditCard, title: "Pembayaran Lengkap", description: "Mendukung QRIS, Virtual Account, dan berbagai metode lainnya.", color: "bg-green-50 text-green-500" },
    { id: 'd4', lucideIcon: Clock, title: "Aktif 24/7", description: "Sistem kami bekerja otomatis setiap saat, bahkan di hari libur.", color: "bg-purple-50 text-purple-500" },
    { id: 'd5', lucideIcon: MessageCircle, title: "Support WhatsApp", description: "Tim bantuan kami siap membantu jika Anda mengalami kendala.", color: "bg-emerald-50 text-emerald-500" },
    { id: 'd6', lucideIcon: ShieldCheck, title: "Legal & Bergaransi", description: "Semua produk adalah legal dan kami memberikan garansi penuh.", color: "bg-red-50 text-red-500" }
  ]

  const items = config?.items && config.items.length > 0 ? config.items : defaultFeatures
  const sectionTitle = config?.sectionTitle || "Keunggulan Digital Premium"
  const titleParts = sectionTitle.split(' ')
  const lastWord = titleParts.pop()
  const mainTitle = titleParts.join(' ')

  return (
    <section className="py-32 px-6 w-full flex justify-center bg-white">
      <div className="w-full max-w-7xl">
        <div className="text-center mb-24">
          <h2 className="text-4xl md:text-5xl font-black text-[#0f172a] mb-6">
            {mainTitle}{' '}
            <span className="bg-clip-text text-transparent bg-gradient-to-br from-[#f97316] to-[#ef4444]">
              {lastWord}
            </span>
          </h2>
          <p className="text-slate-500 text-lg font-medium">Layanan terbaik dengan teknologi otomatisasi terdepan.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
          {items.map((feature: any, index: number) => (
            <motion.div
              key={feature.id || index}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1 }}
              className="p-10 rounded-3xl bg-white border border-slate-100 hover:shadow-2xl transition-all duration-500 group text-center flex flex-col items-center"
            >
              <div className={`p-6 rounded-[30px] mb-8 group-hover:scale-110 transition-transform duration-500 ${feature.color || 'bg-orange-50 text-orange-500'}`}>
                {feature.lucideIcon ? <feature.lucideIcon className="size-8" /> : <Zap className="size-8" />}
              </div>
              <h3 className="text-2xl font-black text-[#0f172a] mb-4 tracking-tight">{feature.title}</h3>
              <p className="text-slate-500 leading-relaxed font-medium">
                {feature.description}
              </p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}
