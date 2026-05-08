'use client'

import { useState, useRef } from 'react'
import { Plus, Minus, HelpCircle } from 'lucide-react'
import type { LandingFaqConfig } from '@volvecapital/shared/types'
import { useScrollReveal } from '@/hooks/use-scroll-reveal'

interface FaqProps {
  config?: LandingFaqConfig | null
}

// Pure CSS accordion item — no Framer Motion, uses CSS max-height transition
function FaqItem({ question, answer, isOpen, onToggle }: {
  question: string
  answer: string
  isOpen: boolean
  onToggle: () => void
}) {
  const contentRef = useRef<HTMLDivElement>(null)

  return (
    <div
      className={`rounded-[32px] border transition-all duration-300 overflow-hidden ${
        isOpen ? 'border-orange-200 bg-orange-50/30' : 'border-slate-100 bg-white'
      }`}
    >
      <button
        onClick={onToggle}
        className="w-full px-8 py-6 flex items-center justify-between text-left group"
      >
        <span className={`text-lg font-black transition-colors ${
          isOpen ? 'text-[#f97316]' : 'text-[#0f172a] group-hover:text-[#f97316]'
        }`}>
          {question}
        </span>
        <div className={`p-2 rounded-xl transition-all flex-shrink-0 ${
          isOpen ? 'bg-[#f97316] text-white' : 'bg-slate-50 text-[#0f172a]'
        }`}>
          {isOpen ? <Minus className="size-5" /> : <Plus className="size-5" />}
        </div>
      </button>

      {/* CSS-only accordion — no Framer Motion */}
      <div
        ref={contentRef}
        style={{
          maxHeight: isOpen ? `${contentRef.current?.scrollHeight || 500}px` : '0px',
          opacity: isOpen ? 1 : 0,
          transition: 'max-height 0.35s ease, opacity 0.25s ease',
          overflow: 'hidden',
        }}
      >
        <div className="px-8 pb-8 text-slate-600 font-medium leading-relaxed">
          {answer}
        </div>
      </div>
    </div>
  )
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

  const ref = useScrollReveal()

  return (
    <section className="py-32 px-6 w-full flex justify-center bg-white">
      <div ref={ref} className="w-full max-w-4xl">
        <div className="text-center mb-20">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-orange-50 border border-orange-100 mb-6 shadow-sm reveal-hidden">
            <HelpCircle className="size-4 text-[#f97316]" />
            <span className="text-[10px] font-black tracking-widest uppercase text-[#f97316]">Pusat Bantuan</span>
          </div>
          <h2 className="text-4xl md:text-5xl font-black text-[#0f172a] mb-6 reveal-hidden delay-100">
            {sectionTitle}
          </h2>
          <p className="text-slate-500 text-lg font-medium reveal-hidden delay-200">Temukan jawaban untuk pertanyaan yang paling sering diajukan pelanggan kami.</p>
        </div>

        <div className="space-y-4">
          {items.map((faq, index) => (
            <div key={index} className={`reveal-hidden delay-${((index % 5) + 3) * 100}`}>
              <FaqItem
                question={faq.question}
                answer={faq.answer}
                isOpen={openIndex === index}
                onToggle={() => setOpenIndex(openIndex === index ? null : index)}
              />
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
