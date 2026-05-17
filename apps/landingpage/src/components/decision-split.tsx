'use client'

import { Key, ShoppingCart, ArrowRight } from 'lucide-react'
import Link from 'next/link'
import { useScrollReveal } from '@/hooks/use-scroll-reveal'

export function DecisionSplit() {
  const ref = useScrollReveal()

  return (
    <section className="py-24 bg-muted/50 relative z-10">
      <div ref={ref} className="max-w-7xl mx-auto px-6">
        {/* Header Section */}
        <div className="text-center mb-16">
          <p className="text-[10px] font-black tracking-[0.4em] text-slate-400 uppercase mb-4 reveal-hidden">
            Pilih Langkahmu
          </p>
          <h2 className="text-3xl md:text-5xl font-black text-foreground tracking-tight reveal-hidden delay-100">
            Apa yang Anda butuhkan saat ini?
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-5xl mx-auto">
          {/* Card 1: Redeem */}
          <div
            className="group p-10 md:p-14 bg-background rounded-3xl border border-border shadow-xl hover:shadow-2xl hover:border-primary/30 hover:-translate-y-4 transition-all duration-500 flex flex-col items-center text-center relative overflow-hidden"
            style={{ willChange: 'transform' }}
          >
            <div className="size-20 bg-primary/10 rounded-3xl flex items-center justify-center mb-10 group-hover:scale-110 group-hover:bg-primary/20 transition-all duration-500">
              <Key className="size-10 text-primary" />
            </div>
            <h3 className="text-3xl md:text-4xl font-black text-foreground group-hover:text-primary mb-6 tracking-tight transition-colors duration-300">
              Sudah Punya Kode?
            </h3>
            <p className="text-muted-foreground text-lg font-medium leading-relaxed mb-10 max-w-sm">
              Langsung tukarkan kode voucher Anda sekarang dan nikmati layanan premium seketika tanpa menunggu.
            </p>
            <Link
              href="/redeem"
              className="w-full py-5 bg-primary text-white font-black rounded-2xl flex items-center justify-center gap-3 hover:bg-slate-800 hover:scale-105 transition-all shadow-xl group-hover:shadow-primary/20 active:scale-95"
            >
              TUKARKAN KODE <ArrowRight className="size-5" />
            </Link>
          </div>

          {/* Card 2: Buy */}
          <div
            className="group p-10 md:p-14 bg-background rounded-3xl border border-border shadow-xl hover:shadow-2xl hover:border-primary/30 hover:-translate-y-4 transition-all duration-500 flex flex-col items-center text-center relative overflow-hidden"
            style={{ willChange: 'transform' }}
          >
            <div className="size-20 bg-primary/10 rounded-3xl flex items-center justify-center mb-10 group-hover:scale-110 group-hover:bg-primary/20 transition-all duration-500">
              <ShoppingCart className="size-10 text-primary" />
            </div>
            <h3 className="text-3xl md:text-4xl font-black text-foreground group-hover:text-primary mb-6 tracking-tight transition-colors duration-300">
              Ingin Berlangganan?
            </h3>
            <p className="text-muted-foreground text-lg font-medium leading-relaxed mb-10 max-w-sm">
              Pilih paket layanan favorit Anda dan dapatkan akses premium dengan harga terbaik sekarang juga.
            </p>
            <Link
              href="/product"
              className="w-full py-5 bg-gradient-to-br from-primary to-primary/80 text-white font-black rounded-2xl flex items-center justify-center gap-3 hover:scale-105 transition-all shadow-xl shadow-primary/20 active:scale-95"
            >
              BELI VOUCHER <ArrowRight className="size-5" />
            </Link>
          </div>
        </div>
      </div>
    </section>
  )
}
