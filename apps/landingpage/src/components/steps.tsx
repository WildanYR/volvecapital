'use client'

import { motion } from 'framer-motion'
import { Search, CreditCard, CheckCircle2 } from 'lucide-react'

export function Steps() {
  const steps = [
    {
      icon: Search,
      title: "Pilih Variant & Bayar",
      description: "Pilih layanan premium yang kamu butuhkan dan selesaikan pembayaran secara instan.",
      color: "text-blue-500"
    },
    {
      icon: CreditCard,
      title: "Dapatkan Kode Otomatis",
      description: "Setelah pembayaran berhasil, kode voucher akan otomatis dikirimkan ke email atau WhatsApp kamu.",
      color: "text-[#f97316]"
    },
    {
      icon: CheckCircle2,
      title: "Redeem & Aktifasi",
      description: "Tukarkan kode voucher di halaman redeem dan nikmati layanan premium pilihanmu seketika.",
      color: "text-emerald-500"
    }
  ]

  return (
    <section className="py-32 px-6 w-full flex justify-center bg-white overflow-hidden">
      <div className="w-full max-w-7xl">
        <div className="text-center mb-24">
          <h2 className="text-4xl md:text-6xl font-black text-[#0f172a] mb-6 tracking-tight">
            Alur Kerja <span className="bg-clip-text text-transparent bg-gradient-to-br from-[#f97316] to-[#ef4444]">Instan.</span>
          </h2>
          <p className="text-slate-500 text-lg font-medium">Hanya butuh 3 langkah sederhana untuk mendapatkan akses layanan premium favoritmu.</p>
        </div>

        <div className="relative flex flex-col md:flex-row justify-between items-center gap-12 md:gap-0">
          {/* Connector Line (Desktop) */}
          <div className="hidden md:block absolute top-[64px] left-[15%] right-[15%] h-0.5 bg-slate-100 z-0" />

          {steps.map((step, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1 }}
              className="relative z-10 flex flex-col items-center text-center group md:w-1/3"
            >
              {/* Wrapped Icon & Number together for synced animation */}
              <div className="relative mb-10 group-hover:-translate-y-4 transition-transform duration-500">
                <div className="w-32 h-32 mx-auto bg-white border-4 border-slate-50 rounded-full shadow-xl shadow-slate-200/50 flex items-center justify-center relative">
                  <step.icon className={`size-12 ${step.color}`} />
                </div>
                {/* Large Number Badge - Now synced with parent animation */}
                <div className="absolute top-0 right-0 size-9 bg-[#0f172a] text-white rounded-full flex items-center justify-center text-xs font-black shadow-lg">
                  {index + 1}
                </div>
              </div>

              <h3 className="text-2xl font-black text-[#0f172a] mb-4 tracking-tight group-hover:text-[#f97316] transition-colors">
                {step.title}
              </h3>
              <p className="text-slate-500 leading-relaxed font-medium text-base max-w-[260px] mx-auto">
                {step.description}
              </p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}
