'use client'

import { motion } from 'framer-motion'
import { Key, ShoppingCart, ArrowRight } from 'lucide-react'
import Link from 'next/link'

export function DecisionSplit() {
  return (
    <section className="py-24 px-6 w-full flex justify-center z-10 overflow-hidden">
      <div className="w-full max-w-7xl md:px-12">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Left: Already have code */}
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            whileHover={{ y: -5 }}
            className="group relative"
          >
            <div className="absolute inset-0 bg-gradient-to-br from-green-500/10 to-transparent blur-3xl group-hover:from-green-500/20 transition-all duration-500" />
            <div className="relative glass-card rounded-[40px] p-10 md:p-14 border-white/5 group-hover:border-green-500/30 transition-all duration-500">
              <div className="bg-green-500/10 p-4 rounded-2xl w-fit mb-8 group-hover:scale-110 transition-transform duration-500">
                <Key className="size-8 text-green-500" />
              </div>
              <h3 className="text-3xl md:text-4xl font-black text-white mb-4">Sudah Punya Kode?</h3>
              <p className="text-gray-400 text-lg mb-10 leading-relaxed">
                Tukarkan kode voucher Anda sekarang dan nikmati layanan premium seketika tanpa menunggu.
              </p>
              <Link 
                href="/redeem"
                className="inline-flex items-center gap-3 text-green-500 font-black uppercase tracking-widest group/btn"
              >
                Redeem Now
                <ArrowRight className="size-5 group-hover/btn:translate-x-2 transition-transform" />
              </Link>
            </div>
          </motion.div>

          {/* Right: Don't have code */}
          <motion.div
            initial={{ opacity: 0, x: 30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            whileHover={{ y: -5 }}
            className="group relative"
          >
            <div className="absolute inset-0 bg-gradient-to-br from-primary/10 to-transparent blur-3xl group-hover:from-primary/20 transition-all duration-500" />
            <div className="relative glass-card rounded-[40px] p-10 md:p-14 border-white/5 group-hover:border-primary/30 transition-all duration-500">
              <div className="bg-primary/10 p-4 rounded-2xl w-fit mb-8 group-hover:scale-110 transition-transform duration-500">
                <ShoppingCart className="size-8 text-primary" />
              </div>
              <h3 className="text-3xl md:text-4xl font-black text-white mb-4">Belum Punya Kode?</h3>
              <p className="text-gray-400 text-lg mb-10 leading-relaxed">
                Temukan berbagai pilihan layanan premium terbaik dengan harga yang sangat terjangkau.
              </p>
              <Link 
                href="/product"
                className="inline-flex items-center gap-3 text-primary font-black uppercase tracking-widest group/btn"
              >
                Buy Now
                <ArrowRight className="size-5 group-hover/btn:translate-x-2 transition-transform" />
              </Link>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  )
}
