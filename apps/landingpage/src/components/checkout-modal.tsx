'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, ShieldCheck, ArrowRight, Loader2, User, Mail, MessageSquare, AlertCircle, Shield } from 'lucide-react'
import { Product, ProductVariant } from '@/hooks/use-products'
import { api } from '@/lib/api'
import { toast } from 'sonner'
import { formatCurrency } from '@/lib/format'

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
  const [step, setStep] = useState(1)
  const [formData, setFormData] = useState({ name: '', email: '', whatsapp: '' })
  const [isLoading, setIsLoading] = useState(false)
  const [isShaking, setIsShaking] = useState(false)
  const [paymentUrl, setPaymentUrl] = useState<string | null>(null)

  const shakeAnimation = {
    x: [0, -10, 10, -10, 10, 0],
    transition: { duration: 0.4 }
  }

  const handleStep1Submit = (e: React.FormEvent) => {
    e.preventDefault()
    
    // Validation
    if (!formData.name || !formData.email || !formData.whatsapp) {
      setIsShaking(true)
      toast.error('Silahkan isi form terlebih dahulu', {
        position: 'top-center',
        className: 'font-bold uppercase text-[10px] tracking-widest'
      })
      setTimeout(() => setIsShaking(false), 500)
      return
    }

    // WhatsApp validation: must start with 08 or 62
    if (!formData.whatsapp.startsWith('08') && !formData.whatsapp.startsWith('62')) {
      setIsShaking(true)
      toast.error('Nomor WhatsApp harus diawali 08 atau 62', {
        position: 'top-center',
        className: 'font-bold uppercase text-[10px] tracking-widest'
      })
      setTimeout(() => setIsShaking(false), 500)
      return
    }

    setStep(2)
  }

  const handleFinalCheckout = async () => {
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
        if (window.loadJokulCheckout) {
          window.loadJokulCheckout(data.payment_url)
        } else {
          window.location.href = data.payment_url
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

  const handleClose = () => {
    setStep(1)
    setFormData({ name: '', email: '', whatsapp: '' })
    onClose()
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 md:p-6 overflow-y-auto">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={handleClose}
            className="fixed inset-0 bg-[#0f172a]/40 backdrop-blur-md"
          />
          
          <motion.div
            initial={{ scale: 0.9, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.9, opacity: 0, y: 20 }}
            className="relative bg-white w-full max-w-4xl rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
          >
            {/* Header */}
            <div className="p-6 md:px-10 border-b border-slate-100 flex items-center justify-between sticky top-0 bg-white z-20">
              <div className="flex items-center gap-3">
                <div className="bg-[#0f172a] p-2 rounded-lg">
                  <ShieldCheck className="size-5 text-white" />
                </div>
                <h2 className="text-lg md:text-xl font-bold text-[#0f172a]">
                  {step === 1 ? 'Detail Pesanan' : 'Konfirmasi Pembayaran'}
                </h2>
              </div>
              <button onClick={handleClose} className="text-slate-400 hover:text-[#0f172a] transition-colors p-2">
                <X className="size-6" />
              </button>
            </div>

            <div className="flex-grow overflow-y-auto">
              <AnimatePresence mode="wait">
                {step === 1 ? (
                  <motion.div 
                    key="step1"
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 20 }}
                    className="p-6 md:p-10"
                  >
                    <div className="grid grid-cols-1 lg:grid-cols-5 gap-10">
                      {/* Left Side: Form */}
                      <motion.div 
                        animate={isShaking ? shakeAnimation : {}}
                        className="lg:col-span-3 space-y-6"
                      >
                        <div className="space-y-6">
                          <h4 className="text-sm font-bold text-[#0f172a] flex items-center gap-2">
                            Data Pemesan
                          </h4>
                          
                          <div className="space-y-4">
                            <div className="space-y-2">
                              <label className="text-xs font-semibold text-slate-600 ml-1">
                                Nama Anda
                              </label>
                              <input 
                                type="text"
                                className="w-full bg-white border border-slate-200 rounded-xl py-3 px-4 text-[#0f172a] focus:outline-none focus:border-[#f97316] focus:bg-white transition-all font-medium placeholder:text-slate-300"
                                placeholder="Masukkan nama Anda"
                                value={formData.name}
                                onChange={e => setFormData({...formData, name: e.target.value})}
                              />
                            </div>

                            <div className="space-y-2">
                              <label className="text-xs font-semibold text-slate-600 ml-1">
                                Alamat Email (Voucher akan dikirimkan ke email ini)
                              </label>
                              <input 
                                type="email"
                                className="w-full bg-white border border-slate-200 rounded-xl py-3 px-4 text-[#0f172a] focus:outline-none focus:border-[#f97316] focus:bg-white transition-all font-medium placeholder:text-slate-300"
                                placeholder="email@contoh.com"
                                value={formData.email}
                                onChange={e => setFormData({...formData, email: e.target.value})}
                              />
                            </div>

                            <div className="space-y-2">
                              <label className="text-xs font-semibold text-slate-600 ml-1">
                                Nomor WhatsApp
                              </label>
                              <input 
                                type="tel"
                                className="w-full bg-white border border-slate-200 rounded-xl py-3 px-4 text-[#0f172a] focus:outline-none focus:border-[#f97316] focus:bg-white transition-all font-medium placeholder:text-slate-300"
                                placeholder="0812..."
                                value={formData.whatsapp}
                                onChange={e => setFormData({...formData, whatsapp: e.target.value.replace(/[^0-9]/g, '')})}
                              />
                            </div>
                          </div>
                        </div>

                        <div className="p-4 bg-orange-50/50 rounded-xl border border-orange-100/50 flex items-start gap-3">
                          <AlertCircle className="size-4 text-[#f97316] shrink-0 mt-0.5" />
                          <p className="text-xs text-orange-700 font-medium leading-relaxed">
                            Metode pembayaran QRIS (Dukungan Semua Bank & E-Wallet) akan muncul setelah menekan tombol Bayar Sekarang.
                          </p>
                        </div>
                      </motion.div>

                      {/* Right Side: Summary */}
                      <div className="lg:col-span-2">
                        <div className="bg-slate-50/50 rounded-2xl p-6 border border-slate-100 h-full flex flex-col">
                          <h4 className="text-xs font-bold text-[#0f172a] mb-6">Ringkasan</h4>
                          
                          <div className="bg-white rounded-xl p-4 border border-slate-100 shadow-sm mb-6">
                            <div className="flex items-center gap-4">
                              <div className="bg-orange-50 p-2 rounded-lg">
                                <ShieldCheck className="size-5 text-[#f97316]" />
                              </div>
                              <div>
                                <p className="text-sm font-bold text-[#0f172a] leading-tight">{product?.name}</p>
                                <p className="text-[10px] font-bold text-[#f97316] uppercase tracking-wider mt-0.5">{variant?.name}</p>
                              </div>
                            </div>
                          </div>

                          <div className="space-y-3 flex-grow">
                            <div className="flex justify-between text-xs font-medium text-slate-500">
                              <span>Harga Paket</span>
                              <span className="text-[#0f172a]">{formatCurrency(variant?.price || 0)}</span>
                            </div>
                            <div className="flex justify-between text-xs font-medium text-slate-500">
                              <span>Biaya Admin</span>
                              <span className="text-emerald-600 font-bold">GRATIS</span>
                            </div>
                            <div className="pt-4 border-t border-slate-200 border-dashed flex justify-between items-center">
                              <span className="text-sm font-bold text-[#0f172a]">Total Bayar</span>
                              <span className="text-xl font-bold text-[#f97316]">{formatCurrency(variant?.price || 0)}</span>
                            </div>
                          </div>

                          <button 
                            onClick={handleStep1Submit}
                            className="w-full mt-6 py-4 bg-[#0f172a] hover:bg-slate-800 text-white font-bold rounded-xl transition-all flex items-center justify-center gap-2 text-sm shadow-xl active:scale-95"
                          >
                            <ShieldCheck className="size-4" />
                            Bayar Sekarang
                          </button>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                ) : (
                  <motion.div 
                    key="step2"
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    className="p-8 md:p-16 flex flex-col items-center text-center space-y-10"
                  >
                    <div className="relative">
                      <div className="absolute inset-0 bg-orange-500/20 blur-[40px] rounded-full animate-pulse" />
                      <div className="relative bg-white border border-slate-100 p-8 rounded-full shadow-xl">
                        <Shield className="size-16 text-[#f97316]" />
                      </div>
                    </div>

                    <div className="max-w-md space-y-4">
                      <h3 className="text-3xl font-black text-[#0f172a] tracking-tight">Pembayaran Aman</h3>
                      <p className="text-slate-500 font-medium leading-relaxed">
                        Anda akan dialihkan ke <span className="text-[#f97316] font-bold">DOKU Gateway</span> untuk menyelesaikan pembayaran secara aman.
                      </p>
                    </div>

                    <div className="w-full max-w-sm bg-slate-50 border border-slate-100 rounded-3xl p-8 space-y-2">
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Total Tagihan</p>
                      <p className="text-4xl font-black text-[#0f172a] tracking-tighter">{formatCurrency(variant?.price || 0)}</p>
                    </div>

                    <div className="w-full max-w-sm space-y-4">
                      <button 
                        onClick={handleFinalCheckout}
                        disabled={isLoading}
                        className="w-full py-5 bg-[#0f172a] hover:bg-slate-800 text-white font-black rounded-2xl flex items-center justify-center gap-3 shadow-xl transition-all active:scale-95 disabled:opacity-50"
                      >
                        {isLoading ? <Loader2 className="size-5 animate-spin" /> : 'Lanjutkan ke Pembayaran'}
                      </button>
                      <button 
                        onClick={() => setStep(1)}
                        className="w-full py-4 text-slate-400 hover:text-slate-600 font-bold text-sm transition-colors"
                      >
                        Batalkan
                      </button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  )
}
