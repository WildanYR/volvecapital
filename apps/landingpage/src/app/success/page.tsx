'use client'

import { useSearchParams } from 'next/navigation'
import { motion } from 'framer-motion'
import { CheckCircle2, Copy, Home, MessageSquare, ArrowRight, Sparkles, Loader2 } from 'lucide-react'
import Link from 'next/link'
import { toast } from 'sonner'
import { Suspense } from 'react'
import { Navbar } from '@/components/navbar'
import { Footer } from '@/components/footer'

function SuccessContent() {
  const searchParams = useSearchParams()
  const code = searchParams.get('voucher') || searchParams.get('code')

  const copyCode = () => {
    if (code) {
      navigator.clipboard.writeText(code)
      toast.success('Kode voucher disalin!')
    }
  }

  return (
    <main className="min-h-screen flex flex-col pt-32 pb-20">
      <Navbar />
      
      <div className="container mx-auto max-w-2xl px-6 flex-grow flex flex-col justify-center">
        <motion.div 
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="glass-card p-10 md:p-14 text-center rounded-[48px] border-white/5 relative overflow-hidden"
        >
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-gold" />
          
          <div className="inline-flex p-5 bg-green-500/10 rounded-full mb-8 relative">
            <CheckCircle2 className="size-14 text-green-500" />
            <Sparkles className="absolute -top-1 -right-1 size-6 text-primary animate-pulse" />
          </div>
          
          <h1 className="text-4xl md:text-5xl font-black mb-6 text-white tracking-tight uppercase">Pembayaran Berhasil!</h1>
          <p className="text-gray-400 mb-12 leading-relaxed font-medium">
            Pesanan Anda telah kami terima. Gunakan kode voucher di bawah ini untuk mengaktifkan layanan premium Anda sekarang juga.
          </p>

          <div className="bg-white/[0.03] border border-white/10 rounded-[32px] p-10 mb-12 relative group shadow-inner">
            <p className="text-[10px] uppercase tracking-[0.3em] text-gray-500 font-black mb-4">Kode Voucher Eksklusif Anda</p>
            <div className="flex flex-col md:flex-row items-center justify-center gap-6">
              <span className="text-4xl md:text-6xl font-black text-primary tracking-tightest">
                {code || 'VC-XXXXXXXX'}
              </span>
              <button 
                onClick={copyCode}
                className="p-4 bg-primary/10 hover:bg-primary hover:text-black rounded-2xl transition-all duration-300 text-primary border border-primary/20"
              >
                <Copy className="size-6" />
              </button>
            </div>
          </div>

          <div className="flex flex-col gap-4">
            <Link 
              href="/redeem"
              className="w-full bg-gradient-gold text-black font-black py-5 rounded-2xl flex items-center justify-center gap-3 hover:scale-[1.02] active:scale-95 transition-all shadow-xl uppercase tracking-widest text-sm"
            >
              Aktivasi Voucher Sekarang
              <ArrowRight className="size-5" />
            </Link>
            <Link 
              href="/"
              className="w-full py-5 glass border-white/10 text-white font-black rounded-2xl flex items-center justify-center gap-3 hover:bg-white/5 transition-all uppercase tracking-widest text-xs"
            >
              <Home className="size-4" />
              Kembali ke Beranda
            </Link>
          </div>

          <div className="mt-12 pt-8 border-t border-white/5 flex items-center justify-center gap-3 text-[10px] text-gray-600 font-black uppercase tracking-widest">
            <MessageSquare className="size-4 text-primary" />
            Butuh bantuan? Hubungi <Link href="#" className="text-primary hover:underline">Support WhatsApp</Link>
          </div>
        </motion.div>
      </div>

      <Footer />
    </main>
  )
}

export default function SuccessPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="size-12 text-primary animate-spin" />
      </div>
    }>
      <SuccessContent />
    </Suspense>
  )
}
