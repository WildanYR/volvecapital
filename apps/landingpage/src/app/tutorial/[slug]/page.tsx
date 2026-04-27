'use client'

import { useEffect, useState, use } from 'react'
import { motion } from 'framer-motion'
import { BookOpen, ArrowLeft, CheckCircle2, ChevronRight, Info } from 'lucide-react'
import { api } from '@/lib/api'
import { Navbar } from '@/components/navbar'
import { Footer } from '@/components/footer'
import Link from 'next/link'
import { cn } from '@/lib/utils'

export default function TutorialDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = use(params)
  const [tutorial, setTutorial] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const fetchTutorial = async () => {
      try {
        const { data } = await api.get(`/public/tutorial/${slug}`)
        setTutorial(data)
      } catch (error) {
        console.error('Failed to fetch tutorial:', error)
      } finally {
        setIsLoading(false)
      }
    }
    fetchTutorial()
  }, [slug])

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center">
        <div className="size-12 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
      </div>
    )
  }

  if (!tutorial) {
    return (
      <div className="min-h-screen flex flex-col pt-32 pb-20">
        <Navbar />
        <div className="container mx-auto px-6 flex flex-col items-center justify-center py-32">
          <h1 className="text-4xl font-black text-white mb-6">Tutorial Tidak Ditemukan</h1>
          <Link href="/tutorial" className="text-primary hover:underline flex items-center gap-2">
            <ArrowLeft className="size-4" /> Kembali ke Daftar Tutorial
          </Link>
        </div>
        <Footer />
      </div>
    )
  }

  return (
    <main className="min-h-screen flex flex-col pt-32 pb-20">
      <Navbar />
      
      {/* Header Section */}
      <div className="container mx-auto max-w-4xl px-6 mb-20">
        <Link 
          href="/tutorial" 
          className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-primary transition-colors mb-8 group"
        >
          <div className="size-8 rounded-full bg-white/5 flex items-center justify-center group-hover:bg-primary/10 transition-colors">
            <ArrowLeft className="size-4" />
          </div>
          Kembali ke Daftar
        </Link>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <h1 className="text-4xl md:text-6xl font-black mb-6 text-white tracking-tight leading-tight">
            {tutorial.title}
          </h1>
          <p className="text-gray-400 text-xl leading-relaxed">
            {tutorial.subtitle}
          </p>
        </motion.div>
      </div>

      {/* Steps List */}
      <div className="container mx-auto max-w-4xl px-6 space-y-12 mb-32">
        {tutorial.steps?.map((step: any, index: number) => (
          <motion.div
            key={index}
            initial={{ opacity: 0, x: -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ delay: index * 0.1 }}
            className="group"
          >
            <div className="glass-card rounded-[40px] overflow-hidden border-white/5 hover:border-primary/20 transition-all duration-500">
              <div className="flex flex-col lg:flex-row">
                {/* Left: Image */}
                <div className="lg:w-1/2 aspect-video lg:aspect-auto relative overflow-hidden bg-black/40">
                  {step.image_url ? (
                    <img 
                      src={step.image_url} 
                      alt={step.title} 
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center opacity-10">
                      <BookOpen className="size-20" />
                    </div>
                  )}
                  <div className="absolute top-6 left-6 size-12 rounded-2xl bg-primary text-black font-black flex items-center justify-center text-xl shadow-2xl">
                    {index + 1}
                  </div>
                </div>

                {/* Right: Content */}
                <div className="lg:w-1/2 p-8 md:p-12 flex flex-col justify-center">
                  <span className="text-[10px] font-black tracking-[0.3em] text-primary uppercase mb-4 block">
                    {step.label || `LANGKAH ${index + 1}`}
                  </span>
                  <h3 className="text-2xl md:text-3xl font-black text-white mb-6 group-hover:text-primary transition-colors">
                    {step.title}
                  </h3>
                  <div className="bg-white/[0.03] rounded-3xl p-6 border border-white/5">
                    <p className="text-gray-400 leading-relaxed text-lg">
                      {step.description}
                    </p>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Visual connector for next step */}
            {index < tutorial.steps.length - 1 && (
              <div className="flex justify-center h-12">
                <div className="w-0.5 bg-gradient-to-b from-primary/30 to-transparent" />
              </div>
            )}
          </motion.div>
        ))}
      </div>

      {/* Completion Card */}
      <div className="container mx-auto max-w-4xl px-6">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          className="bg-gradient-gold p-1 rounded-[40px]"
        >
          <div className="bg-[#0a0a0a] rounded-[38px] p-8 md:p-12 flex flex-col md:flex-row items-center justify-between gap-8">
            <div className="space-y-2 text-center md:text-left">
              <h3 className="text-2xl font-black text-white">Sudah Selesai?</h3>
              <p className="text-gray-400">Anda sudah mempelajari seluruh langkah di panduan ini.</p>
            </div>
            <Link 
              href="/" 
              className="px-8 py-4 bg-white text-black font-black rounded-2xl hover:scale-105 active:scale-95 transition-all flex items-center gap-3 uppercase text-sm tracking-widest shadow-lg"
            >
              Mulai Sekarang <CheckCircle2 className="size-5" />
            </Link>
          </div>
        </motion.div>
      </div>

      <Footer />
    </main>
  )
}
