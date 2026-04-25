'use client'

import { useState } from 'react'
import { Navbar } from '@/components/navbar'
import { Hero } from '@/components/hero'
import { DecisionSplit } from '@/components/decision-split'
import { Steps } from '@/components/steps'
import { ProductGrid } from '@/components/product-grid'
import { Features } from '@/components/features'
import { Testimonials } from '@/components/testimonials'
import { Footer } from '@/components/footer'
import { CheckoutModal } from '@/components/checkout-modal'
import { Product, ProductVariant } from '@/hooks/use-products'

interface HomeContentProps {
  initialProducts: Product[]
  tenantId: string
}

export function HomeContent({ initialProducts, tenantId }: HomeContentProps) {
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null)
  const [selectedVariant, setSelectedVariant] = useState<ProductVariant | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)

  const handleSelectVariant = (variant: ProductVariant, product: Product) => {
    setSelectedProduct(product)
    setSelectedVariant(variant)
    setIsModalOpen(true)
  }

  return (
    <main className="w-full bg-[#050505]">
      <Navbar />
      <Hero />
      <div className="flex flex-col gap-0">
        <DecisionSplit />
        <Steps />
        <ProductGrid products={initialProducts} onSelectVariant={handleSelectVariant} />
        <Features />
        <Testimonials />
      </div>
      <Footer />

      <CheckoutModal 
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        product={selectedProduct}
        variant={selectedVariant}
      />
    </main>
  )
}
