'use client'

import { Package, Zap, ArrowRight, ShieldCheck } from 'lucide-react'
import { Product } from '@/hooks/use-products'
import { formatDuration, formatCurrency } from '@/lib/format'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { useScrollReveal } from '@/hooks/use-scroll-reveal'

interface ProductGridProps {
  products: Product[]
  onSelectVariant: (variant: any, product: Product) => void
}

export function ProductGrid({ products }: ProductGridProps) {
  const popularProducts = products.slice(0, 3)

  const ref = useScrollReveal()

  return (
    <section id="products" className="py-32 px-6 w-full flex justify-center bg-muted/50">
      <div ref={ref} className="w-full max-w-7xl">
        <div className="text-center mb-24">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-background border border-border mb-6 shadow-sm reveal-hidden">
            <ShieldCheck className="size-4 text-primary" />
            <span className="text-[10px] font-black tracking-widest uppercase text-muted-foreground">Katalog Terpercaya</span>
          </div>
          <h2 className="text-4xl md:text-6xl font-black mb-6 text-foreground tracking-tight reveal-hidden delay-100">
            Pilih Paket{' '}
            <span className="bg-clip-text text-transparent bg-gradient-to-br from-primary to-primary/80">
              Favoritmu.
            </span>
          </h2>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto font-medium reveal-hidden delay-200">
            Layanan streaming premium dengan proses aktivasi tercepat dan garansi penuh.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {popularProducts.map((product, idx) => {
            const isFeatured = idx === 1
            return (
              <div
                key={product.id}
                className={`group p-8 rounded-3xl flex flex-col h-full relative border transition-all duration-500 bg-background ${
                  isFeatured
                  ? 'border-primary shadow-2xl scale-105 z-20 hover:shadow-primary/20 hover:-translate-y-4'
                  : 'border-border shadow-sm hover:shadow-2xl hover:border-primary/30 hover:-translate-y-4'
                }`}
                style={{ willChange: 'transform' }}
              >
                {isFeatured && (
                  <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-primary text-primary-foreground text-[10px] font-black px-4 py-1.5 rounded-full uppercase tracking-widest shadow-lg">
                    Best Value
                  </div>
                )}

                <div className="flex items-center justify-between mb-8">
                  <div className="p-3 rounded-2xl bg-primary/10 text-primary">
                    <Package className="size-6" />
                  </div>
                  <div className="px-3 py-1 rounded-full text-[8px] font-black uppercase tracking-widest bg-muted/50 text-slate-400 border border-border">
                    {product.slug.toUpperCase()}
                  </div>
                </div>

                <div className="mb-8">
                  <h3 className="text-3xl font-black transition-colors text-foreground group-hover:text-primary">
                    {product.name}
                  </h3>
                  <div className="flex items-center gap-1.5 mt-1">
                    <Zap className="size-3 fill-current text-primary" />
                    <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Aktivasi Instan</span>
                  </div>
                </div>

                <div className="space-y-3 flex-grow mb-10">
                  {product.variants.slice(0, 2).map((variant) => (
                    <Link
                      key={variant.id}
                      href={`/product/${product.slug}?variant=${variant.id}`}
                      className="p-4 rounded-2xl border transition-all flex justify-between items-center block bg-muted/50 border-border hover:border-primary/30"
                    >
                      <div>
                        <span className="font-black text-sm block text-foreground">
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
                        <span className="text-primary font-black text-lg block">
                          {formatCurrency(variant.price)}
                        </span>
                      </div>
                    </Link>
                  ))}
                </div>

                <div className="pt-8 border-t mt-auto border-border">
                  <Link
                    href={`/product/${product.slug}`}
                    className="w-full py-4 rounded-2xl text-xs font-black uppercase tracking-widest transition-all flex items-center justify-center gap-3 shadow-md bg-primary text-primary-foreground hover:bg-primary/90"
                  >
                    Beli Sekarang
                    <ArrowRight className="size-4" />
                  </Link>
                </div>
              </div>
            )
          })}
        </div>

        <div className="mt-20 text-center reveal-hidden delay-500">
          <Link
            href="/product"
            className="inline-flex items-center gap-3 px-10 py-5 bg-background border border-border text-foreground font-bold rounded-2xl hover:border-primary transition-all shadow-sm"
          >
            Eksplor Semua Produk
            <ArrowRight className="size-4" />
          </Link>
        </div>
      </div>
    </section>
  )
}
