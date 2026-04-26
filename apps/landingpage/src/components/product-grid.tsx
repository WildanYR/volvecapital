'use client'

import { motion } from 'framer-motion'
import { Check, Package, ShoppingCart, Zap, ArrowRight } from 'lucide-react'
import { Product, ProductVariant } from '@/hooks/use-products'
import { formatDuration, formatCurrency } from '@/lib/format'
import Link from 'next/link'

interface ProductGridProps {
  products: Product[]
  onSelectVariant: (variant: ProductVariant, product: Product) => void
}

export function ProductGrid({ products, onSelectVariant }: ProductGridProps) {
  // Filter for popular products or take first 3
  const popularProducts = products.slice(0, 3)

  return (
    <section id="products" className="py-32 px-6 w-full flex justify-center z-10">
      <div className="w-full max-w-7xl md:px-12">
        <div className="text-center mb-24">
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            className="text-primary font-black tracking-[0.3em] uppercase text-[10px] mb-4"
          >
            Pilihan Terpopuler
          </motion.div>
          <h2 className="text-4xl md:text-6xl font-black mb-6 text-white tracking-tight">Paket <span className="text-primary">Unggulan Kami.</span></h2>
          <p className="text-gray-500 text-lg max-w-2xl mx-auto">
            Dapatkan akses instan ke layanan premium terbaik dengan harga yang paling kompetitif di pasar.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {popularProducts.map((product, idx) => (
            <motion.div
              key={product.id}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.1 }}
              viewport={{ once: true }}
              className="group glass-card rounded-[32px] p-8 hover:border-primary/30 transition-all duration-500 flex flex-col h-full"
            >
              <div className="flex items-center justify-between mb-8">
                <div className="bg-primary/10 p-3 rounded-2xl border border-primary/20 group-hover:scale-110 transition-transform duration-500">
                  <Package className="size-6 text-primary" />
                </div>
                <div className="bg-white/5 px-3 py-1 rounded-full text-[8px] font-black uppercase tracking-widest text-gray-400 border border-white/5">
                  Top Selling
                </div>
              </div>

              <div className="mb-8">
                <h3 className="text-3xl font-black text-white group-hover:text-primary transition-colors">{product.name}</h3>
                <div className="flex items-center gap-1.5 mt-1">
                  <Zap className="size-3 text-primary fill-primary" />
                  <span className="text-[10px] text-gray-500 font-black uppercase tracking-widest">Premium Guaranteed</span>
                </div>
              </div>

              <div className="space-y-3 flex-grow mb-8">
                {product.variants.slice(0, 2).map((variant) => (
                  <div 
                    key={variant.id}
                    className="p-4 rounded-2xl bg-white/[0.02] border border-white/5 hover:bg-white/[0.05] hover:border-white/20 transition-all group/item flex justify-between items-center"
                  >
                    <div>
                      <span className="font-black text-white text-sm block">{variant.name}</span>
                      <span className="text-[10px] text-gray-500 font-bold uppercase tracking-wider">
                        {formatDuration(variant.duration)}
                      </span>
                    </div>
                    <div className="text-right">
                      <span className="text-primary font-black text-base block">
                        {formatCurrency(variant.price)}
                      </span>
                    </div>
                  </div>
                ))}
              </div>

              <div className="pt-8 border-t border-white/5 mt-auto">
                <Link 
                  href={`/product/${product.slug}`}
                  className="w-full py-4 bg-white/5 text-white rounded-2xl text-xs font-black uppercase tracking-widest hover:bg-primary hover:text-black transition-all flex items-center justify-center gap-3 shadow-lg"
                >
                  Pilih Paket
                  <ArrowRight className="size-4" />
                </Link>
              </div>
            </motion.div>
          ))}
        </div>

        <motion.div 
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          className="mt-20 text-center"
        >
          <Link 
            href="/product"
            className="inline-flex items-center gap-3 px-10 py-5 glass border-white/10 text-white font-black rounded-2xl hover:bg-primary hover:text-black transition-all flex items-center justify-center gap-3 shadow-lg"
          >
            Lihat Semua Layanan
            <ArrowRight className="size-4" />
          </Link>
        </motion.div>
      </div>
    </section>
  )
}
