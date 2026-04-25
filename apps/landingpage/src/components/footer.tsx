'use client'

import { Crown, Instagram, Twitter, MessageCircle } from 'lucide-react'
import Link from 'next/link'

export function Footer() {
  return (
    <footer className="py-20 px-6 border-t border-white/5 w-full flex justify-center overflow-hidden">
      <div className="w-full max-w-7xl md:px-12 relative z-10">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-16">
          <div className="md:col-span-2 space-y-6">
            <Link href="/" className="flex items-center gap-3 group">
              <div className="bg-gradient-gold p-2.5 rounded-xl shadow-lg group-hover:scale-110 transition-transform duration-300">
                <Crown className="size-5 text-black" />
              </div>
              <span className="text-2xl font-black tracking-tighter text-white uppercase">
                VOLVE<span className="text-primary">CAPITAL</span>
              </span>
            </Link>
            <p className="text-gray-500 text-base max-w-sm leading-relaxed">
              Solusi hiburan premium terbaik dengan sistem otomatisasi voucher 24/7. 
              Cepat, aman, dan terpercaya sejak 2024.
            </p>
            <div className="flex items-center gap-5">
              <Link href="#" className="size-10 rounded-full glass flex items-center justify-center text-gray-400 hover:text-primary hover:border-primary/50 transition-all">
                <Instagram className="size-5" />
              </Link>
              <Link href="#" className="size-10 rounded-full glass flex items-center justify-center text-gray-400 hover:text-primary hover:border-primary/50 transition-all">
                <Twitter className="size-5" />
              </Link>
              <Link href="#" className="size-10 rounded-full glass flex items-center justify-center text-gray-400 hover:text-primary hover:border-primary/50 transition-all">
                <MessageCircle className="size-5" />
              </Link>
            </div>
          </div>

          <div>
            <h4 className="text-white font-black uppercase tracking-widest text-xs mb-6">Navigasi</h4>
            <ul className="space-y-4">
              <li><Link href="/" className="text-gray-500 hover:text-white transition-colors text-sm">Beranda</Link></li>
              <li><Link href="/product" className="text-gray-500 hover:text-white transition-colors text-sm">Semua Produk</Link></li>
              <li><Link href="/redeem" className="text-gray-500 hover:text-white transition-colors text-sm">Tukar Voucher</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="text-white font-black uppercase tracking-widest text-xs mb-6">Legalitas</h4>
            <ul className="space-y-4">
              <li><Link href="/terms" className="text-gray-500 hover:text-white transition-colors text-sm">Syarat & Ketentuan</Link></li>
              <li><Link href="/privacy" className="text-gray-500 hover:text-white transition-colors text-sm">Kebijakan Privasi</Link></li>
              <li><Link href="/disclaimer" className="text-gray-500 hover:text-white transition-colors text-sm">Disclaimer</Link></li>
            </ul>
          </div>
        </div>

        <div className="pt-8 border-t border-white/5 flex flex-col md:flex-row justify-between items-center gap-6">
          <p className="text-xs text-gray-600 font-bold uppercase tracking-[0.2em]">
            © 2026 Volve Capital. All rights reserved.
          </p>
          <div className="flex items-center gap-2 text-[10px] text-gray-700 font-black uppercase tracking-widest">
            <span>Powered by</span>
            <span className="text-gray-500">Volve Infrastructure</span>
          </div>
        </div>
      </div>
    </footer>
  )
}
