'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Plus, Minus, HelpCircle } from 'lucide-react'

import type { LandingFaqConfig } from '@volvecapital/shared/types'

interface FaqProps {
  config?: LandingFaqConfig | null
}

export function Faq({ config }: FaqProps) {
  const [openIndex, setOpenIndex] = useState<number | null>(0)

  const defaultFaqs = [
    {
      question: "Bagaimana cara membeli voucher?",
      answer: "Pilih layanan yang Anda inginkan di halaman Produk, pilih paket, isi data diri (Email/WA), selesaikan pembayaran melalui QRIS atau VA, dan voucher akan otomatis terkirim."
    },
    {
      question: "Berapa lama proses pengiriman voucher?",
      answer: "Sistem kami bekerja secara 24/7 secara otomatis. Voucher biasanya terkirim dalam hitungan detik setelah pembayaran terkonfirmasi."
    },
    {
      question: "Apakah layanan ini legal dan bergaransi?",
      answer: "Ya, semua produk yang kami sediakan adalah legal dan kami memberikan garansi penuh sesuai dengan durasi paket yang Anda beli."
    }
  ]

  const items = config?.items && config.items.length > 0 ? config.items : defaultFaqs
  const sectionTitle = config?.sectionTitle || "Pertanyaan Umum (FAQ)"

  return (
    <section className="py-32 px-6 w-full flex justify-center bg-white">
      <div className="w-full max-w-4xl">
        <div className="text-center mb-20">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            whileInView={{ opacity: 1, scale: 1 }}
            className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-orange-50 border border-orange-100 mb-6 shadow-sm"
          >
            <HelpCircle className="size-4 text-[#f97316]" />
            <span className="text-[10px] font-black tracking-widest uppercase text-[#f97316]">Pusat Bantuan</span>
          </motion.div>
          <h2 className="text-4xl md:text-5xl font-black text-[#0f172a] mb-6">
            {sectionTitle}
          </h2>
          <p className="text-slate-500 text-lg font-medium">Temukan jawaban untuk pertanyaan yang paling sering diajukan pelanggan kami.</p>
        </div>

        <div className="space-y-4">
          {items.map((faq, index) => (
            <div 
              key={index}
              className={`rounded-[32px] border transition-all duration-300 overflow-hidden ${
                openIndex === index ? 'border-orange-200 bg-orange-50/30' : 'border-slate-100 bg-white'
              }`}
            >
              <button
                onClick={() => setOpenIndex(openIndex === index ? null : index)}
                className="w-full px-8 py-6 flex items-center justify-between text-left group"
              >
                <span className={`text-lg font-black transition-colors ${
                  openIndex === index ? 'text-[#f97316]' : 'text-[#0f172a] group-hover:text-[#f97316]'
                }`}>
                  {faq.question}
                </span>
                <div className={`p-2 rounded-xl transition-all ${
                  openIndex === index ? 'bg-[#f97316] text-white rotate-180' : 'bg-slate-50 text-[#0f172a]'
                }`}>
                  {openIndex === index ? <Minus className="size-5" /> : <Plus className="size-5" />}
                </div>
              </button>
              
              <AnimatePresence>
                {openIndex === index && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.3 }}
                  >
                    <div className="px-8 pb-8 text-slate-600 font-medium leading-relaxed">
                      {faq.answer}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
