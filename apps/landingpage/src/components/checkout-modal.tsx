'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, ShieldCheck, Loader2, AlertCircle, Shield, Lock } from 'lucide-react'
import { Product, ProductVariant } from '@/hooks/use-products'
import { api } from '@/lib/api'
import { toast } from 'sonner'
import { formatCurrency } from '@/lib/format'
import { useNotification } from '@/hooks/use-notification'
import { REOPEN_CHECKOUT_EVENT } from '@/lib/events'

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
  initialData?: any
}

export function CheckoutModal({ isOpen, onClose, product, variant, initialData }: CheckoutModalProps) {
  const [step, setStep] = useState(1)
  const [formData, setFormData] = useState({ name: '', email: '', whatsapp: '' })
  const [isLoading, setIsLoading] = useState(false)
  const [isShaking, setIsShaking] = useState(false)
  const [paymentUrl, setPaymentUrl] = useState<string | null>(initialData?.paymentUrl || null)
  const [promoCode, setPromoCode] = useState(initialData?.promoCode || '')
  const [promoData, setPromoData] = useState<{ id: string, discount_amount: number } | null>(null)
  const [isPromoLoading, setIsPromoLoading] = useState(false)
  const [promoError, setPromoError] = useState('')
  const [showCloseConfirm, setShowCloseConfirm] = useState(false)
  const { addNotification } = useNotification()
  
  // Handle initial data population
  useEffect(() => {
    if (isOpen && initialData) {
      if (initialData.formData) {
        setFormData(initialData.formData);
      }
      if (initialData.paymentUrl) {
        setPaymentUrl(initialData.paymentUrl);
        // If we have paymentUrl, we might want to skip to step 2
        setStep(2);
      }
    }
  }, [isOpen, initialData])

  // Reset state when variant changes or modal opens
  useEffect(() => {
    if (isOpen && !initialData) {
      setPromoCode('')
      setPromoData(null)
      setPromoError('')
      setStep(1)
    }
  }, [variant?.id, isOpen, initialData])


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

  const handleValidatePromo = async () => {
    if (!promoCode || !variant) return
    
    setIsPromoLoading(true)
    setPromoError('')
    setPromoData(null)
    
    try {
      const { data } = await api.post('/public/promo/validate', {
        code: promoCode,
        total_purchase: variant.price,
        product_variant_id: variant.id
      })
      setPromoData(data)
      toast.success('Kode promo berhasil dipasang!', {
        position: 'top-center',
        className: 'font-bold uppercase text-[10px] tracking-widest'
      })
    } catch (error: any) {
      setPromoError(error.response?.data?.message || 'Kode promo tidak valid')
      toast.error(error.response?.data?.message || 'Kode promo tidak valid', {
        position: 'top-center',
        className: 'font-bold uppercase text-[10px] tracking-widest'
      })
    } finally {
      setIsPromoLoading(false)
    }
  }

  const handleFinalCheckout = async () => {
    if (!product || !variant) return

    // If we already have a payment URL (from notification), just use it
    if (paymentUrl) {
      setIsLoading(true); // Show loading while redirecting
      if (window.loadJokulCheckout) {
        window.loadJokulCheckout(paymentUrl)
      } else {
        window.location.href = paymentUrl
      }
      return;
    }

    setIsLoading(true)
    
    const finalVariantId = variant.id;
    const finalPromoCode = (promoData && promoCode) ? promoCode : undefined;

    // Debug log to browser console
    console.log(`[CHECKOUT] Creating payment for variant: ${variant.name} (${finalVariantId}) with price ${variant.price}`);
    console.log(`[REAL_SEND] Sending to API - ID: ${finalVariantId}, Promo: ${finalPromoCode}`);

    try {
      const { data } = await api.post(`/public/payment/create?t=${Date.now()}`, {
        product_variant_id: finalVariantId,
        buyer_name: formData.name,
        buyer_email: formData.email,
        buyer_whatsapp: formData.whatsapp,
        promo_code: finalPromoCode
      })

      if (data.payment_url) {
        // Add pending notification before redirecting
        addNotification({
          type: 'pending',
          title: 'Pembayaran Tertunda',
          message: `Segera selesaikan pembayaran untuk ${product.name} (${variant.name})`,
          data: {
            orderId: data.order_id, 
            productId: product.id,
            variantId: variant.id,
            productName: product.name,
            variantName: variant.name,
            price: (variant.price || 0) - (promoData?.discount_amount || 0),
            paymentUrl: data.payment_url,
            formData: formData,
            promoCode: finalPromoCode
          }
        });

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
    // Show custom confirmation if in step 2 (payment process)
    if (step === 2 && !isLoading) {
      setShowCloseConfirm(true)
      return
    }

    // Force a full page reload to clear any DOKU/Jokul cached sessions
    window.location.reload()
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <div key="modal-portal" className="fixed inset-0 z-[200] flex items-center justify-center p-4 md:p-6 overflow-y-auto">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={handleClose}
            className="fixed inset-0 bg-primary/40 backdrop-blur-md"
          />
          
          <motion.div
            initial={{ scale: 0.9, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.9, opacity: 0, y: 20 }}
            className="relative bg-background w-full max-w-6xl rounded-[2rem] shadow-2xl overflow-hidden flex flex-col max-h-[95vh]"
          >
            {/* Header */}
            <div className="p-6 md:px-12 border-b border-border flex items-center justify-between sticky top-0 bg-background z-20 rounded-t-[2rem]">
              <div className="flex items-center gap-3">
                <div className="bg-primary p-2 rounded-lg">
                  <ShieldCheck className="size-5 text-primary-foreground" />
                </div>
                <h2 className="text-xl md:text-2xl font-black text-foreground">
                  {step === 1 ? 'Detail Pesanan' : 'Konfirmasi Pembayaran'}
                </h2>
              </div>
              <button onClick={handleClose} className="text-slate-400 hover:text-foreground transition-colors p-2">
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
                    className="p-6 md:p-12"
                  >
                    <div className="grid grid-cols-1 lg:grid-cols-5 gap-12 lg:gap-16">
                      {/* Left Side: Form */}
                      <motion.div 
                        animate={isShaking ? shakeAnimation : {}}
                        className="lg:col-span-3 space-y-6"
                      >
                        <div className="space-y-8">
                          <h3 className="text-2xl font-black text-foreground">Data Pemesan</h3>
                          
                          <div className="space-y-4">
                            <div className="space-y-2">
                              <label className="text-lg font-bold text-slate-700 ml-1">
                                Nama Lengkap
                              </label>
                              <input 
                                type="text"
                                className="w-full bg-background border-2 border-border rounded-2xl py-5 px-6 text-foreground focus:outline-none focus:border-primary focus:bg-background transition-all font-bold placeholder:text-slate-300 text-xl"
                                placeholder="Masukkan nama Anda"
                                value={formData.name}
                                onChange={e => setFormData({...formData, name: e.target.value})}
                              />
                            </div>

                            <div className="space-y-2">
                              <label className="text-lg font-bold text-slate-700 ml-1">
                                Alamat Email
                              </label>
                              <input 
                                type="email"
                                className="w-full bg-background border-2 border-border rounded-2xl py-5 px-6 text-foreground focus:outline-none focus:border-primary focus:bg-background transition-all font-bold placeholder:text-slate-300 text-xl"
                                placeholder="email@contoh.com"
                                value={formData.email}
                                onChange={e => setFormData({...formData, email: e.target.value})}
                              />
                            </div>

                            <div className="space-y-2">
                              <label className="text-lg font-bold text-slate-700 ml-1">
                                Nomor WhatsApp
                              </label>
                              <input 
                                type="tel"
                                className="w-full bg-background border-2 border-border rounded-2xl py-5 px-6 text-foreground focus:outline-none focus:border-primary focus:bg-background transition-all font-bold placeholder:text-slate-300 text-xl"
                                placeholder="0812..."
                                value={formData.whatsapp}
                                onChange={e => setFormData({...formData, whatsapp: e.target.value.replace(/[^0-9]/g, '')})}
                              />
                            </div>
                          </div>
                        </div>

                        <div className="p-4 bg-primary/10/50 rounded-2xl border border-primary/20/50 flex items-center gap-3">
                          <div className="bg-primary p-1.5 rounded-full shrink-0">
                            <AlertCircle className="size-3.5 text-primary-foreground" />
                          </div>
                          <p className="text-xs text-destructive font-bold leading-relaxed">
                            Metode pembayaran QRIS (Dukungan Semua Bank & E-Wallet) akan muncul setelah menekan tombol Bayar Sekarang.
                          </p>
                        </div>
                      </motion.div>

                      {/* Right Side: Summary */}
                      <div className="lg:col-span-2">
                        <div className="bg-muted/50/50 rounded-2xl p-6 border border-border h-full flex flex-col">
                          <h4 className="text-lg font-black text-foreground mb-6">Ringkasan</h4>
                          
                          <div className="bg-background rounded-xl p-4 border border-border shadow-sm mb-6">
                            <div className="flex items-center gap-5">
                              <div className="bg-primary/10 p-3 rounded-2xl">
                                <ShieldCheck className="size-6 text-primary" />
                              </div>
                              <div>
                                <p className="text-xl font-black text-foreground leading-tight">{product?.name}</p>
                                <p className="text-xs font-black text-primary uppercase tracking-[0.2em] mt-1">{variant?.name}</p>
                              </div>
                            </div>
                          </div>

                          <div className="space-y-4 flex-grow">
                            <div className="flex justify-between text-base font-bold text-muted-foreground">
                              <span>Harga Paket</span>
                              <span className="text-foreground">{formatCurrency(variant?.price || 0)}</span>
                            </div>
                            <div className="flex justify-between text-base font-bold text-muted-foreground">
                              <span>Biaya Admin</span>
                              <span className="text-accent-foreground font-black">GRATIS</span>
                            </div>

                            <div className="pt-6 border-t border-border">
                              <p className="text-xs font-black text-slate-400 uppercase tracking-widest mb-3">Punya Kode Promo?</p>
                              <div className="flex items-stretch border-2 border-border rounded-2xl overflow-hidden focus-within:border-primary transition-all bg-background">
                                <input 
                                  type="text" 
                                  placeholder="Masukkan kode..."
                                  className="flex-1 min-w-0 px-5 py-4 text-sm font-black focus:outline-none uppercase placeholder:text-slate-300"
                                  value={promoCode}
                                  onChange={(e) => {
                                    setPromoCode(e.target.value)
                                    if (promoError) setPromoError('')
                                    if (promoData) setPromoData(null)
                                  }}
                                />
                                <button 
                                  onClick={handleValidatePromo}
                                  disabled={isPromoLoading || !promoCode || !!promoData}
                                  className="bg-primary text-primary-foreground px-8 font-black hover:bg-primary/90 transition-colors disabled:opacity-50 shrink-0 flex items-center justify-center border-l-2 border-border text-xs"
                                >
                                  {isPromoLoading ? <Loader2 className="size-4 animate-spin" /> : (promoData ? 'OK' : 'Gunakan')}
                                </button>
                              </div>
                              {promoError && (
                                <p className="text-[10px] text-red-500 font-bold mt-2 ml-1 uppercase tracking-wider">{promoError}</p>
                              )}
                            </div>

                            <div className="pt-6 border-t-2 border-border border-dashed space-y-4">
                              {promoData && (
                                <div className="flex justify-between text-sm font-bold text-muted-foreground">
                                  <span>Potongan Promo</span>
                                  <span className="text-red-500">-{formatCurrency(promoData.discount_amount)}</span>
                                </div>
                              )}
                              <div className="flex justify-between items-center py-2">
                                <span className="text-lg font-bold text-slate-400">Total Bayar</span>
                                <span className="text-3xl font-black text-primary tracking-tight">
                                  {formatCurrency((variant?.price || 0) - (promoData?.discount_amount || 0))}
                                </span>
                              </div>
                            </div>
                          </div>

                          <button 
                            onClick={handleStep1Submit}
                            className="w-full mt-6 py-5 bg-gradient-to-r from-primary to-primary/80 text-primary-foreground font-black rounded-2xl transition-all flex items-center justify-center gap-3 text-base shadow-xl shadow-primary/20 active:scale-95"
                          >
                            <ShieldCheck className="size-5" />
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
                      <div className="absolute inset-0 bg-primary/100/20 blur-[40px] rounded-full animate-pulse" />
                      <div className="relative bg-background border border-border p-8 rounded-full shadow-xl">
                        <Shield className="size-16 text-primary" />
                      </div>
                    </div>

                    <div className="max-w-md space-y-4">
                      <h3 className="text-3xl font-black text-foreground tracking-tight">Pembayaran Aman</h3>
                      <p className="text-muted-foreground font-medium leading-relaxed">
                        Anda akan dialihkan ke <span className="text-primary font-bold">DOKU Gateway</span> untuk menyelesaikan pembayaran secara aman.
                      </p>
                    </div>

                    <div className="w-full max-w-sm bg-muted/50 border border-border rounded-3xl p-8 space-y-2">
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Total Tagihan</p>
                      <p className="text-4xl font-black text-foreground tracking-tighter">
                        {formatCurrency((variant?.price || 0) - (promoData?.discount_amount || 0))}
                      </p>
                    </div>

                    <div className="w-full max-w-sm space-y-4">
                      <button 
                        onClick={handleFinalCheckout}
                        disabled={isLoading}
                        className="w-full py-5 bg-primary hover:bg-primary/90 text-primary-foreground font-black rounded-2xl flex items-center justify-center gap-3 shadow-xl transition-all active:scale-95 disabled:opacity-50"
                      >
                        {isLoading ? <Loader2 className="size-5 animate-spin" /> : (paymentUrl ? 'Bayar via DOKU Sekarang' : 'Lanjutkan ke Pembayaran')}
                      </button>
                      <button 
                        onClick={() => setStep(1)}
                        className="w-full py-4 text-slate-400 hover:text-muted-foreground font-bold text-sm transition-colors"
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

      {/* Custom Confirmation Dialog */}
      <AnimatePresence>
        {showCloseConfirm && (
          <div key="confirm-portal" className="fixed inset-0 z-[300] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-primary/60 backdrop-blur-sm"
              onClick={() => setShowCloseConfirm(false)}
            />
            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              className="relative bg-background p-8 rounded-[2.5rem] shadow-2xl max-w-sm w-full text-center space-y-6 overflow-hidden"
            >
              <div className="absolute top-0 right-0 w-32 h-32 bg-primary/100/5 blur-3xl -mr-16 -mt-16" />
              
              <div className="bg-primary/10 w-20 h-20 rounded-full flex items-center justify-center mx-auto relative">
                <div className="absolute inset-0 bg-primary/20 animate-ping rounded-full" />
                <AlertCircle className="size-10 text-primary relative" />
              </div>

              <div className="space-y-2">
                <h3 className="text-2xl font-black text-foreground">Batalkan Pesanan?</h3>
                <p className="text-muted-foreground font-medium leading-relaxed">
                  Proses pembayaran Anda sedang berlangsung. Apakah Anda yakin ingin membatalkan?
                </p>
              </div>

              <div className="grid grid-cols-1 gap-3 pt-2">
                <button 
                  onClick={() => window.location.reload()}
                  className="w-full py-4 bg-destructive hover:bg-destructive/90 text-destructive-foreground font-black rounded-2xl transition-all shadow-lg active:scale-95"
                >
                  Ya, Batalkan Sekarang
                </button>
                <button 
                  onClick={() => setShowCloseConfirm(false)}
                  className="w-full py-4 bg-muted/50 hover:bg-muted text-muted-foreground font-bold rounded-2xl transition-colors"
                >
                  Lanjutkan Pembayaran
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </AnimatePresence>
  )
}
