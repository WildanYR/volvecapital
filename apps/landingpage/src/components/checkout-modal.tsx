'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, ShieldCheck, ArrowRight, Loader2, Copy, CheckCircle2, CreditCard } from 'lucide-react'
import { Product, ProductVariant } from '@/lib/types'
import { api } from '@/lib/api'
import { toast } from 'sonner'
import { formatCurrency } from '@/lib/format'
import Link from 'next/link'

declare global {
  interface Window {
    loadJokulCheckout: (url: string) => void;
  }
}

interface CheckoutModalProps {
  isOpen: boolean
  onClose: () => void
  product: Product | null
  variant: ProductVariant | null
}

export function CheckoutModal({ isOpen, onClose, product, variant }: CheckoutModalProps) {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    whatsapp: '',
  })
  const [isLoading, setIsLoading] = useState(false)
  const [paidVoucher, setPaidVoucher] = useState<string | null>(null)
  const [isPolling, setIsPolling] = useState(false)
  const [orderId, setOrderId] = useState<string | null>(null)

  // Reset state when modal opens/closes
  useEffect(() => {
    if (!isOpen) {
      setPaidVoucher(null)
      setIsPolling(false)
      setOrderId(null)
    }
  }, [isOpen])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!product || !variant) return

    setIsLoading(true)
    try {
      const { data } = await api.post('/public/payment/create', {
        product_variant_id: variant.id,
        buyer_name: formData.name,
        buyer_email: formData.email,
        buyer_whatsapp: formData.whatsapp,
      })

      if (data.payment_url) {
        setOrderId(data.order_id)
        setIsPolling(true)
        
        // Start Polling
        const interval = setInterval(async () => {
          try {
            const res = await api.get(`/public/payment/status/${data.order_id}`)
            if (res.data.payment_status === 'PAID') {
              setPaidVoucher(res.data.voucher_code)
              setIsPolling(false)
              clearInterval(interval)
              toast.success('Pembayaran Berhasil! Kode voucher muncul di layar.')
            }
          } catch (err) {
            console.error('Polling error:', err)
          }
        }, 3000)

        if (window.loadJokulCheckout) {
          window.loadJokulCheckout(data.payment_url)
        } else {
          window.open(data.payment_url, '_blank')
        }
      } else {
        toast.error('Gagal mendapatkan link pembayaran')
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Gagal membuat pesanan')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/95 backdrop-blur-xl"
          />
          
          <motion.div
            initial={{ scale: 0.9, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.9, opacity: 0, y: 20 }}
            className="relative bg-[#121212] w-full max-w-xl rounded-[48px] p-8 md:p-12 border border-white/10 shadow-[0_0_100px_rgba(255,184,0,0.1)] overflow-hidden"
          >
            {/* Background Accent */}
            <div className="absolute top-0 right-0 w-32 h-32 bg-[#FFB800]/10 blur-[60px] rounded-full -translate-y-1/2 translate-x-1/2" />

            <button 
              onClick={onClose}
              className="absolute top-8 right-8 text-gray-500 hover:text-white transition-colors p-2 z-20"
            >
              <X className="size-8" />
            </button>

            <div className="relative z-10 mb-8">
              <div className="flex items-center gap-3 text-[#FFB800] mb-4">
                <ShieldCheck className="size-6" />
                <span className="text-xs font-black uppercase tracking-[0.3em]">Checkout Aman</span>
              </div>
              <h2 className="text-3xl md:text-5xl font-black mb-6 text-white tracking-tight">
                {paidVoucher ? 'Selesai!' : isPolling ? 'Memproses...' : 'Konfirmasi'}
              </h2>
              <div className="bg-white/[0.03] p-6 rounded-3xl border border-white/5 space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-gray-500 font-bold text-sm">Produk:</span>
                  <span className="text-white font-black">{product?.name}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-500 font-bold text-sm">Paket:</span>
                  <span className="text-[#FFB800] font-black">{variant?.name}</span>
                </div>
              </div>
            </div>

            {paidVoucher ? (
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="relative z-10 space-y-8 text-center"
              >
                <div className="size-20 bg-green-500/10 rounded-full flex items-center justify-center mx-auto border border-green-500/20">
                  <CheckCircle2 className="size-10 text-green-500" />
                </div>
                <div>
                  <h3 className="text-3xl font-black text-white uppercase tracking-tight">Pembayaran Berhasil!</h3>
                  <p className="text-gray-400 text-xs font-bold uppercase tracking-widest mt-1">Gunakan kode voucher di bawah ini</p>
                </div>
                
                <div className="bg-white/[0.03] border border-white/10 rounded-[32px] p-8 relative group">
                  <div className="flex flex-col md:flex-row items-center justify-between gap-6">
                    <span className="text-4xl md:text-5xl font-black text-primary tracking-tighter break-all">
                      {paidVoucher}
                    </span>
                    <button 
                      onClick={() => {
                        navigator.clipboard.writeText(paidVoucher!)
                        toast.success('Kode voucher disalin!')
                      }}
                      className="p-4 bg-primary/10 hover:bg-primary hover:text-black rounded-2xl transition-all duration-300 text-primary border border-primary/20 shrink-0"
                    >
                      <Copy className="size-6" />
                    </button>
                  </div>
                </div>

                <div className="space-y-4">
                  <Link 
                    href="/redeem"
                    className="w-full bg-gradient-gold text-black font-black py-5 rounded-2xl flex items-center justify-center gap-3 hover:scale-[1.02] active:scale-95 transition-all shadow-xl uppercase tracking-widest text-sm"
                  >
                    Aktivasi Sekarang
                    <ArrowRight className="size-5" />
                  </Link>
                </div>
              </motion.div>
            ) : isPolling ? (
              <div className="relative z-10 space-y-10 py-8 text-center">
                <div className="relative mx-auto size-32">
                  <div className="absolute inset-0 border-4 border-primary/10 rounded-full" />
                  <div className="absolute inset-0 border-4 border-primary border-t-transparent rounded-full animate-spin" />
                  <div className="absolute inset-0 flex items-center justify-center">
                    <CreditCard className="size-12 text-primary animate-pulse" />
                  </div>
                </div>
                <div className="space-y-4">
                  <h3 className="text-2xl font-black text-white uppercase tracking-tight text-balance">Menunggu Pembayaran</h3>
                  <p className="text-gray-500 text-[10px] font-bold uppercase tracking-[0.2em] max-w-[300px] mx-auto leading-relaxed">
                    Selesaikan pembayaran Anda di popup DOKU. Voucher akan muncul otomatis setelah Anda bayar.
                  </p>
                </div>
                <Link 
                  href={`/success?order_id=${orderId}`}
                  className="text-primary text-xs font-black uppercase tracking-widest hover:underline flex items-center justify-center gap-2"
                >
                  Buka Halaman Status <ArrowRight className="size-4" />
                </Link>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="relative z-10 space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-3">
                    <label className="text-[10px] font-black text-gray-600 uppercase tracking-widest ml-1">Nama Penerima</label>
                    <input 
                      required
                      type="text"
                      placeholder="Budi Santoso"
                      className="w-full bg-white/[0.03] border border-white/10 rounded-2xl px-6 py-4 text-base font-bold focus:outline-none focus:border-[#FFB800]/50 transition-all text-white"
                      value={formData.name}
                      onChange={e => setFormData({ ...formData, name: e.target.value })}
                    />
                  </div>
                  <div className="space-y-3">
                    <label className="text-[10px] font-black text-gray-600 uppercase tracking-widest ml-1">Email Aktif</label>
                    <input 
                      required
                      type="email"
                      placeholder="budi@example.com"
                      className="w-full bg-white/[0.03] border border-white/10 rounded-2xl px-6 py-4 text-base font-bold focus:outline-none focus:border-[#FFB800]/50 transition-all text-white"
                      value={formData.email}
                      onChange={e => setFormData({ ...formData, email: e.target.value })}
                    />
                  </div>
                </div>

                <div className="space-y-3">
                  <label className="text-[10px] font-black text-gray-600 uppercase tracking-widest ml-1">WhatsApp (Format: 812xxxx)</label>
                  <div className="relative">
                    <span className="absolute left-6 top-1/2 -translate-y-1/2 text-gray-500 font-black text-lg">+62</span>
                    <input 
                      required
                      type="tel"
                      placeholder="81234567890"
                      className="w-full bg-white/[0.03] border border-white/10 rounded-2xl pl-16 pr-6 py-5 text-lg font-black focus:outline-none focus:border-[#FFB800]/50 transition-all text-white"
                      value={formData.whatsapp}
                      onChange={e => setFormData({ ...formData, whatsapp: e.target.value.replace(/[^0-9]/g, '') })}
                    />
                  </div>
                </div>

                <div className="pt-6">
                  <button
                    disabled={isLoading}
                    type="submit"
                    className="w-full bg-[#FFB800] text-black font-black py-5 rounded-2xl flex items-center justify-center gap-4 hover:scale-105 active:scale-[0.98] transition-all disabled:opacity-50 text-base uppercase tracking-widest shadow-[0_15px_40px_rgba(255,184,0,0.3)]"
                  >
                    {isLoading ? (
                      <Loader2 className="size-6 animate-spin" />
                    ) : (
                      <>
                        Bayar Sekarang {formatCurrency(variant?.price || 0)}
                        <ArrowRight className="size-6" />
                      </>
                    )}
                  </button>
                </div>
              </form>
            )}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  )
}
