'use client'

import { useState, useMemo } from 'react'
import dynamic from 'next/dynamic'
import { Navbar } from '@/components/navbar'
import { Hero } from '@/components/hero'
import { ProductGrid } from '@/components/product-grid'
import { Product, ProductVariant } from '@/hooks/use-products'
import type { 
  LandingHeroConfig, 
  LandingFeatureConfig,
  LandingTestimonialItem, 
  LandingFaqItem, 
  LandingNavbarConfig, 
  LandingFooterConfig 
} from '@volvecapital/shared/types'

// Dynamic imports for below-the-fold components
const SocialProof = dynamic(() => import('@/components/social-proof').then(mod => mod.SocialProof), { ssr: true })
const DecisionSplit = dynamic(() => import('@/components/decision-split').then(mod => mod.DecisionSplit), { ssr: true })
const Steps = dynamic(() => import('@/components/steps').then(mod => mod.Steps), { ssr: true })
const Features = dynamic(() => import('@/components/features').then(mod => mod.Features), { ssr: true })
const Testimonials = dynamic(() => import('@/components/testimonials').then(mod => mod.Testimonials), { ssr: true })
const Faq = dynamic(() => import('@/components/faq').then(mod => mod.Faq), { ssr: true })
const Footer = dynamic(() => import('@/components/footer').then(mod => mod.Footer), { ssr: true })
const CheckoutModal = dynamic(() => import('@/components/checkout-modal').then(mod => mod.CheckoutModal), { ssr: false })

interface HomeContentProps {
  initialProducts: Product[]
  tenantId: string
  settings: Record<string, string>
}

export function HomeContent({ initialProducts, settings }: HomeContentProps) {
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null)
  const [selectedVariant, setSelectedVariant] = useState<ProductVariant | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)

  // Memoize settings parsing
  const parsedConfigs = useMemo(() => {
    const hero: LandingHeroConfig | null = settings.LANDING_HERO ? JSON.parse(settings.LANDING_HERO) : null
    
    let features: LandingFeatureConfig | null = null
    if (settings.LANDING_FEATURES) {
      const parsed = JSON.parse(settings.LANDING_FEATURES)
      features = Array.isArray(parsed) 
        ? { sectionTitle: 'Kenapa Memilih Digital Premium?', items: parsed }
        : parsed
    }

    return {
      hero,
      socialProof: settings.LANDING_SOCIAL_PROOF ? JSON.parse(settings.LANDING_SOCIAL_PROOF) : hero,
      features,
      testimonials: settings.LANDING_TESTIMONIALS ? JSON.parse(settings.LANDING_TESTIMONIALS) : [],
      faq: settings.LANDING_FAQ ? JSON.parse(settings.LANDING_FAQ) : [],
      navbar: settings.LANDING_NAVBAR ? JSON.parse(settings.LANDING_NAVBAR) : null,
      footer: settings.LANDING_FOOTER ? JSON.parse(settings.LANDING_FOOTER) : null,
    }
  }, [settings])

  const handleSelectVariant = (variant: ProductVariant, product: Product) => {
    setSelectedProduct(product)
    setSelectedVariant(variant)
    setIsModalOpen(true)
  }

  return (
    <main className="w-full bg-white">
      <Navbar config={parsedConfigs.navbar} />
      <Hero config={parsedConfigs.hero} />
      
      <div className="flex flex-col gap-0">
        <SocialProof config={parsedConfigs.socialProof} />
        <DecisionSplit />
        <Steps />
        <ProductGrid products={initialProducts} onSelectVariant={handleSelectVariant} />
        <Features config={parsedConfigs.features} />
        <Testimonials items={parsedConfigs.testimonials} />
        <Faq config={{ sectionTitle: 'Pertanyaan Umum', items: parsedConfigs.faq }} />
      </div>
      
      <Footer config={parsedConfigs.footer} />

      {isModalOpen && (
        <CheckoutModal 
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          product={selectedProduct}
          variant={selectedVariant}
        />
      )}
    </main>
  )
}
