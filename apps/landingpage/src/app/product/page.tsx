'use client'

import { motion } from 'framer-motion'
import { Package, Zap, ArrowRight, Search, Loader2, Sparkles, ShieldCheck } from 'lucide-react'
import { useProducts } from '@/hooks/use-products'
import { useTenant } from '@/hooks/use-tenant'
import { formatCurrency } from '@/lib/format'
import { Navbar } from '@/components/navbar'
import { Footer } from '@/components/footer'
import Link from 'next/link'
import { useState } from 'react'

export default function ProductPage() {
  const { tenantId } = useTenant()
  const { data: products, isLoading } = useProducts(tenantId)
  const [search, setSearch] = useState('')

  const filteredProducts = products?.filter(p => 
    p.name.toLowerCase().includes(search.toLowerCase())
  ) || []

  return (
    <main className="min-h-screen flex flex-col pt-40 pb-0 bg-slate-50">
      <Navbar />

      <div className="flex-grow container mx-auto max-w-7xl px-6 mb-32">
        <div className="text-center mb-20">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-orange-50 border border-orange-100 mb-6 shadow-sm"
          >
            <ShieldCheck className="size-4 text-[#f97316]" />
            <span className="text-[10px] font-black tracking-widest uppercase text-[#f97316]">Katalog Layanan Resmi</span>
          </motion.div>
          <h1 className="text-4xl md:text-7xl font-black mb-6 text-[#0f172a] tracking-tight">Semua <span className="bg-clip-text text-transparent bg-gradient-to-br from-[#f97316] to-[#ef4444]">Paket Premium.</span></h1>
          <p className="text-slate-500 text-lg max-w-2xl mx-auto font-medium">Temukan berbagai pilihan layanan hiburan terbaik dengan harga yang transparan dan proses instan.</p>
        </div>

        {/* Search Bar - Pill Style */}
        <div className="max-w-2xl mx-auto mb-20 relative z-20">
          <div className="relative group">
            <div className="absolute inset-0 bg-gradient-to-r from-[#f97316]/20 to-[#ef4444]/20 blur-2xl group-focus-within:opacity-100 opacity-0 transition-all duration-500" />
            <div className="relative flex items-center bg-white border border-slate-200 rounded-full p-2 shadow-xl focus-within:border-[#f97316] transition-all">
              <div className="pl-6 pr-4">
                <Search className="size-6 text-slate-400" />
              </div>
              <input 
                type="text"
                placeholder="Cari Produk"
                className="w-full bg-transparent border-none py-4 text-xl font-bold text-[#0f172a] focus:outline-none placeholder:text-slate-300"
                value={search}
                onChange={e => setSearch(e.target.value)}
              />
              <div className="hidden md:block pr-6">
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest bg-slate-50 px-3 py-1.5 rounded-full border border-slate-100">Search</span>
              </div>
            </div>
          </div>
        </div>

        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-20 gap-4">
            <div className="relative size-16">
              <div className="absolute inset-0 border-4 border-orange-100 rounded-full" />
              <div className="absolute inset-0 border-4 border-[#f97316] border-t-transparent rounded-full animate-spin" />
            </div>
            <p className="text-slate-500 font-bold uppercase text-[10px] tracking-[0.3em]">Menyiapkan Katalog...</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
            {filteredProducts.map((product, idx) => (
              <motion.div
                key={product.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.05 }}
                className="bg-white rounded-[40px] p-8 md:p-10 border border-slate-100 shadow-sm hover:shadow-2xl hover:shadow-orange-500/5 transition-all duration-500 hover:-translate-y-4 flex flex-col group relative overflow-hidden"
              >
                {/* Subtle Hover Pattern */}
                <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-0 group-hover:opacity-[0.02] transition-opacity pointer-events-none" />

                <div className="flex items-center justify-between mb-8 relative z-10">
                  <div className="bg-orange-50 p-4 rounded-[24px] border border-orange-100 group-hover:scale-110 group-hover:rotate-6 transition-all duration-500">
                    <Package className="size-6 text-[#f97316]" />
                  </div>
                  {idx < 3 && (
                    <div className="bg-emerald-50 px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest text-emerald-600 border border-emerald-100 shadow-sm">
                      Best Seller
                    </div>
                  )}
                </div>

                <div className="mb-10 relative z-10">
                  <h3 className="text-3xl font-black text-[#0f172a] group-hover:text-[#f97316] transition-colors tracking-tight">{product.name}</h3>
                  <div className="flex items-center gap-1.5 mt-2">
                    <Zap className="size-4 text-[#f97316] fill-[#f97316]" />
                    <span className="text-[11px] text-slate-400 font-bold uppercase tracking-widest">Premium Service</span>
                  </div>
                </div>

                <div className="space-y-4 flex-grow mb-10 relative z-10">
                  {product.variants.map((variant) => (
                    <div 
                      key={variant.id}
                      className="p-5 rounded-3xl bg-slate-50 border border-slate-100 flex justify-between items-center group/item hover:bg-orange-50 hover:border-orange-200 transition-all"
                    >
                      <span className="font-black text-[#0f172a] text-base group-hover/item:text-[#f97316] transition-colors">{variant.name}</span>
                      <div className="text-right">
                        {variant.strike_price && (
                          <span className="text-[10px] text-slate-400 line-through block -mb-1">
                            {formatCurrency(variant.strike_price)}
                          </span>
                        )}
                        <span className="text-[#f97316] font-black text-base">{formatCurrency(variant.price)}</span>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="pt-8 border-t border-slate-100 relative z-10">
                  <Link 
                    href={`/product/${product.slug}`}
                    className="w-full py-5 bg-[#0f172a] text-white rounded-2xl text-[11px] font-black uppercase tracking-[0.2em] hover:bg-gradient-to-br hover:from-[#f97316] hover:to-[#ef4444] transition-all flex items-center justify-center gap-3 shadow-lg"
                  >
                    Mulai Berlangganan
                    <ArrowRight className="size-4" />
                  </Link>
                </div>
              </motion.div>
            ))}
          </div>
        )}

        {!isLoading && filteredProducts.length === 0 && (
          <div className="text-center py-32 bg-slate-50 rounded-[40px] border border-dashed border-slate-200">
            <Package className="size-16 text-slate-200 mx-auto mb-6" />
            <p className="text-slate-400 font-black uppercase tracking-widest text-sm">Produk tidak ditemukan</p>
          </div>
        )}
      </div>

      <Footer />
    </main>
  )
}
