'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Crown, Menu, X, ShoppingBag, Key } from 'lucide-react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'

export function Navbar() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)
  const pathname = usePathname()

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20)
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  const navLinks = [
    { name: 'Home', href: '/' },
    { name: 'Produk', href: '/product' },
    { name: 'Redeem', href: '/redeem' },
  ]

  return (
    <>
      <nav 
        className={`fixed top-0 left-0 right-0 z-[100] transition-all duration-500 w-full flex justify-center ${
          scrolled ? 'py-4' : 'py-8'
        }`}
      >
        <div className="w-full max-w-7xl px-6 md:px-12">
          <div className={`flex items-center justify-between px-8 py-4 rounded-[24px] transition-all duration-500 ${
            scrolled ? 'glass shadow-2xl border-white/10' : 'bg-transparent border-transparent'
          }`}>
            <Link href="/" className="flex items-center gap-3 shrink-0 group">
              <div className="bg-gradient-gold p-2.5 rounded-xl shadow-[0_0_20px_rgba(255,184,0,0.4)] group-hover:scale-110 transition-transform duration-300">
                <Crown className="size-5 text-black" />
              </div>
              <span className="text-xl md:text-2xl font-black tracking-tighter text-white">
                VOLVE<span className="text-primary">CAPITAL</span>
              </span>
            </Link>

            {/* Desktop Links */}
            <div className="hidden md:flex items-center gap-10">
              {navLinks.map(link => {
                const isActive = pathname === link.href
                return (
                  <Link 
                    key={link.name} 
                    href={link.href} 
                    className={`text-sm font-bold transition-all tracking-widest uppercase relative group ${
                      isActive ? 'text-primary' : 'text-gray-400 hover:text-white'
                    }`}
                  >
                    {link.name}
                    <span className={`absolute -bottom-1 left-0 h-0.5 bg-primary transition-all duration-300 ${
                      isActive ? 'w-full' : 'w-0 group-hover:w-full'
                    }`} />
                  </Link>
                )
              })}
              
              <Link 
                href="/product" 
                className="bg-gradient-gold text-black text-[10px] font-black px-8 py-3 rounded-xl hover:scale-105 active:scale-95 transition-all shadow-[0_10px_20px_rgba(255,184,0,0.2)] uppercase tracking-[0.2em] flex items-center gap-2"
              >
                <ShoppingBag className="size-3" />
                Mulai Berlangganan
              </Link>
            </div>

            {/* Mobile Toggle */}
            <button 
              className="md:hidden p-2 text-primary"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            >
              {isMobileMenuOpen ? <X className="size-6" /> : <Menu className="size-6" />}
            </button>
          </div>
        </div>
      </nav>

      {/* Mobile Menu Overlay */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="fixed inset-0 z-[90] md:hidden glass flex flex-col justify-center items-center p-10"
          >
            <div className="flex flex-col gap-8 items-center text-center">
              {navLinks.map(link => (
                <Link 
                  key={link.name} 
                  href={link.href} 
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="text-4xl font-black text-white hover:text-primary transition-colors uppercase tracking-tighter"
                >
                  {link.name}
                </Link>
              ))}
              <Link 
                href="/product" 
                onClick={() => setIsMobileMenuOpen(false)}
                className="mt-4 bg-gradient-gold text-black text-sm font-black px-10 py-5 rounded-2xl flex items-center gap-3 uppercase tracking-widest"
              >
                <ShoppingBag className="size-5" />
                Beli Paket
              </Link>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}
