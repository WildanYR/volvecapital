'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Menu, X, ShoppingBag, Home, Package, Key, Crown } from 'lucide-react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useTenant } from '@/hooks/use-tenant'
import { api } from '@/lib/api'
import type { LandingNavbarConfig } from '@volvecapital/shared/types'

interface NavbarProps {
  config?: LandingNavbarConfig | null
}

export function Navbar({ config: initialConfig }: NavbarProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)
  const [config, setConfig] = useState<LandingNavbarConfig | null>(initialConfig || null)
  const pathname = usePathname()
  const { tenantId } = useTenant()

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20)
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  useEffect(() => {
    if (!initialConfig && tenantId) {
      const fetchSettings = async () => {
        try {
          const { data } = await api.get('/public/settings')
          if (data.LANDING_NAVBAR) {
            setConfig(JSON.parse(data.LANDING_NAVBAR))
          }
        } catch (error) {
          console.error('Failed to fetch navbar settings:', error)
        }
      }
      fetchSettings()
    } else if (initialConfig) {
      setConfig(initialConfig)
    }
  }, [initialConfig, tenantId])

  const navLinks = [
    { name: 'HOME', href: '/', icon: Home },
    { name: 'PRODUK', href: '/product', icon: Package },
    { name: 'REDEEM', href: '/redeem', icon: Key },
  ]

  const brandName = config?.logoText || 'VOLVECAPITAL'
  const logoIcon = config?.logoIconEmbed

  const renderLogoIcon = () => {
    if (!logoIcon) {
      return (
        <div className="size-10 bg-gradient-to-br from-[#f97316] to-[#ef4444] rounded-xl flex items-center justify-center shadow-lg shadow-orange-500/20 group-hover:scale-110 transition-transform">
          <Crown className="size-6 text-white" />
        </div>
      )
    }

    if (logoIcon.startsWith('<svg')) {
      return (
        <div 
          className="size-10 flex items-center justify-center group-hover:scale-110 transition-transform"
          dangerouslySetInnerHTML={{ __html: logoIcon }}
        />
      )
    }

    return (
      <div className="size-10 flex items-center justify-center group-hover:scale-110 transition-transform">
        <img src={logoIcon} alt={brandName} className="size-full object-contain" />
      </div>
    )
  }

  return (
    <nav 
      className={`fixed top-0 left-0 right-0 z-[100] transition-all duration-500 border-b ${
        scrolled 
        ? 'bg-white/90 backdrop-blur-xl border-slate-100 shadow-sm py-3' 
        : 'bg-white border-transparent py-5'
      }`}
    >
      <div className="max-w-7xl mx-auto px-6 flex items-center justify-between">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-3 group">
          {renderLogoIcon()}
          <span className="text-xl font-black tracking-tighter text-[#0f172a] group-hover:text-[#f97316] transition-colors uppercase">
            {brandName}
          </span>
        </Link>

        {/* Desktop Menu */}
        <div className="hidden lg:flex items-center gap-10">
          <div className="flex items-center gap-8">
            {navLinks.map((link) => (
              <Link
                key={link.name}
                href={link.href}
                className={`text-xs font-black tracking-[0.2em] transition-all hover:text-[#f97316] ${
                  pathname === link.href ? 'text-[#f97316]' : 'text-slate-400'
                }`}
              >
                {link.name}
              </Link>
            ))}
          </div>
          <Link 
            href="/product"
            className="flex items-center gap-2 px-6 py-3 bg-gradient-to-br from-[#f97316] to-[#ef4444] text-white rounded-2xl font-black text-xs tracking-widest shadow-xl shadow-orange-500/20 hover:scale-105 active:scale-95 transition-all"
          >
            <ShoppingBag className="size-4" />
            MULAI BELI
          </Link>
        </div>

        {/* Mobile Toggle */}
        <button 
          className="lg:hidden size-11 flex items-center justify-center text-[#0f172a] bg-slate-50 rounded-xl hover:bg-slate-100 transition-colors"
          onClick={() => setIsOpen(!isOpen)}
        >
          {isOpen ? <X className="size-6" /> : <Menu className="size-6" />}
        </button>
      </div>

      {/* Mobile/Tablet Menu */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="lg:hidden bg-white border-t border-slate-50 overflow-hidden shadow-2xl"
          >
            <div className="p-8 space-y-5">
              {navLinks.map((link) => (
                <Link
                  key={link.name}
                  href={link.href}
                  onClick={() => setIsOpen(false)}
                  className="flex items-center gap-4 p-5 rounded-3xl bg-slate-50 text-[#0f172a] font-black text-sm hover:bg-orange-50 hover:text-[#f97316] transition-all"
                >
                  <div className="size-10 bg-white rounded-2xl flex items-center justify-center shadow-sm">
                    <link.icon className="size-5 text-[#f97316]" />
                  </div>
                  {link.name}
                </Link>
              ))}
              <Link
                href="/product"
                onClick={() => setIsOpen(false)}
                className="flex items-center justify-center gap-3 w-full p-6 bg-[#0f172a] text-white rounded-[28px] font-black text-sm shadow-xl"
              >
                <ShoppingBag className="size-5" />
                MULAI BELI
              </Link>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  )
}
