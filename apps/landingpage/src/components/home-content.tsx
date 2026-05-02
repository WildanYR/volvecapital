'use client'

import { useState } from 'react'
import { Navbar } from '@/components/navbar'
import { Hero } from '@/components/hero'
import { SocialProof } from '@/components/social-proof'
import { DecisionSplit } from '@/components/decision-split'
import { Steps } from '@/components/steps'
import { ProductGrid } from '@/components/product-grid'
import { Features } from '@/components/features'
import { Testimonials } from '@/components/testimonials'
import { Faq } from '@/components/faq'
import { Footer } from '@/components/footer'
import { CheckoutModal } from '@/components/checkout-modal'
import { Product, ProductVariant } from '@/hooks/use-products'
import type { 
  LandingHeroConfig, 
  LandingFeatureConfig,
  LandingTestimonialItem, 
  LandingFaqItem, 
  LandingNavbarConfig, 
  LandingFooterConfig 
} from '@volvecapital/shared/types'

interface HomeContentProps {
  initialProducts: Product[]
  tenantId: string
  settings: Record<string, string>
}

export function HomeContent({ initialProducts, settings }: HomeContentProps) {
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null)
  const [selectedVariant, setSelectedVariant] = useState<ProductVariant | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)

  // Parse settings with defaults
  const heroConfig: LandingHeroConfig | null = settings.LANDING_HERO ? JSON.parse(settings.LANDING_HERO) : null
  
  // Stats customization logic
  const socialProofConfig = settings.LANDING_SOCIAL_PROOF 
    ? JSON.parse(settings.LANDING_SOCIAL_PROOF) 
    : heroConfig // Fallback to hero config for backward compatibility

  let featuresConfig: LandingFeatureConfig | null = null
  if (settings.LANDING_FEATURES) {
    const parsed = JSON.parse(settings.LANDING_FEATURES)
    if (Array.isArray(parsed)) {
      featuresConfig = { sectionTitle: 'Kenapa Memilih Volve Capital?', items: parsed }
    } else {
      featuresConfig = parsed
    }
  }
  const testimonialsConfig: LandingTestimonialItem[] = settings.LANDING_TESTIMONIALS ? JSON.parse(settings.LANDING_TESTIMONIALS) : []
  const faqItems: LandingFaqItem[] = settings.LANDING_FAQ ? JSON.parse(settings.LANDING_FAQ) : []
  const navbarConfig: LandingNavbarConfig | null = settings.LANDING_NAVBAR ? JSON.parse(settings.LANDING_NAVBAR) : null
  const footerConfig: LandingFooterConfig | null = settings.LANDING_FOOTER ? JSON.parse(settings.LANDING_FOOTER) : null

  const handleSelectVariant = (variant: ProductVariant, product: Product) => {
    setSelectedProduct(product)
    setSelectedVariant(variant)
    setIsModalOpen(true)
  }

  return (
    <main className="w-full bg-white">
      <Navbar config={navbarConfig} />
      <Hero config={heroConfig} />
      
      <div className="flex flex-col gap-0">
        <SocialProof config={socialProofConfig} />
        <DecisionSplit />
        <Steps />
        <ProductGrid products={initialProducts} onSelectVariant={handleSelectVariant} />
        <Features config={featuresConfig} />
        <Testimonials items={testimonialsConfig} />
        <Faq config={{ sectionTitle: 'Pertanyaan Umum', items: faqItems }} />
      </div>
      
      <Footer config={footerConfig} />

      <CheckoutModal 
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        product={selectedProduct}
        variant={selectedVariant}
      />
    </main>
  )
}
