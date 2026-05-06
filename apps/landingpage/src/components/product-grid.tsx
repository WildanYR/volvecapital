'use client'

import { motion } from 'framer-motion'
import { Package, Zap, ArrowRight, ShieldCheck } from 'lucide-react'
import { Product } from '@/hooks/use-products'
import { formatDuration, formatCurrency } from '@/lib/format'
import Link from 'next/link'

interface ProductGridProps {
  products: Product[]
  onSelectVariant: (variant: any, product: Product) => void
}

export function ProductGrid({ products }: ProductGridProps) {
  const popularProducts = products.slice(0, 3)

  return (
    <section id="products" className="py-32 px-6 w-full flex justify-center bg-slate-50/50">
      <div className="w-full max-w-7xl">
        <div className="text-center mb-24">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            whileInView={{ opacity: 1, scale: 1 }}
            className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white border border-slate-200 mb-6 shadow-sm"
          >
            <ShieldCheck className="size-4 text-[#f97316]" />
            <span className="text-[10px] font-black tracking-widest uppercase text-slate-500">Katalog Terpercaya</span>
          </motion.div>
          <h2 className="text-4xl md:text-6xl font-black mb-6 text-[#0f172a] tracking-tight">
            Pilih Paket{' '}
            <span className="bg-clip-text text-transparent bg-gradient-to-br from-[#f97316] to-[#ef4444]">
              Favoritmu.
            </span>
          </h2>
          <p className="text-slate-500 text-lg max-w-2xl mx-auto font-medium">
            Layanan streaming premium dengan proses aktivasi tercepat dan garansi penuh.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {popularProducts.map((product, idx) => {
            const isFeatured = idx === 1; 
            return (
              <motion.div
                key={product.id}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.1 }}
                viewport={{ once: true }}
                className={`group p-8 rounded-3xl flex flex-col h-full relative border transition-all duration-500 hover:-translate-y-4 ${
                  isFeatured 
                  ? 'bg-[#0f172a] border-[#0f172a] shadow-2xl scale-105 z-20 hover:scale-[1.08]' 
                  : 'bg-white border-slate-100 shadow-sm hover:shadow-2xl'
                }`}
              >
                {isFeatured && (
                  <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-gradient-to-r from-[#f97316] to-[#ef4444] text-white text-[10px] font-black px-4 py-1.5 rounded-full uppercase tracking-widest shadow-lg">
                    Best Value
                  </div>
                )}

                <div className="flex items-center justify-between mb-8">
                  <div className={`p-3 rounded-2xl ${
                    isFeatured ? 'bg-white/10 text-white' : 'bg-orange-50 text-[#f97316]'
                  }`}>
                    <Package className="size-6" />
                  </div>
                  <div className={`px-3 py-1 rounded-full text-[8px] font-black uppercase tracking-widest ${
                    isFeatured ? 'bg-white/10 text-slate-400' : 'bg-slate-50 text-slate-400 border border-slate-100'
                  }`}>
                    {product.slug.toUpperCase()}
                  </div>
                </div>

                <div className="mb-8">
                  <h3 className={`text-3xl font-black group-hover:text-[#f97316] transition-colors ${
                    isFeatured ? 'text-white' : 'text-[#0f172a]'
                  }`}>
                    {product.name}
                  </h3>
                  <div className="flex items-center gap-1.5 mt-1">
                    <Zap className="size-3 text-[#f97316] fill-[#f97316]" />
                    <span className="text-[10px] text-slate-400 font-black uppercase tracking-widest">Aktivasi Instan</span>
                  </div>
                </div>

                <div className="space-y-3 flex-grow mb-10">
                  {product.variants.slice(0, 2).map((variant) => (
                    <div 
                      key={variant.id}
                      className={`p-4 rounded-2xl border transition-all flex justify-between items-center ${
                        isFeatured 
                        ? 'bg-white/5 border-white/10 hover:bg-white/10' 
                        : 'bg-slate-50 border-slate-100 hover:border-orange-200'
                      }`}
                    >
                      <div>
                        <span className={`font-black text-sm block ${isFeatured ? 'text-white' : 'text-[#0f172a]'}`}>
                          {variant.name}
                        </span>
                        <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                          {formatDuration(variant.duration)}
                        </span>
                      </div>
                      <div className="text-right">
                        {variant.strike_price && (
                          <span className="text-[10px] text-slate-400 line-through block mb-0.5">
                            {formatCurrency(variant.strike_price)}
                          </span>
                        )}
                        <span className="text-[#f97316] font-black text-lg block">
                          {formatCurrency(variant.price)}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>

                <div className={`pt-8 border-t mt-auto ${isFeatured ? 'border-white/10' : 'border-slate-100'}`}>
                  <Link 
                    href={`/product/${product.slug}`}
                    className={`w-full py-4 rounded-2xl text-xs font-black uppercase tracking-widest transition-all flex items-center justify-center gap-3 shadow-md ${
                      isFeatured 
                      ? 'bg-white text-[#0f172a] hover:bg-[#f97316] hover:text-white' 
                      : 'bg-[#0f172a] text-white hover:bg-gradient-to-br hover:from-[#f97316] hover:to-[#ef4444]'
                    }`}
                  >
                    Beli Sekarang
                    <ArrowRight className="size-4" />
                  </Link>
                </div>
              </motion.div>
            )
          })}
        </div>

        <div className="mt-20 text-center">
          <Link 
            href="/product"
            className="inline-flex items-center gap-3 px-10 py-5 bg-white border border-slate-200 text-[#0f172a] font-bold rounded-2xl hover:border-[#f97316] transition-all shadow-sm"
          >
            Eksplor Semua Produk
            <ArrowRight className="size-4" />
          </Link>
        </div>
      </div>
    </section>
  )
}
