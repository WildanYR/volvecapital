'use client'

import { motion } from 'framer-motion'
import { UserMinus, Zap, Clock, MessageCircle, ShieldCheck, CreditCard } from 'lucide-react'
import type { LandingFeatureItem, LandingFeatureConfig } from '@volvecapital/shared/types'

interface FeaturesProps {
  config?: LandingFeatureConfig | null
}

export function Features({ config }: FeaturesProps) {
  const defaultFeatures = [
    {
      id: 'd1',
      lucideIcon: UserMinus,
      title: "Tanpa Login",
      description: "Beli voucher tanpa perlu membuat akun. Cukup masukkan email/WA.",
      iconEmbed: ''
    },
    {
      id: 'd2',
      lucideIcon: Zap,
      title: "Proses Instan",
      description: "Voucher otomatis terkirim sesaat setelah pembayaran terkonfirmasi.",
      iconEmbed: ''
    },
    {
      id: 'd3',
      lucideIcon: CreditCard,
      title: "Pembayaran Lengkap",
      description: "Mendukung QRIS, Virtual Account, dan berbagai metode lainnya.",
      iconEmbed: ''
    },
    {
      id: 'd4',
      lucideIcon: Clock,
      title: "Aktif 24/7",
      description: "Sistem kami bekerja otomatis setiap saat, bahkan di hari libur.",
      iconEmbed: ''
    },
    {
      id: 'd5',
      lucideIcon: MessageCircle,
      title: "Support WhatsApp",
      description: "Tim bantuan kami siap membantu jika Anda mengalami kendala.",
      iconEmbed: ''
    },
    {
      id: 'd6',
      lucideIcon: ShieldCheck,
      title: "Legal & Bergaransi",
      description: "Semua produk adalah legal dan kami memberikan garansi penuh.",
      iconEmbed: ''
    }
  ]

  const items = config?.items && config.items.length > 0 ? config.items : defaultFeatures
  const sectionTitle = config?.sectionTitle || "Kenapa Memilih Volve Capital?"
  
  // Logic for 2-color title: Last word is primary color
  const titleParts = sectionTitle.split(' ')
  const lastWord = titleParts.pop()
  const mainTitle = titleParts.join(' ')

  return (
    <section className="py-24 px-6 w-full flex justify-center z-10">
      <div className="w-full max-w-7xl md:px-12">
        <div className="text-center mb-20">
          <motion.h2 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-4xl md:text-5xl font-black text-white mb-6"
          >
            {mainTitle} <span className="text-primary">{lastWord}</span>
          </motion.h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {items.map((feature: any, index: number) => (
            <motion.div
              key={feature.id || index}
              initial={{ opacity: 0, scale: 0.95 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1 }}
              className="p-8 rounded-[32px] glass-card border-white/5 hover:border-primary/20 transition-all duration-500 group"
            >
              <div className="bg-primary/10 p-4 rounded-2xl w-fit mb-6 group-hover:bg-primary group-hover:text-black transition-all duration-500 text-primary">
                {feature.iconEmbed ? (
                  <div className="size-6 flex items-center justify-center">
                    {feature.iconEmbed.startsWith('http') ? (
                      <img src={feature.iconEmbed} alt={feature.title} className="size-6 object-contain" />
                    ) : (
                      <div className="size-6" dangerouslySetInnerHTML={{ __html: feature.iconEmbed }} />
                    )}
                  </div>
                ) : feature.lucideIcon ? (
                  <feature.lucideIcon className="size-6" />
                ) : (
                  <Zap className="size-6" />
                )}
              </div>
              <h3 className="text-xl font-black text-white mb-3">{feature.title}</h3>
              <p className="text-gray-500 leading-relaxed text-sm">
                {feature.description}
              </p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}
