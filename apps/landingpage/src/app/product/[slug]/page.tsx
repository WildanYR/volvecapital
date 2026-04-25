'use client'

import { useState, use } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Package, Zap, ArrowRight, Loader2, Sparkles, Check, ShoppingBag, ShieldCheck, Mail, MessageSquare } from 'lucide-react'
import { useProducts, Product, ProductVariant } from '@/hooks/use-products'
import { useTenant } from '@/hooks/use-tenant'
import { formatCurrency, formatDuration } from '@/lib/format'
import { Navbar } from '@/components/navbar'
import { Footer } from '@/components/footer'
import { api } from '@/lib/api'
import { toast } from 'sonner'
import { useRouter } from 'next/navigation'

declare global {
  interface Window {
    snap: any
  }
}

export default function ProductDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = use(params)
  const { tenantId } = useTenant()
  const { data: products, isLoading: productsLoading } = useProducts(tenantId)
  const router = useRouter()

  const product = products?.find(p => p.slug === slug)
  const [selectedVariant, setSelectedVariant] = useState<ProductVariant | null>(null)
  const [isProcessing, setIsProcessing] = useState(false)
  
  // Checkout Form State
  const [formData, setFormData] = useState({
    buyer_name: '',
    buyer_email: '',
    buyer_whatsapp: ''
  })

  const handleCheckout = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedVariant || !tenantId) return

    setIsProcessing(true)
    try {
      const { data } = await api.post('/public/payment/create', {
        product_variant_id: selectedVariant.id,
        ...formData
      })

      if (window.snap) {
        window.snap.pay(data.snap_token, {
          onSuccess: (result: any) => {
            toast.success('Pembayaran Berhasil!')
            router.push(`/success?order_id=${result.order_id}&voucher=${data.voucher_code}`)
          },
          onPending: (result: any) => {
            toast.info('Menunggu Pembayaran...')
            router.push(`/success?order_id=${result.order_id}&voucher=${data.voucher_code}`)
          },
          onError: () => {
            toast.error('Pembayaran Gagal')
          },
          onClose: () => {
            toast.info('Pembayaran Dibatalkan')
          }
        })
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Terjadi kesalahan saat membuat pembayaran')
    } finally {
      setIsProcessing(false)
    }
  }

  if (productsLoading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-6">
        <Loader2 className="size-12 text-primary animate-spin" />
        <p className="text-gray-500 font-bold uppercase text-[10px] tracking-widest">Memuat Detail Produk...</p>
      </div>
    )
  }

  if (!product) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4 px-6 text-center">
        <h1 className="text-4xl font-black text-white uppercase tracking-tighter">Produk Tidak Ditemukan</h1>
        <p className="text-gray-500 max-w-md font-medium leading-relaxed">Maaf, layanan yang Anda cari tidak tersedia atau telah dihapus.</p>
        <button onClick={() => router.push('/product')} className="mt-6 px-8 py-3 bg-primary text-black font-black rounded-xl uppercase text-xs tracking-widest">Kembali ke Katalog</button>
      </div>
    )
  }

  return (
    <main className="min-h-screen flex flex-col pt-32 pb-20">
      <Navbar />

      <div className="container mx-auto max-w-6xl px-6 mb-32">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-start">
          {/* Left Side: Product Info & Selection */}
          <div className="space-y-10">
            <div>
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary/10 border border-primary/20 mb-6"
              >
                <Sparkles className="size-3 text-primary animate-pulse" />
                <span className="text-[10px] font-black tracking-[0.3em] text-primary uppercase">Layanan Terverifikasi</span>
              </motion.div>
              <motion.h1 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-5xl md:text-7xl font-black text-foreground mb-6 tracking-tight"
              >
                {product.name}
              </motion.h1>
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="text-foreground/60 text-base md:text-lg leading-relaxed max-w-lg space-y-2"
              >
                {selectedVariant?.description ? (
                  selectedVariant.description.split('\n').map((line, i) => (
                    <p key={i}>{line}</p>
                  ))
                ) : (
                  <p>
                    Nikmati akses premium tanpa batas dengan kualitas terbaik. 
                    Pilih paket yang paling sesuai dengan kebutuhan hiburan Anda.
                  </p>
                )}
              </motion.div>
            </div>

            <div className="space-y-4">
              <h3 className="text-white font-black uppercase tracking-widest text-xs mb-4">Pilih Varian Paket</h3>
              <div className="grid grid-cols-1 gap-4">
                {product.variants.map((variant, idx) => (
                  <motion.button
                    key={variant.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 + idx * 0.1 }}
                    onClick={() => setSelectedVariant(variant)}
                    className={`p-6 rounded-[28px] border transition-all duration-300 text-left flex justify-between items-center group ${
                      selectedVariant?.id === variant.id 
                      ? 'bg-primary/10 border-primary shadow-[0_0_30px_rgba(255,184,0,0.1)]' 
                      : 'bg-white/[0.02] border-white/5 hover:border-white/20'
                    }`}
                  >
                    <div>
                      <span className={`font-black text-xl block transition-colors ${selectedVariant?.id === variant.id ? 'text-primary' : 'text-white'}`}>
                        {variant.name}
                      </span>
                      <span className="text-xs text-gray-500 font-bold uppercase tracking-wider">
                        Durasi: {formatDuration(variant.duration)}
                      </span>
                    </div>
                    <div className="text-right">
                      <span className={`font-black text-2xl block transition-colors ${selectedVariant?.id === variant.id ? 'text-primary' : 'text-white'}`}>
                        {formatCurrency(variant.price)}
                      </span>
                    </div>
                  </motion.button>
                ))}
              </div>
            </div>

            <div className="pt-10 border-t border-white/5 grid grid-cols-2 gap-8">
              <div className="space-y-4">
                <div className="flex items-center gap-3 text-white font-black text-sm">
                  <ShieldCheck className="size-5 text-green-500" />
                  Legal 100%
                </div>
                <p className="text-xs text-gray-500 leading-relaxed">Semua akun kami berasal dari sumber resmi dan bergaransi penuh.</p>
              </div>
              <div className="space-y-4">
                <div className="flex items-center gap-3 text-white font-black text-sm">
                  <Zap className="size-5 text-primary" />
                  Instan Aktif
                </div>
                <p className="text-xs text-gray-500 leading-relaxed">Voucher dikirim otomatis sesaat setelah pembayaran Anda terverifikasi.</p>
              </div>
            </div>
          </div>

          {/* Right Side: Checkout Form */}
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="sticky top-40"
          >
            <div className="glass-card rounded-[40px] p-8 md:p-10 border-white/5 relative overflow-hidden">
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-gold" />
              
              <div className="flex items-center gap-4 mb-8">
                <div className="bg-primary/10 p-3 rounded-2xl">
                  <ShoppingBag className="size-6 text-primary" />
                </div>
                <h2 className="text-2xl font-black text-white uppercase tracking-tighter">Konfirmasi Pembelian</h2>
              </div>

              <form onSubmit={handleCheckout} className="space-y-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest ml-1">Nama Lengkap</label>
                  <div className="relative">
                    <input 
                      required
                      type="text"
                      className="w-full bg-white/[0.03] border border-white/10 rounded-2xl py-4 pl-4 pr-4 text-white focus:outline-none focus:border-primary/50 transition-all font-bold"
                      placeholder="Contoh: John Doe"
                      value={formData.buyer_name}
                      onChange={e => setFormData({...formData, buyer_name: e.target.value})}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest ml-1 flex items-center gap-1">
                      <Mail className="size-3" /> Email
                    </label>
                    <input 
                      required
                      type="email"
                      className="w-full bg-white/[0.03] border border-white/10 rounded-2xl py-4 px-4 text-white focus:outline-none focus:border-primary/50 transition-all font-bold text-sm"
                      placeholder="email@anda.com"
                      value={formData.buyer_email}
                      onChange={e => setFormData({...formData, buyer_email: e.target.value})}
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest ml-1 flex items-center gap-1">
                      <MessageSquare className="size-3" /> WhatsApp
                    </label>
                    <input 
                      required
                      type="tel"
                      className="w-full bg-white/[0.03] border border-white/10 rounded-2xl py-4 px-4 text-white focus:outline-none focus:border-primary/50 transition-all font-bold text-sm"
                      placeholder="0812xxxxxx"
                      value={formData.buyer_whatsapp}
                      onChange={e => setFormData({...formData, buyer_whatsapp: e.target.value})}
                    />
                  </div>
                </div>

                <div className="pt-6 border-t border-white/5 space-y-4">
                  <div className="flex justify-between items-center text-gray-400 text-sm font-medium">
                    <span>Layanan</span>
                    <span className="text-white font-black">{product.name}</span>
                  </div>
                  <div className="flex justify-between items-center text-gray-400 text-sm font-medium">
                    <span>Varian</span>
                    <span className="text-white font-black">{selectedVariant?.name || '-'}</span>
                  </div>
                  <div className="flex justify-between items-center pt-2">
                    <span className="text-white font-black uppercase tracking-widest text-xs">Total Pembayaran</span>
                    <span className="text-primary font-black text-3xl">
                      {selectedVariant ? formatCurrency(selectedVariant.price) : 'Rp 0'}
                    </span>
                  </div>
                </div>

                <button 
                  disabled={!selectedVariant || isProcessing}
                  type="submit"
                  className="w-full py-5 bg-gradient-gold text-black font-black rounded-2xl hover:scale-[1.02] active:scale-95 transition-all shadow-xl disabled:opacity-30 disabled:hover:scale-100 flex items-center justify-center gap-3 uppercase tracking-widest text-sm mt-8"
                >
                  {isProcessing ? (
                    <Loader2 className="size-5 animate-spin" />
                  ) : (
                    <>
                      Bayar Sekarang
                      <ArrowRight className="size-5" />
                    </>
                  )}
                </button>
                <p className="text-[9px] text-gray-600 text-center font-bold uppercase tracking-widest">
                  Pembayaran aman via Midtrans
                </p>
              </form>
            </div>
          </motion.div>
        </div>
      </div>

      <Footer />
    </main>
  )
}
