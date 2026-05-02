'use client'

import { motion } from 'framer-motion'
import { Key, ShoppingCart, ArrowRight } from 'lucide-react'
import Link from 'next/link'

export function DecisionSplit() {
  return (
    <section className="py-24 bg-slate-50 relative z-10">
      <div className="max-w-7xl mx-auto px-6">
        {/* Header Section */}
        <div className="text-center mb-16">
          <motion.p
            initial={{ opacity: 0, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-[10px] font-black tracking-[0.4em] text-slate-400 uppercase mb-4"
          >
            Pilih Langkahmu
          </motion.p>
          <motion.h2
            initial={{ opacity: 0, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            viewport={{ once: true }}
            className="text-3xl md:text-5xl font-black text-[#0f172a] tracking-tight"
          >
            Apa yang Anda butuhkan saat ini?
          </motion.h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-5xl mx-auto">
          {/* Card 1: Redeem */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            className="group p-10 md:p-14 bg-white rounded-[48px] border border-slate-100 shadow-xl hover:shadow-2xl hover:border-orange-200 hover:-translate-y-4 transition-all duration-500 flex flex-col items-center text-center relative overflow-hidden"
          >
            <div className="size-20 bg-orange-50 rounded-3xl flex items-center justify-center mb-10 group-hover:scale-110 group-hover:bg-orange-100 transition-all duration-500">
              <Key className="size-10 text-[#f97316]" />
            </div>
            <h3 className="text-3xl md:text-4xl font-black text-[#0f172a] group-hover:text-[#f97316] mb-6 tracking-tight transition-colors duration-300">
              Sudah Punya Kode?
            </h3>
            <p className="text-slate-500 text-lg font-medium leading-relaxed mb-10 max-w-sm">
              Langsung tukarkan kode voucher Anda sekarang dan nikmati layanan premium seketika tanpa menunggu.
            </p>
            <Link 
              href="/redeem"
              className="w-full py-5 bg-[#0f172a] text-white font-black rounded-2xl flex items-center justify-center gap-3 hover:bg-slate-800 transition-all shadow-xl group-hover:shadow-orange-500/10 active:scale-95"
            >
              TUKARKAN KODE <ArrowRight className="size-5" />
            </Link>
          </motion.div>

          {/* Card 2: Buy */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            className="group p-10 md:p-14 bg-white rounded-[48px] border border-slate-100 shadow-xl hover:shadow-2xl hover:border-orange-200 hover:-translate-y-4 transition-all duration-500 flex flex-col items-center text-center relative overflow-hidden"
          >
            <div className="size-20 bg-orange-50 rounded-3xl flex items-center justify-center mb-10 group-hover:scale-110 group-hover:bg-orange-100 transition-all duration-500">
              <ShoppingCart className="size-10 text-[#f97316]" />
            </div>
            <h3 className="text-3xl md:text-4xl font-black text-[#0f172a] group-hover:text-[#f97316] mb-6 tracking-tight transition-colors duration-300">
              Ingin Berlangganan?
            </h3>
            <p className="text-slate-500 text-lg font-medium leading-relaxed mb-10 max-w-sm">
              Pilih paket layanan favorit Anda dan dapatkan akses premium dengan harga terbaik sekarang juga.
            </p>
            <Link 
              href="/product"
              className="w-full py-5 bg-gradient-to-br from-[#f97316] to-[#ef4444] text-white font-black rounded-2xl flex items-center justify-center gap-3 hover:scale-105 transition-all shadow-xl shadow-orange-500/20 active:scale-95"
            >
              BELI VOUCHER <ArrowRight className="size-5" />
            </Link>
          </motion.div>
        </div>
      </div>
    </section>
  )
}
