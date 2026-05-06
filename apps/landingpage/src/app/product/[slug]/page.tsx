'use client'

import { useState, use } from 'react'
import { motion } from 'framer-motion'
import { ArrowLeft, Zap, ArrowRight, Loader2, Sparkles, ShieldCheck, MessageSquare } from 'lucide-react'
import { useProducts, Product, ProductVariant } from '@/hooks/use-products'
import { useTenant } from '@/hooks/use-tenant'
import { formatCurrency, formatDuration } from '@/lib/format'
import { Navbar } from '@/components/navbar'
import { Footer } from '@/components/footer'
import { CheckoutModal } from '@/components/checkout-modal'
import { api } from '@/lib/api'
import { toast } from 'sonner'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

declare global {
  interface Window {
    loadJokulCheckout: (url: string) => void;
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
  const [isCheckoutModalOpen, setIsCheckoutModalOpen] = useState(false)
  const [isVariantShaking, setIsVariantShaking] = useState(false)

  const handleContinueCheckout = () => {
    if (!selectedVariant) {
      setIsVariantShaking(true)
      toast.error('Silahkan pilih varian produk terlebih dahulu', {
        position: 'top-center',
        className: 'font-bold uppercase text-[10px] tracking-widest'
      })
      setTimeout(() => setIsVariantShaking(false), 500)
      return
    }
    setIsCheckoutModalOpen(true)
  }

  const shakeAnimation = {
    x: [0, -10, 10, -10, 10, 0],
    transition: { duration: 0.4 }
  }

  if (productsLoading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-6 bg-white">
        <Loader2 className="size-12 text-[#f97316] animate-spin" />
        <p className="text-slate-400 font-bold uppercase text-[10px] tracking-widest">Memuat Detail Produk...</p>
      </div>
    )
  }

  if (!product) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4 px-6 text-center bg-white">
        <h1 className="text-4xl font-black text-[#0f172a] uppercase tracking-tighter">Produk Tidak Ditemukan</h1>
        <p className="text-slate-500 max-w-md font-medium leading-relaxed">Maaf, layanan yang Anda cari tidak tersedia atau telah dihapus.</p>
        <Link href="/product" className="mt-6 px-8 py-4 bg-[#0f172a] text-white font-black rounded-2xl uppercase text-xs tracking-widest">Kembali ke Katalog</Link>
      </div>
    )
  }

  return (
    <main className="min-h-screen flex flex-col bg-white">
      <Navbar />

      <div className="container mx-auto max-w-7xl px-6 pt-40 pb-32">
        {/* Back Button */}
        <Link href="/product" className="inline-flex items-center gap-2 text-slate-400 hover:text-[#f97316] font-bold text-sm mb-12 transition-colors group">
          <ArrowLeft className="size-4 group-hover:-translate-x-1 transition-transform" />
          Kembali ke Katalog
        </Link>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-20 items-start">
          {/* Left Side: Product Info & Selection */}
          <div className="space-y-12">
            <div>
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-orange-50 border border-orange-100 mb-6"
              >
                <Sparkles className="size-3 text-[#f97316]" />
                <span className="text-[10px] font-black tracking-[0.2em] text-[#f97316] uppercase">Layanan Terverifikasi</span>
              </motion.div>
              <motion.h1 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-6xl md:text-8xl font-black text-[#0f172a] mb-8 tracking-tighter leading-[0.9]"
              >
                {product.name}
              </motion.h1>
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="text-slate-500 text-lg leading-relaxed max-w-xl font-medium"
              >
                {selectedVariant?.description ? (
                  selectedVariant.description.split('\n').map((line, i) => (
                    <p key={i} className="mb-2">{line}</p>
                  ))
                ) : (
                  <p>
                    Nikmati akses premium tanpa batas dengan kualitas terbaik dari {product.name}. 
                    Pilih paket yang paling sesuai dengan kebutuhan hiburan Anda.
                  </p>
                )}
              </motion.div>
            </div>

            <motion.div 
              animate={isVariantShaking ? shakeAnimation : {}}
              className="space-y-6"
            >
              <h3 className="text-[#0f172a] font-black uppercase tracking-widest text-xs">Pilih Varian Paket</h3>
              <div className="grid grid-cols-1 gap-4">
                {product.variants.map((variant, idx) => (
                  <motion.button
                    key={variant.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 + idx * 0.1 }}
                    onClick={() => setSelectedVariant(variant)}
                    className={`p-6 md:p-8 rounded-2xl border transition-all duration-500 text-left flex justify-between items-center group relative overflow-hidden ${
                      selectedVariant?.id === variant.id 
                      ? 'bg-white border-[#f97316] shadow-[0_20px_40px_rgba(249,115,22,0.15)] ring-1 ring-[#f97316]' 
                      : 'bg-slate-50 border-slate-100 hover:border-slate-200'
                    }`}
                  >
                    <div className="relative z-10">
                      <span className={`font-black text-2xl block transition-colors mb-1 ${selectedVariant?.id === variant.id ? 'text-[#f97316]' : 'text-[#0f172a]'}`}>
                        {variant.name}
                      </span>
                      <span className="text-xs text-slate-400 font-bold uppercase tracking-widest">
                        Durasi: {formatDuration(variant.duration)}
                      </span>
                    </div>
                    <div className="text-right relative z-10 flex flex-col items-end">
                      {variant.strike_price && (
                        <span className="text-[10px] text-slate-400 line-through font-bold mb-0.5">
                          {formatCurrency(variant.strike_price)}
                        </span>
                      )}
                      <span className={`font-black text-2xl md:text-3xl block transition-colors ${selectedVariant?.id === variant.id ? 'text-[#0f172a]' : 'text-[#0f172a]'}`}>
                        {formatCurrency(variant.price)}
                      </span>
                    </div>
                  </motion.button>
                ))}
              </div>
            </motion.div>

            </div>

          {/* Right Side: CTA Button and Visual */}
          <div className="lg:sticky lg:top-40 space-y-8">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="hidden lg:block bg-slate-900 rounded-[48px] p-12 text-white relative overflow-hidden"
            >
              <div className="absolute top-0 right-0 w-64 h-64 bg-orange-500/10 blur-[100px] -translate-y-1/2 translate-x-1/2" />
              
              <div className="relative z-10">
                <h2 className="text-3xl md:text-4xl font-black mb-6 uppercase tracking-tighter leading-tight">Siap Untuk Berlangganan?</h2>
                <p className="text-slate-400 font-medium mb-10 leading-relaxed">Pilih varian paket yang Anda inginkan dan nikmati layanan premium secara instan tanpa ribet.</p>
                
                <button 
                  onClick={handleContinueCheckout}
                  className="w-full py-6 bg-gradient-to-r from-[#f97316] to-[#ef4444] text-white font-black rounded-[24px] hover:scale-[1.02] active:scale-95 transition-all shadow-2xl shadow-orange-500/20 flex items-center justify-center gap-3 uppercase tracking-widest text-sm"
                >
                  Lanjutkan ke Pembayaran
                  <ArrowRight className="size-5" />
                </button>
                
                <div className="mt-8 flex items-center justify-center gap-6">
                  <div className="flex -space-x-3">
                    {[1,2,3,4].map(i => (
                      <div key={i} className="size-8 rounded-full border-2 border-slate-900 bg-slate-800" />
                    ))}
                  </div>
                  <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">
                    <span className="text-white">1000+</span> Pengguna Aktif
                  </p>
                </div>
              </div>
            </motion.div>

            {/* Trust Badges Individual Cards */}
            <div className="p-8 border border-slate-100 rounded-2xl flex gap-6 items-center group hover:border-emerald-100 transition-colors h-full">
              <div className="bg-emerald-50 p-4 rounded-2xl group-hover:bg-emerald-100 transition-colors shrink-0">
                <ShieldCheck className="size-6 text-emerald-500" />
              </div>
              <div>
                <h4 className="font-black text-[#0f172a] uppercase tracking-wider text-xs mb-1">Legal 100%</h4>
                <p className="text-xs text-slate-400 font-medium leading-relaxed">Semua akun kami berasal dari sumber resmi dan bergaransi penuh.</p>
              </div>
            </div>

            <div className="p-8 border border-slate-100 rounded-2xl flex gap-6 items-center group hover:border-orange-100 transition-colors h-full">
              <div className="bg-orange-50 p-4 rounded-2xl group-hover:bg-orange-100 transition-colors shrink-0">
                <Zap className="size-6 text-[#f97316]" />
              </div>
              <div>
                <h4 className="font-black text-[#0f172a] uppercase tracking-wider text-xs mb-1">Instan Aktif</h4>
                <p className="text-xs text-slate-400 font-medium leading-relaxed">Voucher dikirim otomatis sesaat setelah pembayaran Anda terverifikasi.</p>
              </div>
            </div>

            {/* Support Info */}
            <div className="p-8 border border-slate-100 rounded-2xl flex gap-6 items-center group hover:border-orange-100 transition-colors h-full">
              <div className="bg-orange-50 p-4 rounded-2xl group-hover:bg-orange-100 transition-colors shrink-0">
                <MessageSquare className="size-6 text-[#f97316]" />
              </div>
              <div>
                <h4 className="font-black text-[#0f172a] uppercase tracking-wider text-xs mb-1">Butuh Bantuan?</h4>
                <p className="text-xs text-slate-400 font-medium leading-relaxed">Tim support kami siap membantu Anda 24/7 via WhatsApp.</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile Fixed CTA - Moved outside for absolute viewport positioning */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 px-6 py-4 bg-white border-t border-slate-100 z-[100] shadow-[0_-20px_40px_rgba(0,0,0,0.05)]">
        <button 
          onClick={handleContinueCheckout}
          className="w-full py-5 bg-gradient-to-r from-[#f97316] to-[#ef4444] text-white font-black rounded-2xl active:scale-95 transition-all shadow-xl shadow-orange-500/20 flex items-center justify-center gap-3 uppercase tracking-widest text-sm"
        >
          Lanjutkan Pembayaran
          <ArrowRight className="size-5" />
        </button>
      </div>

      <CheckoutModal 
        isOpen={isCheckoutModalOpen}
        onClose={() => setIsCheckoutModalOpen(false)}
        product={product}
        variant={selectedVariant}
      />

      <Footer />
    </main>
  )
}

