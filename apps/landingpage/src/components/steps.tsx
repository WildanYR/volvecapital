'use client'

import { Search, CreditCard, CheckCircle2 } from 'lucide-react'
import { useScrollReveal } from '@/hooks/use-scroll-reveal'

export function Steps() {
  const steps = [
    {
      icon: Search,
      title: "Pilih Variant & Bayar",
      description: "Pilih layanan premium yang kamu butuhkan dan selesaikan pembayaran secara instan.",
      color: "text-primary"
    },
    {
      icon: CreditCard,
      title: "Dapatkan Kode Otomatis",
      description: "Setelah pembayaran berhasil, kode voucher akan otomatis dikirimkan ke email atau WhatsApp kamu.",
      color: "text-primary"
    },
    {
      icon: CheckCircle2,
      title: "Redeem & Aktifasi",
      description: "Tukarkan kode voucher di halaman redeem dan nikmati layanan premium pilihanmu seketika.",
      color: "text-primary"
    }
  ]

  const ref = useScrollReveal()

  return (
    <section className="py-32 px-6 w-full flex justify-center bg-background overflow-hidden">
      <div ref={ref} className="w-full max-w-7xl">
        <div className="text-center mb-24">
          <h2 className="text-4xl md:text-6xl font-black text-foreground mb-6 tracking-tight reveal-hidden">
            Alur Kerja <span className="bg-clip-text text-transparent bg-gradient-to-br from-primary to-primary/80">Instan.</span>
          </h2>
          <p className="text-muted-foreground text-lg font-medium reveal-hidden delay-100">Hanya butuh 3 langkah sederhana untuk mendapatkan akses layanan premium favoritmu.</p>
        </div>

        <div className="relative flex flex-col md:flex-row justify-between items-center gap-12 md:gap-0">
          {/* Connector Line (Desktop) */}
          <div className="hidden md:block absolute top-[64px] left-[15%] right-[15%] h-0.5 bg-muted z-0" />

          {steps.map((step, index) => (
            <div
              key={index}
              className={`relative z-10 flex flex-col items-center text-center group md:w-1/3 reveal-hidden delay-${(index + 2) * 100}`}
            >
              <div className="relative mb-10 group-hover:-translate-y-4 transition-transform duration-500">
                <div className="w-32 h-32 mx-auto bg-background border-4 border-border/50 rounded-full shadow-xl shadow-primary/5 flex items-center justify-center relative">
                  <step.icon className={`size-12 ${step.color}`} />
                </div>
                <div className="absolute top-0 right-0 size-9 bg-primary text-white rounded-full flex items-center justify-center text-xs font-black shadow-lg">
                  {index + 1}
                </div>
              </div>

              <h3 className="text-2xl font-black text-foreground mb-4 tracking-tight group-hover:text-primary transition-colors">
                {step.title}
              </h3>
              <p className="text-muted-foreground leading-relaxed font-medium text-base max-w-[260px] mx-auto">
                {step.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
