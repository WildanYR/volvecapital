'use client'

import { Star, Quote } from 'lucide-react'
import type { LandingTestimonialItem } from '@volvecapital/shared/types'
import { useScrollReveal } from '@/hooks/use-scroll-reveal'

interface TestimonialsProps {
  items?: LandingTestimonialItem[]
}

export function Testimonials({ items }: TestimonialsProps) {
  const defaultTestimonials = [
    { name: "Andi Pratama", role: "Pelanggan Setia", content: "Prosesnya beneran instan! Bayar pakai QRIS, hitungan detik kode voucher langsung masuk WA. Netflix saya aktif lagi tanpa nunggu admin.", avatar: "A" },
    { name: "Siti Aminah", role: "Freelancer", content: "Harga paling murah dibanding toko sebelah, tapi kualitasnya premium banget. Udah langganan 6 bulan di sini gapernah ada masalah.", avatar: "S" },
    { name: "Budi Santoso", role: "Gamer", content: "CS nya ramah banget pas nanya-nanya di WA. Recomended banget buat yang mau cari voucher premium murah dan aman.", avatar: "B" }
  ]

  const displayItems = items && items.length > 0 ? items : defaultTestimonials
  const ref = useScrollReveal()

  return (
    <section className="py-32 px-6 w-full flex justify-center bg-slate-50/50">
      <div ref={ref} className="w-full max-w-7xl">
        <div className="text-center mb-24">
          <h2 className="text-4xl md:text-5xl font-black text-[#0f172a] mb-6 reveal-hidden">
            Apa Kata <span className="bg-clip-text text-transparent bg-gradient-to-br from-[#f97316] to-[#ef4444]">Mereka?</span>
          </h2>
          <p className="text-slate-500 text-lg font-medium reveal-hidden delay-100">Ribuan pelanggan telah mempercayakan hiburan mereka kepada kami.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {displayItems.map((item, index) => (
            <div
              key={index}
              className={`p-10 rounded-[40px] bg-white border border-slate-100 shadow-sm relative group hover:shadow-2xl transition-all duration-500 reveal-hidden delay-${((index % 3) + 2) * 100}`}
            >
              <Quote className="absolute top-8 right-8 size-10 text-orange-100 group-hover:text-orange-200 transition-colors" />

              <div className="flex gap-1 mb-6">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="size-4 text-[#f97316] fill-[#f97316]" />
                ))}
              </div>

              <p className="text-slate-600 leading-relaxed font-medium mb-8 italic">
                &ldquo;{item.content}&rdquo;
              </p>

              <div className="flex items-center gap-4">
                <div className="size-12 rounded-full bg-gradient-to-br from-[#f97316] to-[#ef4444] flex items-center justify-center text-white font-black text-xl shadow-lg">
                  {item.avatar || item.name[0]}
                </div>
                <div>
                  <h4 className="text-[#0f172a] font-black text-lg">{item.name}</h4>
                  <p className="text-slate-400 text-xs font-bold uppercase tracking-widest">{item.role}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
