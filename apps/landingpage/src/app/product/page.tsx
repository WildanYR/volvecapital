'use client'

import { motion } from 'framer-motion'
import { Package, Zap, ArrowRight, Search, Loader2, Sparkles } from 'lucide-react'
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
    <main className="min-h-screen flex flex-col pt-32 pb-20">
      <Navbar />

      <div className="container mx-auto max-w-6xl px-6">
        <div className="text-center mb-16">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary/10 border border-primary/20 mb-6"
          >
            <Sparkles className="size-3 text-primary animate-pulse" />
            <span className="text-[10px] font-black tracking-[0.3em] text-primary uppercase">Katalog Layanan</span>
          </motion.div>
          <h1 className="text-4xl md:text-6xl font-black mb-6 text-white tracking-tight">Semua <span className="text-primary">Paket Premium.</span></h1>
          <p className="text-gray-400 text-lg max-w-2xl mx-auto">Temukan berbagai pilihan layanan hiburan terbaik dengan harga yang transparan dan proses instan.</p>
        </div>

        {/* Search Bar */}
        <div className="max-w-xl mx-auto mb-16">
          <div className="relative">
            <Search className="absolute left-6 top-1/2 -translate-y-1/2 size-5 text-gray-500" />
            <input 
              type="text"
              placeholder="Cari layanan (Netflix, Spotify...)"
              className="w-full bg-white/[0.03] border border-white/10 rounded-2xl pl-16 pr-6 py-4 text-white focus:outline-none focus:border-primary/50 transition-all"
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>
        </div>

        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-20 gap-4">
            <Loader2 className="size-10 text-primary animate-spin" />
            <p className="text-gray-500 font-bold uppercase text-[10px] tracking-widest">Memuat Katalog...</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {filteredProducts.map((product, idx) => (
              <motion.div
                key={product.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.05 }}
                className="glass-card rounded-[32px] p-8 hover:border-primary/30 transition-all duration-500 flex flex-col group"
              >
                <div className="flex items-center justify-between mb-8">
                  <div className="bg-primary/10 p-3 rounded-2xl border border-primary/20 group-hover:scale-110 transition-transform duration-500">
                    <Package className="size-6 text-primary" />
                  </div>
                  {idx < 3 && (
                    <div className="bg-primary/10 px-3 py-1 rounded-full text-[8px] font-black uppercase tracking-widest text-primary border border-primary/20">
                      Popular
                    </div>
                  )}
                </div>

                <div className="mb-8">
                  <h3 className="text-2xl font-black text-white group-hover:text-primary transition-colors">{product.name}</h3>
                  <div className="flex items-center gap-1.5 mt-1">
                    <Zap className="size-3 text-primary fill-primary" />
                    <span className="text-[10px] text-gray-500 font-black uppercase tracking-widest">Premium Access</span>
                  </div>
                </div>

                <div className="space-y-3 flex-grow mb-8">
                  {product.variants.map((variant) => (
                    <div 
                      key={variant.id}
                      className="p-4 rounded-2xl bg-white/[0.02] border border-white/5 flex justify-between items-center"
                    >
                      <span className="font-black text-white text-sm">{variant.name}</span>
                      <span className="text-primary font-black text-sm">{formatCurrency(variant.price)}</span>
                    </div>
                  ))}
                </div>

                <Link 
                  href={`/product/${product.slug}`}
                  className="w-full py-4 bg-white/5 text-white rounded-2xl text-xs font-black uppercase tracking-widest hover:bg-primary hover:text-black transition-all flex items-center justify-center gap-3 shadow-lg group-hover:bg-primary group-hover:text-black"
                >
                  Lihat Detail
                  <ArrowRight className="size-4" />
                </Link>
              </motion.div>
            ))}
          </div>
        )}

        {!isLoading && filteredProducts.length === 0 && (
          <div className="text-center py-20">
            <p className="text-gray-500 font-bold uppercase tracking-widest">Tidak ada produk yang ditemukan.</p>
          </div>
        )}
      </div>

      <Footer />
    </main>
  )
}
