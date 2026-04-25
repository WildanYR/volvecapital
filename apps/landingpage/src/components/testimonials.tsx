'use client'

import { motion } from 'framer-motion'
import { Star, Quote } from 'lucide-react'

const testimonials = [
  {
    name: "Andi Pratama",
    role: "Pecinta Film",
    content: "Sumpah cepet banget! Bayar pake QRIS, langsung dapet WA kode vouchernya. Netflix 4K nya jernih parah.",
    stars: 5,
    initial: "A"
  },
  {
    name: "Siska Amelia",
    role: "Mahasiswi",
    content: "Spotify Premium termurah yang pernah saya beli. Udah 3 bulan aman terus, gak pernah back to free. Trusted!",
    stars: 5,
    initial: "S"
  },
  {
    name: "Budi Raharjo",
    role: "Bapak Rumah Tangga",
    content: "Disney+ buat anak-anak jadi gampang belinya. Proses redeemnya simple banget buat saya yang gaptek.",
    stars: 5,
    initial: "B"
  },
  {
    name: "Rina Wijaya",
    role: "Freelancer",
    content: "Pelayanan mantap, adminnya responsif banget pas ditanya-tanya via WhatsApp. Sangat recommended buat yang cari akun legal.",
    stars: 5,
    initial: "R"
  }
]

export function Testimonials() {
  return (
    <section id="testimonials" className="py-32 px-6 w-full flex justify-center z-10">
      <div className="w-full max-w-7xl md:px-12">
        <div className="text-center mb-24">
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            className="text-primary font-black tracking-[0.3em] uppercase text-[10px] mb-4"
          >
            Review Pelanggan
          </motion.div>
          <h2 className="text-4xl md:text-6xl font-black mb-6 text-white tracking-tight">Suara <span className="text-primary">Komunitas Kami.</span></h2>
          <p className="text-gray-500 text-lg max-w-2xl mx-auto">Bergabunglah dengan ribuan pelanggan yang telah menikmati layanan premium kami.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {testimonials.map((t, idx) => (
            <motion.div
              key={idx}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.1 }}
              viewport={{ once: true }}
              className="glass-card p-10 rounded-[40px] border-white/5 relative group hover:border-primary/20 transition-all duration-500"
            >
              <div className="absolute top-10 right-10 opacity-5 group-hover:opacity-10 transition-opacity">
                <Quote className="size-16 text-primary" />
              </div>
              
              <div className="flex gap-1 mb-6">
                {[...Array(t.stars)].map((_, i) => (
                  <Star key={i} className="size-4 fill-primary text-primary" />
                ))}
              </div>

              <p className="text-gray-300 text-lg leading-relaxed italic mb-10 relative z-10 font-medium">
                "{t.content}"
              </p>

              <div className="flex items-center gap-5 mt-auto pt-8 border-t border-white/5">
                <div className="size-14 rounded-2xl bg-gradient-gold flex items-center justify-center font-black text-black text-xl shadow-lg">
                  {t.initial}
                </div>
                <div>
                  <h4 className="font-black text-white text-lg tracking-tight">{t.name}</h4>
                  <p className="text-[10px] text-gray-500 font-black uppercase tracking-[0.2em]">{t.role}</p>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}
