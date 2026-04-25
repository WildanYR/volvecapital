'use client'

import { motion } from 'framer-motion'
import { Search, CreditCard, CheckCircle2 } from 'lucide-react'

export function Steps() {
  const steps = [
    {
      icon: Search,
      title: "Pilih Variant & Bayar",
      description: "Pilih layanan premium yang kamu butuhkan dan selesaikan pembayaran secara instan.",
      color: "text-blue-500",
      bg: "bg-blue-500/10"
    },
    {
      icon: CreditCard,
      title: "Dapatkan Kode Otomatis",
      description: "Setelah pembayaran berhasil, kode voucher akan otomatis dikirimkan ke email atau WhatsApp kamu.",
      color: "text-primary",
      bg: "bg-primary/10"
    },
    {
      icon: CheckCircle2,
      title: "Redeem & Aktifasi",
      description: "Tukarkan kode voucher di halaman redeem dan nikmati layanan premium pilihanmu seketika.",
      color: "text-green-500",
      bg: "bg-green-500/10"
    }
  ]

  return (
    <section className="py-24 px-6 w-full flex justify-center z-10">
      <div className="w-full max-w-7xl md:px-12">
        <div className="text-center mb-20">
          <motion.h2 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-4xl md:text-6xl font-black text-white mb-6 tracking-tight"
          >
            Alur Kerja <span className="text-primary">Instan.</span>
          </motion.h2>
          <p className="text-gray-400 text-lg max-w-2xl mx-auto">
            Hanya butuh 3 langkah sederhana untuk mendapatkan akses layanan premium favoritmu.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
          {steps.map((step, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.2 }}
              className="relative flex flex-col items-center text-center group"
            >
              {/* Connector Line (Desktop) */}
              {index < 2 && (
                <div className="hidden md:block absolute top-12 left-1/2 w-full h-[2px] bg-white/5 z-0" />
              )}
              
              <div className={`${step.bg} p-6 rounded-[32px] relative z-10 mb-8 border border-white/5 group-hover:scale-110 transition-transform duration-500 shadow-xl`}>
                <step.icon className={`size-10 ${step.color}`} />
                <div className="absolute -top-3 -right-3 bg-white/10 backdrop-blur-md size-8 rounded-full flex items-center justify-center text-xs font-black text-white border border-white/20">
                  {index + 1}
                </div>
              </div>
              
              <h3 className="text-2xl font-black text-white mb-4">{step.title}</h3>
              <p className="text-gray-500 leading-relaxed max-w-[280px]">
                {step.description}
              </p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}
