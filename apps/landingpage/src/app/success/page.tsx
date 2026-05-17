'use client'

import { useSearchParams } from 'next/navigation'
import { motion } from 'framer-motion'
import { CheckCircle2, Copy, Home, MessageSquare, ArrowRight, Sparkles, Loader2, Zap } from 'lucide-react'
import Link from 'next/link'
import { toast } from 'sonner'
import { Suspense, useState, useEffect } from 'react'
import { Navbar } from '@/components/navbar'
import { Footer } from '@/components/footer'
import { api } from '@/lib/api'
import { AlertCircle } from 'lucide-react'
import { useNotification } from '@/hooks/use-notification'

function SuccessContent() {
  const searchParams = useSearchParams()
  const [code, setCode] = useState<string | null>(searchParams.get('voucher') || searchParams.get('code'))
  const orderId = searchParams.get('order_id')
  const [voucherData, setVoucherData] = useState<any>(null)
  const [isChecking, setIsChecking] = useState(false)
  const [isClaiming, setIsClaiming] = useState(false)
  const { addNotification, removePendingByOrderId, markVoucherAsClaimed } = useNotification()

  // Polling for payment status if only orderId is present
  useEffect(() => {
    if (orderId && !code) {
      setIsChecking(true)

      // Check immediately on mount first
      const checkStatus = async () => {
        try {
          const res = await api.get(`/public/payment/status/${orderId}`)
          if (res.data.payment_status === 'PAID') {
            setCode(res.data.voucher_code)
            setIsChecking(false)
            return true
          }
        } catch (err) {
          console.error('Gagal mengecek status pembayaran:', err)
        }
        return false
      }

      let interval: NodeJS.Timeout

      checkStatus().then((done) => {
        if (!done) {
          // If not confirmed yet, poll every 1 second
          interval = setInterval(async () => {
            const confirmed = await checkStatus()
            if (confirmed) {
              clearInterval(interval)
              toast.success('Pembayaran terkonfirmasi!')
            }
          }, 1000)
        }
      })

      return () => clearInterval(interval)
    }
  }, [orderId, code])

  // Fetch voucher details once code is available
  useEffect(() => {
    if (code) {
      api.get(`/public/voucher/${code}`)
        .then(res => {
          const voucher = res.data.voucher
          setVoucherData(voucher)
          
          // 1. Bersihkan dulu notifikasi pending yang berkaitan
          if (orderId) {
            removePendingByOrderId(orderId);
          }

          const productName = voucher.product_variant ? `${voucher.product_variant.product?.name || 'Produk'} - ${voucher.product_variant.name}` : 'Produk';
          
          // 2. Tambahkan notifikasi sukses
          addNotification({
            type: 'success',
            title: 'Pembayaran Berhasil!',
            message: `Voucher untuk ${productName} siap digunakan.`,
            data: {
              orderId: orderId || undefined,
              productName: productName,
              voucherCode: code,
              price: voucher.price
            }
          });
        })
        .catch(err => console.error('Gagal mengambil data voucher:', err))
    }
  }, [code, orderId])

  const copyCode = () => {
    if (code) {
      navigator.clipboard.writeText(code)
      toast.success('Kode voucher disalin!')
    }
  }

  const handleClaim = async () => {
    if (!code) return
    setIsClaiming(true)
    try {
      await api.post('/public/voucher/redeem', { voucher_code: code })
      markVoucherAsClaimed(code)
      toast.success('Voucher berhasil diklaim! Mengalihkan ke halaman akun...')
      // Refresh voucher data to get access_token, then redirect
      const res = await api.get(`/public/voucher/${code}`)
      const accessToken = res.data?.voucher?.access_token
      if (accessToken) {
        window.location.href = `/redeem?code=${code}`
      } else {
        window.location.href = `/redeem?code=${code}`
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Gagal mengklaim voucher. Coba gunakan halaman Redeem.')
      setIsClaiming(false)
    }
  }

  return (
    <main className="min-h-screen flex flex-col pt-32 bg-muted/50">
      <Navbar />
      
      <div className="container mx-auto max-w-2xl px-6 flex-grow flex flex-col justify-center mb-32">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-background p-10 md:p-14 text-center rounded-[48px] border border-border shadow-2xl relative overflow-hidden"
        >
          {/* Subtle Accent */}
          <div className="absolute top-0 right-0 w-32 h-32 bg-primary/10/50 blur-[60px] rounded-full -translate-y-1/2 translate-x-1/2" />
          
          <div className="inline-flex p-6 bg-primary/10 rounded-full mb-8 relative">
            <CheckCircle2 className="size-16 text-primary" />
            <Sparkles className="absolute -top-1 -right-1 size-8 text-primary animate-pulse" />
          </div>
          
          <h1 className="text-4xl md:text-5xl font-black mb-6 text-foreground tracking-tight uppercase">Pembayaran Berhasil!</h1>
          <p className="text-muted-foreground mb-12 leading-relaxed font-medium text-lg">
            Pesanan Anda telah kami terima. Gunakan kode voucher di bawah ini untuk mengaktifkan layanan premium Anda sekarang juga.
          </p>

          <div className="bg-muted/50 border border-border rounded-[32px] p-10 mb-6 relative group shadow-inner">
            <p className="text-[10px] uppercase tracking-[0.3em] text-slate-400 font-black mb-4">Kode Voucher Eksklusif Anda</p>
            <div className="flex flex-row items-center justify-center gap-4">
              <span className="text-xl md:text-3xl lg:text-4xl font-black text-foreground tracking-tight">
                {code || (isChecking ? 'MENGECEK...' : 'VC-XXXXXXXX')}
              </span>
              <button 
                onClick={copyCode}
                className="p-3 md:p-5 bg-background hover:bg-muted/50 text-primary rounded-2xl transition-all duration-300 border border-border shadow-sm active:scale-95 shrink-0"
              >
                <Copy className="size-5 md:size-6" />
              </button>
            </div>
          </div>
          
          {/* Primary: Claim directly from this page */}
          {code && voucherData?.status === 'UNUSED' && (
            <button
              onClick={handleClaim}
              disabled={isClaiming}
              className="w-full bg-gradient-to-br from-primary to-primary/80 text-primary-foreground font-black py-5 rounded-2xl flex items-center justify-center gap-3 hover:scale-[1.02] active:scale-95 transition-all uppercase tracking-widest text-sm shadow-xl shadow-primary/20 disabled:opacity-60 disabled:scale-100 mb-12"
            >
              {isClaiming ? (
                <><Loader2 className="size-5 animate-spin" /> Memproses Klaim...</>
              ) : (
                <><Zap className="size-5" /> Claim Sekarang</>
              )}
            </button>
          )}

          {voucherData?.expired_at && (
            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-12 p-6 bg-primary/10 border border-primary/20 rounded-[32px] flex items-center gap-4 text-left"
            >
              <div className="p-3 bg-background rounded-2xl shadow-sm border border-border">
                <AlertCircle className="size-6 text-primary" />
              </div>
              <div>
                <p className="text-xs font-black text-primary uppercase tracking-widest mb-0.5">Peringatan Penting</p>
                <p className="text-sm text-muted-foreground font-bold">
                  Segera klaim voucher Anda sebelum <span className="text-primary font-black">{new Date(voucherData.expired_at).toLocaleString('id-ID', { dateStyle: 'long', timeStyle: 'short' })}</span> agar tidak hangus.
                </p>
              </div>
            </motion.div>
          )}

          <div className="flex flex-col gap-4">
            {/* Secondary: Go to redeem page manually */}
            <Link
              href={code ? `/redeem?code=${code}` : '/redeem'}
              className="w-full py-5 px-4 bg-muted/50 text-foreground font-black rounded-2xl flex flex-col md:flex-row items-center justify-center gap-2 md:gap-3 hover:bg-muted hover:text-primary transition-all uppercase tracking-widest text-[10px] md:text-sm border border-border text-center"
            >
              <span className="leading-relaxed">Aktivasi Manual di Halaman Redeem</span>
              <ArrowRight className="size-4 shrink-0 hidden md:block" />
            </Link>
            <Link
              href="/"
              className="w-full py-5 bg-background text-slate-400 font-black rounded-2xl flex items-center justify-center gap-3 hover:text-foreground transition-all uppercase tracking-widest text-xs"
            >
              <Home className="size-4" />
              Kembali ke Beranda
            </Link>
          </div>

          <div className="mt-12 pt-8 border-t border-border flex flex-col md:flex-row items-center justify-center gap-2 md:gap-3 text-center">
            <div className="flex items-center justify-center gap-2 text-[10px] text-slate-400 font-black uppercase tracking-widest">
              <MessageSquare className="size-4 text-primary shrink-0" />
              <span>Butuh bantuan? Hubungi</span>
            </div>
            <Link href="https://wa.me/628123456789" className="text-[10px] text-primary font-black uppercase tracking-widest hover:underline">
              Support WhatsApp
            </Link>
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
