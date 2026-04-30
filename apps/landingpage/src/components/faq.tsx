'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ChevronDown } from 'lucide-react'
import type { LandingFaqItem } from '@volvecapital/shared/types'
import { cn } from '@/lib/utils'

interface FaqProps {
  items: LandingFaqItem[]
}

const defaultFaqs: LandingFaqItem[] = [
  {
    id: '1',
    question: 'Bagaimana cara melakukan pembelian?',
    answer: 'Pilih paket yang Anda inginkan, masukkan detail yang diperlukan (Email/WA), lakukan pembayaran, dan voucher akan otomatis dikirimkan.'
  },
  {
    id: '2',
    question: 'Apakah produk yang dijual legal?',
    answer: 'Ya, semua produk yang kami sediakan adalah legal dan bergaransi resmi dari kami.'
  },
  {
    id: '3',
    question: 'Berapa lama proses pengiriman voucher?',
    answer: 'Sistem kami bekerja 24/7 secara otomatis. Voucher biasanya terkirim dalam hitungan detik setelah pembayaran terkonfirmasi.'
  }
]

export function Faq({ items }: FaqProps) {
  const [openId, setOpenId] = useState<string | null>(null)
  const displayFaqs = items.length > 0 ? items : defaultFaqs

  return (
    <section id="faq" className="py-24 px-6 relative overflow-hidden">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-5xl font-black text-white mb-4 tracking-tight">
            Pertanyaan <span className="text-primary">Populer.</span>
          </h2>
          <p className="text-gray-400 text-lg">
            Temukan jawaban untuk pertanyaan yang paling sering diajukan pelanggan kami.
          </p>
        </div>

        <div className="space-y-4">
          {displayFaqs.map((faq) => (
            <div 
              key={faq.id}
              className="border border-white/5 rounded-2xl bg-white/[0.02] overflow-hidden"
            >
              <button
                onClick={() => setOpenId(openId === faq.id ? null : faq.id)}
                className="w-full px-6 py-6 flex items-center justify-between text-left hover:bg-white/[0.04] transition-colors"
              >
                <span className="text-lg font-bold text-white">{faq.question}</span>
                <ChevronDown className={cn(
                  "size-5 text-primary transition-transform duration-300",
                  openId === faq.id && "rotate-180"
                )} />
              </button>
              
              <AnimatePresence>
                {openId === faq.id && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.3, ease: 'easeInOut' }}
                  >
                    <div className="px-6 pb-6 text-gray-400 leading-relaxed">
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
