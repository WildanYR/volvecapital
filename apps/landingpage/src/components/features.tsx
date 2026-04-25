'use client'

import { motion } from 'framer-motion'
import { UserMinus, Zap, Clock, MessageCircle, ShieldCheck, CreditCard } from 'lucide-react'

export function Features() {
  const features = [
    {
      icon: UserMinus,
      title: "Tanpa Login",
      description: "Beli voucher tanpa perlu membuat akun. Cukup masukkan email/WA."
    },
    {
      icon: Zap,
      title: "Proses Instan",
      description: "Voucher otomatis terkirim sesaat setelah pembayaran terkonfirmasi."
    },
    {
      icon: CreditCard,
      title: "Pembayaran Lengkap",
      description: "Mendukung QRIS, Virtual Account, dan berbagai metode lainnya."
    },
    {
      icon: Clock,
      title: "Aktif 24/7",
      description: "Sistem kami bekerja otomatis setiap saat, bahkan di hari libur."
    },
    {
      icon: MessageCircle,
      title: "Support WhatsApp",
      description: "Tim bantuan kami siap membantu jika Anda mengalami kendala."
    },
    {
      icon: ShieldCheck,
      title: "Legal & Bergaransi",
      description: "Semua produk adalah legal dan kami memberikan garansi penuh."
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
            className="text-4xl md:text-5xl font-black text-white mb-6"
          >
            Kenapa Memilih <span className="text-primary">Volve Capital?</span>
          </motion.h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map((feature, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, scale: 0.95 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1 }}
              className="p-8 rounded-[32px] glass-card border-white/5 hover:border-primary/20 transition-all duration-500 group"
            >
              <div className="bg-primary/10 p-4 rounded-2xl w-fit mb-6 group-hover:bg-primary group-hover:text-black transition-all duration-500 text-primary">
                <feature.icon className="size-6" />
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
