'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Send, CreditCard, Loader2, CheckCircle2, ShieldCheck, Zap, ArrowRight } from 'lucide-react'
import { Product, ProductVariant } from '@/hooks/use-products'
import { api } from '@/lib/api'
import { toast } from 'sonner'
import { formatCurrency } from '@/lib/format'

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

      if (window.snap) {
        window.snap.pay(data.snap_token, {
          onSuccess: (result: any) => {
            toast.success('Pembayaran Berhasil!')
            window.location.hash = '#redeem'
            onClose()
          },
          onPending: (result: any) => {
            toast.info('Menunggu Pembayaran...')
            onClose()
          },
          onError: (result: any) => {
            toast.error('Pembayaran Gagal')
          },
          onClose: () => {
            toast.warning('Checkout dibatalkan')
          },
        })
      } else {
        toast.error('Sistem pembayaran belum siap, coba lagi nanti.')
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

            <div className="relative z-10 mb-12">
              <div className="flex items-center gap-3 text-[#FFB800] mb-4">
                <ShieldCheck className="size-6" />
                <span className="text-xs font-black uppercase tracking-[0.3em]">Checkout Aman</span>
              </div>
              <h2 className="text-3xl md:text-5xl font-black mb-6 text-white tracking-tight">Konfirmasi Pesanan</h2>
              <div className="bg-white/[0.03] p-6 rounded-3xl border border-white/5 space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-gray-500 font-bold text-sm">Produk:</span>
                  <span className="text-white font-black">{product?.name}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-500 font-bold text-sm">Paket:</span>
                  <span className="text-[#FFB800] font-black">{variant?.name}</span>
                </div>
                <div className="pt-4 border-t border-white/5 flex justify-between items-center">
                  <span className="text-gray-400 font-bold text-lg">Total Bayar:</span>
                  <span className="text-2xl md:text-3xl font-black text-white">{variant ? formatCurrency(variant.price) : ''}</span>
                </div>
              </div>
            </div>

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
                <p className="text-[10px] text-gray-600 font-bold italic px-2">Voucher dikirim otomatis ke nomor WhatsApp ini.</p>
              </div>

              <div className="pt-10">
                <button
                  disabled={isLoading}
                  type="submit"
                  className="w-full bg-[#FFB800] text-black font-black py-5 rounded-2xl flex items-center justify-center gap-4 hover:scale-105 active:scale-[0.98] transition-all disabled:opacity-50 text-base uppercase tracking-widest shadow-[0_15px_40px_rgba(255,184,0,0.3)]"
                >
                  {isLoading ? (
                    <Loader2 className="size-6 animate-spin" />
                  ) : (
                    <>
                      Lanjut Pembayaran
                      <ArrowRight className="size-6" />
                    </>
                  )}
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  )
}
