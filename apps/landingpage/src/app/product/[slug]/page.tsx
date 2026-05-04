'use client'

import { useState, use } from 'react'
import { motion } from 'framer-motion'
import { ArrowLeft, Zap, ArrowRight, Loader2, Sparkles, ShoppingBag, ShieldCheck, Mail, MessageSquare, User } from 'lucide-react'
import { useProducts, Product, ProductVariant } from '@/hooks/use-products'
import { useTenant } from '@/hooks/use-tenant'
import { formatCurrency, formatDuration } from '@/lib/format'
import { Navbar } from '@/components/navbar'
import { Footer } from '@/components/footer'
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
      toast.error(error.response?.data?.message || 'Terjadi kesalahan saat membuat pembayaran')
    } finally {
      setIsProcessing(false)
    }
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

            <div className="space-y-6">
              <h3 className="text-[#0f172a] font-black uppercase tracking-widest text-xs">Pilih Varian Paket</h3>
              <div className="grid grid-cols-1 gap-4">
                {product.variants.map((variant, idx) => (
                  <motion.button
                    key={variant.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 + idx * 0.1 }}
                    onClick={() => setSelectedVariant(variant)}
                    className={`p-6 md:p-8 rounded-[32px] border transition-all duration-500 text-left flex justify-between items-center group relative overflow-hidden ${
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
            </div>

            {/* Trust Badges */}
            <div className="pt-12 border-t border-slate-100 grid grid-cols-2 gap-10">
              <div className="space-y-4">
                <div className="flex items-center gap-3 text-[#0f172a] font-black text-sm uppercase tracking-wider">
                  <div className="bg-emerald-50 p-2 rounded-xl">
                    <ShieldCheck className="size-5 text-emerald-500" />
                  </div>
                  Legal 100%
                </div>
                <p className="text-xs text-slate-400 leading-relaxed font-medium">Semua akun kami berasal dari sumber resmi dan bergaransi penuh.</p>
              </div>
              <div className="space-y-4">
                <div className="flex items-center gap-3 text-[#0f172a] font-black text-sm uppercase tracking-wider">
                  <div className="bg-orange-50 p-2 rounded-xl">
                    <Zap className="size-5 text-[#f97316]" />
                  </div>
                  Instan Aktif
                </div>
                <p className="text-xs text-slate-400 leading-relaxed font-medium">Voucher dikirim otomatis sesaat setelah pembayaran Anda terverifikasi.</p>
              </div>
            </div>
          </div>

          {/* Right Side: Checkout Form */}
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="sticky top-40"
          >
            <div className="bg-white rounded-[48px] p-8 md:p-12 border border-slate-100 shadow-[0_30px_60px_rgba(15,23,42,0.08)] relative overflow-hidden">
              <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-[#f97316] to-[#ef4444]" />
              
              <div className="flex items-center gap-4 mb-10">
                <div className="bg-[#0f172a] p-4 rounded-2xl">
                  <ShoppingBag className="size-6 text-white" />
                </div>
                <h2 className="text-2xl font-black text-[#0f172a] uppercase tracking-tighter">Konfirmasi Pembelian</h2>
              </div>

              <form onSubmit={handleCheckout} className="space-y-6">
                <div className="space-y-2">
                  <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest ml-1 flex items-center gap-2">
                    <User className="size-3" /> Nama Lengkap
                  </label>
                  <input 
                    required
                    type="text"
                    className="w-full bg-slate-50 border border-slate-100 rounded-2xl py-5 px-6 text-[#0f172a] focus:outline-none focus:border-[#f97316] focus:bg-white focus:ring-4 focus:ring-orange-500/5 transition-all font-bold placeholder:text-slate-300"
                    placeholder="Masukkan nama lengkap"
                    value={formData.buyer_name}
                    onChange={e => setFormData({...formData, buyer_name: e.target.value})}
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest ml-1 flex items-center gap-2">
                    <Mail className="size-3" /> Email Pengiriman
                  </label>
                  <input 
                    required
                    type="email"
                    className="w-full bg-slate-50 border border-slate-100 rounded-2xl py-5 px-6 text-[#0f172a] focus:outline-none focus:border-[#f97316] focus:bg-white focus:ring-4 focus:ring-orange-500/5 transition-all font-bold placeholder:text-slate-300"
                    placeholder="email@anda.com"
                    value={formData.buyer_email}
                    onChange={e => setFormData({...formData, buyer_email: e.target.value})}
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest ml-1 flex items-center gap-2">
                    <MessageSquare className="size-3" /> No. WhatsApp
                  </label>
                  <input 
                    required
                    type="tel"
                    className="w-full bg-slate-50 border border-slate-100 rounded-2xl py-5 px-6 text-[#0f172a] focus:outline-none focus:border-[#f97316] focus:bg-white focus:ring-4 focus:ring-orange-500/5 transition-all font-bold placeholder:text-slate-300"
                    placeholder="08123456xxxx"
                    value={formData.buyer_whatsapp}
                    onChange={e => setFormData({...formData, buyer_whatsapp: e.target.value})}
                  />
                </div>

                <div className="pt-8 border-t border-slate-50 space-y-4 mt-8">
                  <div className="flex justify-between items-center text-slate-500 text-sm font-bold uppercase tracking-wide">
                    <span>Layanan</span>
                    <span className="text-[#0f172a] font-black">{product.name}</span>
                  </div>
                  <div className="flex justify-between items-center text-slate-500 text-sm font-bold uppercase tracking-wide">
                    <span>Varian</span>
                    <span className="text-[#0f172a] font-black">{selectedVariant?.name || 'Belum dipilih'}</span>
                  </div>
                  <div className="flex justify-between items-center pt-4 border-t border-slate-50 mt-4">
                    <span className="text-[#0f172a] font-black uppercase tracking-widest text-xs">Total Bayar</span>
                    <div className="text-right">
                      {selectedVariant?.strike_price && (
                        <span className="text-xs text-slate-400 line-through font-bold block -mb-1">
                          {formatCurrency(selectedVariant.strike_price)}
                        </span>
                      )}
                      <span className="text-[#f97316] font-black text-4xl">
                        {selectedVariant ? formatCurrency(selectedVariant.price) : 'Rp 0'}
                      </span>
                    </div>
                  </div>
                </div>

                <button 
                  disabled={!selectedVariant || isProcessing}
                  type="submit"
                  className="w-full py-6 bg-gradient-to-r from-[#f97316] to-[#ef4444] text-white font-black rounded-[24px] hover:scale-[1.02] active:scale-95 transition-all shadow-2xl shadow-orange-500/20 disabled:opacity-30 disabled:hover:scale-100 flex items-center justify-center gap-3 uppercase tracking-widest text-sm mt-10"
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
                <p className="text-[10px] text-slate-300 text-center font-bold uppercase tracking-widest pt-4">
                  Pembayaran Aman & Instan via DOKU QRIS
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
