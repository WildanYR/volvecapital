'use client'

import { UserMinus, Zap, Clock, MessageCircle, ShieldCheck, CreditCard } from 'lucide-react'
import type { LandingFeatureConfig } from '@volvecapital/shared/types'
import { useScrollReveal } from '@/hooks/use-scroll-reveal'

interface FeaturesProps {
  config?: LandingFeatureConfig | null
}

export function Features({ config }: FeaturesProps) {
  const defaultFeatures = [
    { id: 'd1', lucideIcon: UserMinus, title: "Tanpa Login", description: "Beli voucher tanpa perlu membuat akun. Cukup masukkan email/WA.", color: "bg-primary/10 text-primary" },
    { id: 'd2', lucideIcon: Zap, title: "Proses Instan", description: "Voucher otomatis terkirim sesaat setelah pembayaran terkonfirmasi.", color: "bg-primary/10 text-primary" },
    { id: 'd3', lucideIcon: CreditCard, title: "Pembayaran Lengkap", description: "Mendukung QRIS, Virtual Account, dan berbagai metode lainnya.", color: "bg-primary/10 text-primary" },
    { id: 'd4', lucideIcon: Clock, title: "Aktif 24/7", description: "Sistem kami bekerja otomatis setiap saat, bahkan di hari libur.", color: "bg-primary/10 text-primary" },
    { id: 'd5', lucideIcon: MessageCircle, title: "Support WhatsApp", description: "Tim bantuan kami siap membantu jika Anda mengalami kendala.", color: "bg-primary/10 text-primary" },
    { id: 'd6', lucideIcon: ShieldCheck, title: "Legal & Bergaransi", description: "Semua produk adalah legal dan kami memberikan garansi penuh.", color: "bg-primary/10 text-primary" }
  ]

  const items = config?.items && config.items.length > 0 ? config.items : defaultFeatures
  const sectionTitle = config?.sectionTitle || "Keunggulan Digital Premium"
  const titleParts = sectionTitle.split(' ')
  const lastWord = titleParts.pop()
  const mainTitle = titleParts.join(' ')

  const ref = useScrollReveal()

  return (
    <section className="py-32 px-6 w-full flex justify-center bg-background">
      <div ref={ref} className="w-full max-w-7xl">
        <div className="text-center mb-24">
          <h2 className="text-4xl md:text-5xl font-black text-foreground mb-6 reveal-hidden">
            {mainTitle}{' '}
            <span className="bg-clip-text text-transparent bg-gradient-to-br from-primary to-primary/80">
              {lastWord}
            </span>
          </h2>
          <p className="text-muted-foreground text-lg font-medium reveal-hidden delay-100">Layanan terbaik dengan teknologi otomatisasi terdepan.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
          {items.map((feature: any, index: number) => (
            <div
              key={feature.id || index}
              className={`p-10 rounded-3xl bg-background border border-border hover:shadow-2xl transition-all duration-500 group text-center flex flex-col items-center reveal-hidden delay-${((index % 3) + 2) * 100}`}
            >
              <div className={`p-6 rounded-[30px] mb-8 group-hover:scale-110 transition-transform duration-500 ${feature.color || 'bg-primary/10 text-primary'}`}>
                {feature.lucideIcon ? <feature.lucideIcon className="size-8" /> : <Zap className="size-8" />}
              </div>
              <h3 className="text-2xl font-black text-foreground mb-4 tracking-tight">{feature.title}</h3>
              <p className="text-muted-foreground leading-relaxed font-medium">
                {feature.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
