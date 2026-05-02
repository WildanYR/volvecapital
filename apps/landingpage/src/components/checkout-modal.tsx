'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, ShieldCheck, ArrowRight, Loader2, Copy, CheckCircle2, CreditCard } from 'lucide-react'
import { Product, ProductVariant } from '@/hooks/use-products'
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
  const [formData, setFormData] = useState({ name: '', email: '', whatsapp: '' })
  const [isLoading, setIsLoading] = useState(false)
  const [paidVoucher, setPaidVoucher] = useState<string | null>(null)
  const [isPolling, setIsPolling] = useState(false)
  const [orderId, setOrderId] = useState<string | null>(null)

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
        
        const interval = setInterval(async () => {
          try {
            const res = await api.get(`/public/payment/status/${data.order_id}`)
            if (res.data.payment_status === 'PAID') {
              setPaidVoucher(res.data.voucher_code)
              setIsPolling(false)
              clearInterval(interval)
              toast.success('Pembayaran Berhasil!')
            }
          } catch (err) { console.error('Polling error:', err) }
        }, 3000)

        if (window.loadJokulCheckout) window.loadJokulCheckout(data.payment_url)
        else window.open(data.payment_url, '_blank')
      } else { toast.error('Gagal mendapatkan link pembayaran') }
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Gagal membuat pesanan')
    } finally { setIsLoading(false) }
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
            className="fixed inset-0 bg-[#0f172a]/60 backdrop-blur-xl"
          />
          
          <motion.div
            initial={{ scale: 0.9, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.9, opacity: 0, y: 20 }}
            className="relative bg-white w-full max-w-xl rounded-[48px] p-8 md:p-12 border border-slate-100 shadow-2xl overflow-hidden"
          >
            <button onClick={onClose} className="absolute top-8 right-8 text-slate-400 hover:text-[#0f172a] transition-colors p-2 z-20">
              <X className="size-8" />
            </button>

            <div className="relative z-10 mb-8">
              <div className="flex items-center gap-3 text-[#f97316] mb-4">
                <ShieldCheck className="size-6" />
                <span className="text-xs font-black uppercase tracking-[0.3em]">Checkout Aman</span>
              </div>
              <h2 className="text-3xl md:text-5xl font-black mb-6 text-[#0f172a] tracking-tight">
                {paidVoucher ? 'Selesai!' : isPolling ? 'Memproses...' : 'Konfirmasi'}
              </h2>
              <div className="bg-slate-50 p-6 rounded-3xl border border-slate-100 space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-slate-500 font-bold text-sm">Produk:</span>
                  <span className="text-[#0f172a] font-black">{product?.name}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-500 font-bold text-sm">Paket:</span>
                  <span className="text-[#f97316] font-black">{variant?.name}</span>
                </div>
              </div>
            </div>

            {paidVoucher ? (
              <div className="relative z-10 space-y-8 text-center">
                <div className="size-20 bg-emerald-50 rounded-full flex items-center justify-center mx-auto border border-emerald-100">
                  <CheckCircle2 className="size-10 text-emerald-500" />
                </div>
                <div className="bg-slate-50 border border-slate-100 rounded-[32px] p-8 relative group">
                  <span className="text-4xl md:text-5xl font-black text-[#f97316] tracking-tighter break-all block mb-6">
                    {paidVoucher}
                  </span>
                  <button 
                    onClick={() => {
                      navigator.clipboard.writeText(paidVoucher!)
                      toast.success('Kode voucher disalin!')
                    }}
                    className="p-4 bg-orange-50 text-[#f97316] rounded-2xl border border-orange-100 hover:bg-orange-500 hover:text-white transition-all mx-auto flex items-center gap-2 font-bold"
                  >
                    <Copy className="size-5" /> Copy Voucher
                  </button>
                </div>
                <Link href="/redeem" className="w-full bg-gradient-to-br from-[#f97316] to-[#ef4444] text-white font-black py-5 rounded-2xl flex items-center justify-center gap-3 shadow-xl uppercase tracking-widest text-sm">
                  Aktivasi Sekarang <ArrowRight className="size-5" />
                </Link>
              </div>
            ) : isPolling ? (
              <div className="relative z-10 space-y-10 py-8 text-center">
                <div className="relative mx-auto size-32">
                  <div className="absolute inset-0 border-4 border-orange-100 rounded-full" />
                  <div className="absolute inset-0 border-4 border-[#f97316] border-t-transparent rounded-full animate-spin" />
                  <div className="absolute inset-0 flex items-center justify-center">
                    <CreditCard className="size-12 text-[#f97316] animate-pulse" />
                  </div>
                </div>
                <div className="space-y-4">
                  <h3 className="text-2xl font-black text-[#0f172a] uppercase tracking-tight">Menunggu Pembayaran</h3>
                  <p className="text-slate-500 text-xs font-medium max-w-[300px] mx-auto leading-relaxed">
                    Selesaikan pembayaran Anda di popup DOKU. Voucher akan muncul otomatis.
                  </p>
                </div>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="relative z-10 space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Nama</label>
                    <input required type="text" placeholder="Budi Santoso" className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-6 py-4 text-base font-bold focus:border-[#f97316] outline-none text-[#0f172a]" value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Email</label>
                    <input required type="email" placeholder="budi@example.com" className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-6 py-4 text-base font-bold focus:border-[#f97316] outline-none text-[#0f172a]" value={formData.email} onChange={e => setFormData({ ...formData, email: e.target.value })} />
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">WhatsApp</label>
                  <input required type="tel" placeholder="81234567890" className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-6 py-5 text-lg font-black focus:border-[#f97316] outline-none text-[#0f172a]" value={formData.whatsapp} onChange={e => setFormData({ ...formData, whatsapp: e.target.value.replace(/[^0-9]/g, '') })} />
                </div>
                <button disabled={isLoading} type="submit" className="w-full bg-gradient-to-br from-[#f97316] to-[#ef4444] text-white font-black py-5 rounded-2xl flex items-center justify-center gap-4 hover:scale-105 transition-all shadow-[0_15px_30px_rgba(249,115,22,0.2)]">
                  {isLoading ? <Loader2 className="size-6 animate-spin" /> : <>Bayar {formatCurrency(variant?.price || 0)} <ArrowRight className="size-6" /></>}
                </button>
              </form>
            )}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  )
}
