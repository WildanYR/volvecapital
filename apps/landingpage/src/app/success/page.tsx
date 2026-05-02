'use client'

import { useSearchParams } from 'next/navigation'
import { motion } from 'framer-motion'
import { CheckCircle2, Copy, Home, MessageSquare, ArrowRight, Sparkles, Loader2 } from 'lucide-react'
import Link from 'next/link'
import { toast } from 'sonner'
import { Suspense, useState, useEffect } from 'react'
import { Navbar } from '@/components/navbar'
import { Footer } from '@/components/footer'
import { api } from '@/lib/api'
import { AlertCircle } from 'lucide-react'

function SuccessContent() {
  const searchParams = useSearchParams()
  const [code, setCode] = useState<string | null>(searchParams.get('voucher') || searchParams.get('code'))
  const orderId = searchParams.get('order_id')
  const [voucherData, setVoucherData] = useState<any>(null)
  const [isChecking, setIsChecking] = useState(false)

  // Polling for payment status if only orderId is present
  useEffect(() => {
    if (orderId && !code) {
      setIsChecking(true)
      const interval = setInterval(async () => {
        try {
          const res = await api.get(`/public/payment/status/${orderId}`)
          if (res.data.payment_status === 'PAID') {
            setCode(res.data.voucher_code)
            setIsChecking(false)
            clearInterval(interval)
            toast.success('Pembayaran terkonfirmasi!')
          }
        } catch (err) {
          console.error('Gagal mengecek status pembayaran:', err)
        }
      }, 3000)

      return () => clearInterval(interval)
    }
  }, [orderId, code])

  // Fetch voucher details once code is available
  useEffect(() => {
    if (code) {
      api.get(`/public/voucher/${code}`)
        .then(res => setVoucherData(res.data.voucher))
        .catch(err => console.error('Gagal mengambil data voucher:', err))
    }
  }, [code])

  const copyCode = () => {
    if (code) {
      navigator.clipboard.writeText(code)
      toast.success('Kode voucher disalin!')
    }
  }

  return (
    <main className="min-h-screen flex flex-col pt-32 pb-40 bg-slate-50">
      <Navbar />
      
      <div className="container mx-auto max-w-2xl px-6 flex-grow flex flex-col justify-center">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white p-10 md:p-14 text-center rounded-[48px] border border-slate-100 shadow-2xl relative overflow-hidden"
        >
          {/* Subtle Accent */}
          <div className="absolute top-0 right-0 w-32 h-32 bg-orange-50/50 blur-[60px] rounded-full -translate-y-1/2 translate-x-1/2" />
          
          <div className="inline-flex p-6 bg-emerald-50 rounded-full mb-8 relative">
            <CheckCircle2 className="size-16 text-emerald-500" />
            <Sparkles className="absolute -top-1 -right-1 size-8 text-[#f97316] animate-pulse" />
          </div>
          
          <h1 className="text-4xl md:text-5xl font-black mb-6 text-[#0f172a] tracking-tight uppercase">Pembayaran Berhasil!</h1>
          <p className="text-slate-500 mb-12 leading-relaxed font-medium text-lg">
            Pesanan Anda telah kami terima. Gunakan kode voucher di bawah ini untuk mengaktifkan layanan premium Anda sekarang juga.
          </p>

          <div className="bg-slate-50 border border-slate-100 rounded-[32px] p-10 mb-12 relative group shadow-inner">
            <p className="text-[10px] uppercase tracking-[0.3em] text-slate-400 font-black mb-4">Kode Voucher Eksklusif Anda</p>
            <div className="flex flex-col md:flex-row items-center justify-center gap-6">
              <span className="text-4xl md:text-6xl font-black text-[#0f172a] tracking-tight">
                {code || (isChecking ? 'MENGECEK...' : 'VC-XXXXXXXX')}
              </span>
              <button 
                onClick={copyCode}
                className="p-5 bg-white hover:bg-slate-50 text-[#f97316] rounded-2xl transition-all duration-300 border border-slate-200 shadow-sm active:scale-95"
              >
                <Copy className="size-6" />
              </button>
            </div>
          </div>

          {voucherData?.expired_at && (
            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-12 p-6 bg-red-50 border border-red-100 rounded-[32px] flex items-center gap-4 text-left"
            >
              <div className="p-3 bg-white rounded-2xl shadow-sm">
                <AlertCircle className="size-6 text-red-500" />
              </div>
              <div>
                <p className="text-xs font-black text-red-500 uppercase tracking-widest mb-0.5">Peringatan Penting</p>
                <p className="text-sm text-slate-600 font-bold">
                  Segera klaim voucher Anda sebelum <span className="text-red-600 font-black">{new Date(voucherData.expired_at).toLocaleString('id-ID', { dateStyle: 'long', timeStyle: 'short' })}</span> agar tidak hangus.
                </p>
              </div>
            </motion.div>
          )}

          <div className="flex flex-col gap-4">
            <Link 
              href="/redeem"
              className="w-full bg-gradient-to-br from-[#f97316] to-[#ef4444] text-white font-black py-5 rounded-2xl flex items-center justify-center gap-3 hover:scale-[1.02] active:scale-95 transition-all uppercase tracking-widest text-sm"
            >
              Aktivasi Voucher Sekarang
              <ArrowRight className="size-5" />
            </Link>
            <Link 
              href="/"
              className="w-full py-5 bg-slate-50 text-[#0f172a] font-black rounded-2xl flex items-center justify-center gap-3 hover:bg-slate-100 hover:text-[#f97316] transition-all uppercase tracking-widest text-xs"
            >
              <Home className="size-4" />
              Kembali ke Beranda
            </Link>
          </div>

          <div className="mt-12 pt-8 border-t border-slate-100 flex items-center justify-center gap-3 text-[10px] text-slate-400 font-black uppercase tracking-widest">
            <MessageSquare className="size-4 text-[#f97316]" />
            Butuh bantuan? Hubungi <Link href="https://wa.me/628123456789" className="text-[#f97316] hover:underline">Support WhatsApp</Link>
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
