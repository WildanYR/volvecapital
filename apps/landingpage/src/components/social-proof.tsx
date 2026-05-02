'use client'

import { motion } from 'framer-motion'
import { Star, Users, Sparkles, ShieldCheck } from 'lucide-react'

interface SocialProofProps {
  config?: any | null
}

export function SocialProof({ config }: SocialProofProps) {
  // If showSocialProof is explicitly false, don't render
  if (config?.showSocialProof === false) return null

  // Get items from config, or fallback to default stats
  const items = config?.socialProofItems || []
  
  // Smart validation: Check if there's at least one item with actual content
  const hasContent = items.length > 0 && items.some((item: any) => 
    (item.number && item.number.trim() !== '') || 
    (item.label && item.label.trim() !== '')
  )

  const defaultStats = [
    {
      id: 'default-1',
      number: '94.469+',
      label: 'Transaksi Berhasil',
      icon: Users,
    },
    {
      id: 'default-2',
      number: '4.9/5',
      label: 'Rating Layanan',
      icon: Star,
      fill: true
    },
    {
      id: 'default-3',
      number: '24/7',
      label: 'Sistem Otomatis',
      icon: Sparkles,
    }
  ]

  const displayItems = hasContent ? items : defaultStats

  return (
    <section className="py-16 bg-white relative z-10 border-b border-slate-50">
      <div className="max-w-7xl mx-auto px-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="flex flex-wrap items-center justify-center gap-10 md:gap-24"
        >
          {displayItems.map((item: any, i: number) => (
            <motion.div
              key={item.id || i}
              initial={{ opacity: 0, scale: 0.9 }}
              whileInView={{ opacity: 1, scale: 1 }}
              transition={{ delay: i * 0.1 }}
              viewport={{ once: true }}
              className="flex items-center gap-5 group"
            >
              <div className="size-14 md:size-16 rounded-2xl bg-orange-50 flex items-center justify-center group-hover:scale-110 group-hover:bg-orange-100 transition-all duration-300 shadow-sm border border-orange-100/50">
                {item.iconEmbed ? (
                  <div 
                    className="size-8 text-[#f97316] flex items-center justify-center"
                    dangerouslySetInnerHTML={{ __html: item.iconEmbed }}
                  />
                ) : (
                  item.icon ? (
                    <item.icon className={`size-8 text-[#f97316] ${item.fill ? 'fill-[#f97316]' : ''}`} />
                  ) : (
                    <ShieldCheck className="size-8 text-[#f97316]" />
                  )
                )}
              </div>
              <div className="text-left">
                <div className="text-2xl md:text-3xl font-black text-[#0f172a] tracking-tighter leading-none">
                  {item.number || item.value}
                </div>
                <div className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] leading-none mt-2">
                  {item.label}
                </div>
              </div>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  )
}
