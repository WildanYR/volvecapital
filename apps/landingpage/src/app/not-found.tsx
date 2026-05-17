'use client'

import { motion } from 'framer-motion'
import { Home, MoveLeft } from 'lucide-react'
import Link from 'next/link'
import { Navbar } from '@/components/navbar'
import { Footer } from '@/components/footer'

export default function NotFound() {
  return (
    <main className="min-h-screen flex flex-col bg-background">
      <Navbar />

      <div className="flex-grow flex items-center justify-center container mx-auto max-w-2xl px-6 pt-32 pb-20 text-center">
        <div className="w-full">
          {/* 404 Number */}
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <p className="text-[160px] md:text-[220px] font-black leading-none tracking-tighter bg-clip-text text-transparent bg-gradient-to-br from-primary to-primary/80 select-none">
              404
            </p>
          </motion.div>

          {/* Divider line */}
          <motion.div
            initial={{ scaleX: 0 }}
            animate={{ scaleX: 1 }}
            transition={{ duration: 0.4, delay: 0.2 }}
            className="h-px bg-muted my-8"
          />

          {/* Text Content */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
          >
            <h1 className="text-2xl md:text-4xl font-black text-foreground mb-4 tracking-tight">
              Halaman tidak ditemukan
            </h1>
            <p className="text-slate-400 text-base font-medium mb-10 max-w-md mx-auto leading-relaxed">
              Alamat yang Anda ketik mungkin salah atau halaman ini sudah tidak tersedia.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
              <Link
                href="/"
                className="w-full sm:w-auto px-8 py-4 bg-primary text-primary-foreground text-sm font-black rounded-2xl hover:bg-primary/90 transition-all flex items-center justify-center gap-2 shadow-md"
              >
                <Home className="size-4" />
                Kembali ke Beranda
              </Link>
              <button
                onClick={() => window.history.back()}
                className="w-full sm:w-auto px-8 py-4 bg-background text-foreground text-sm font-black rounded-2xl border border-border hover:border-primary hover:text-primary transition-all flex items-center justify-center gap-2"
              >
                <MoveLeft className="size-4" />
                Halaman Sebelumnya
              </button>
            </div>
          </motion.div>
        </div>
      </div>

      <Footer />
    </main>
  )
}
