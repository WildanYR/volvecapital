'use client'

import { useEffect, useState, use } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { BookOpen, ArrowLeft, CheckCircle2, ChevronRight, Info, ExternalLink, X, ZoomIn } from 'lucide-react'
import { api } from '@/lib/api'
import { Navbar } from '@/components/navbar'
import { Footer } from '@/components/footer'
import Link from 'next/link'
import { cn } from '@/lib/utils'
import { useSearchParams } from 'next/navigation'

export default function TutorialDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = use(params)
  const searchParams = useSearchParams()
  const token = searchParams.get('token')
  const tenant = searchParams.get('tenant')
  
  const [tutorial, setTutorial] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [selectedImage, setSelectedImage] = useState<{ url: string, title: string } | null>(null)

  const resolveLink = (linkUrl: string) => {
    if (!linkUrl) return null
    if (linkUrl === '$$portal_url') {
      if (!token || !tenant) return null
      const portalBase = process.env.NEXT_PUBLIC_PORTAL_URL || 'http://localhost:3000'
      return `${portalBase}/portal/${tenant}/${token}`
    }
    return linkUrl
  }

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
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="size-12 border-4 border-slate-100 border-t-[#f97316] rounded-full animate-spin" />
      </div>
    )
  }

  if (!tutorial) {
    return (
      <div className="min-h-screen flex flex-col pt-32 pb-20 bg-white">
        <Navbar />
        <div className="container mx-auto px-6 flex flex-col items-center justify-center py-32">
          <h1 className="text-4xl font-black text-[#0f172a] mb-6">Tutorial Tidak Ditemukan</h1>
          <Link href="/tutorial" className="text-[#f97316] hover:underline flex items-center gap-2">
            <ArrowLeft className="size-4" /> Kembali ke Daftar Tutorial
          </Link>
        </div>
        <Footer />
      </div>
    )
  }

  return (
    <main className="min-h-screen flex flex-col pt-40 pb-20 bg-slate-50">
      <Navbar />
      
      {/* Lightbox Modal */}
      <AnimatePresence>
        {selectedImage && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[200] flex items-center justify-center p-4 md:p-10 bg-[#0f172a]/95 backdrop-blur-md"
            onClick={() => setSelectedImage(null)}
          >
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="relative max-w-7xl w-full h-full flex flex-col items-center justify-center"
              onClick={e => e.stopPropagation()}
            >
              <button 
                onClick={() => setSelectedImage(null)}
                className="absolute -top-12 right-0 md:-right-12 text-white hover:text-[#f97316] transition-colors p-2"
              >
                <X className="size-8" />
              </button>
              
              <div className="bg-white p-2 rounded-3xl shadow-2xl overflow-hidden max-h-[85vh] flex items-center justify-center">
                <img 
                  src={selectedImage.url} 
                  alt={selectedImage.title}
                  className="max-w-full max-h-full object-contain rounded-2xl"
                />
              </div>
              
              <div className="mt-6 text-center">
                <h4 className="text-white text-xl font-black uppercase italic tracking-tight">{selectedImage.title}</h4>
                <p className="text-slate-400 text-sm mt-1">Klik di mana saja untuk menutup</p>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Header Section */}
      <div className="container mx-auto max-w-4xl px-6 mb-20">
        <Link 
          href="/tutorial" 
          className="inline-flex items-center gap-2 text-sm text-black hover:text-[#f97316] transition-colors mb-8 group"
        >
          <div className="size-8 rounded-full bg-white flex items-center justify-center group-hover:bg-orange-50 transition-colors shadow-sm">
            <ArrowLeft className="size-4" />
          </div>
          Kembali ke Daftar
        </Link>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <h1 className="text-4xl md:text-6xl font-black mb-6 text-[#0f172a] tracking-tight leading-tight uppercase italic">
            {tutorial.title}
          </h1>
          <p className="text-slate-500 text-xl leading-relaxed font-medium">
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
            <div className="bg-white rounded-[40px] overflow-hidden border border-slate-100 shadow-xl shadow-slate-200/50 hover:border-[#f97316]/30 transition-all duration-500">
              <div className="flex flex-col lg:flex-row">
                {/* Left: Image (Clickable) */}
                <div 
                  className="lg:w-1/2 aspect-video lg:aspect-auto relative overflow-hidden bg-slate-100 cursor-zoom-in group/img"
                  onClick={() => step.image_url && setSelectedImage({ url: step.image_url, title: step.title || `Langkah ${index + 1}` })}
                >
                  {step.image_url ? (
                    <>
                      <img 
                        src={step.image_url} 
                        alt={step.title} 
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                      />
                      <div className="absolute inset-0 bg-black/0 group-hover/img:bg-black/20 transition-colors flex items-center justify-center opacity-0 group-hover/img:opacity-100">
                        <div className="bg-white/90 p-4 rounded-2xl shadow-xl backdrop-blur-sm">
                          <ZoomIn className="size-6 text-[#0f172a]" />
                        </div>
                      </div>
                    </>
                  ) : (
                    <div className="w-full h-full flex items-center justify-center opacity-10">
                      <BookOpen className="size-20" />
                    </div>
                  )}
                  <div className="absolute top-6 left-6 size-12 rounded-2xl bg-[#0f172a] text-white font-black flex items-center justify-center text-xl shadow-2xl">
                    {index + 1}
                  </div>
                </div>

                {/* Right: Content */}
                <div className="lg:w-1/2 p-8 md:p-12 flex flex-col justify-center">
                  <span className="text-[10px] font-black tracking-[0.3em] text-[#f97316] uppercase mb-4 block">
                    {step.label || `LANGKAH ${index + 1}`}
                  </span>
                  <h3 className="text-2xl md:text-3xl font-black text-[#0f172a] mb-6 group-hover:text-[#f97316] transition-colors uppercase italic">
                    {step.title}
                  </h3>
                  <div className="bg-slate-50 rounded-3xl p-6 border border-slate-100">
                    <p className="text-slate-600 leading-relaxed text-lg font-medium">
                      {step.description}
                    </p>
                  </div>

                  {/* Action Link Button */}
                  {resolveLink(step.link_url) && (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="mt-8"
                    >
                      <a
                        href={resolveLink(step.link_url)!}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-3 px-8 py-4 bg-[#0f172a] text-white font-black rounded-2xl hover:bg-[#f97316] hover:scale-105 active:scale-95 transition-all shadow-lg shadow-[#0f172a]/20 text-sm uppercase tracking-widest"
                      >
                        {step.link_text || 'Buka Link'} <ExternalLink className="size-4" />
                      </a>
                    </motion.div>
                  )}
                </div>
              </div>
            </div>
            
            {/* Visual connector for next step */}
            {index < tutorial.steps.length - 1 && (
              <div className="flex justify-center h-12">
                <div className="w-0.5 bg-gradient-to-b from-slate-200 to-transparent" />
              </div>
            )}
          </motion.div>
        ))}
      </div>

      {/* Completion Card */}
      <div className="container mx-auto max-w-4xl px-6 mb-32">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          className="bg-white rounded-[40px] p-10 md:p-16 border border-slate-100 shadow-2xl shadow-slate-200/50 flex flex-col md:flex-row items-center justify-between gap-10"
        >
          <div className="space-y-3 text-center md:text-left">
            <h3 className="text-3xl font-black text-[#0f172a] uppercase italic">Sudah Selesai?</h3>
            <p className="text-slate-500 text-lg font-medium">Anda sudah mempelajari seluruh langkah di panduan ini.</p>
          </div>
          <Link 
            href="/" 
            className="px-10 py-5 bg-[#f97316] text-white font-black rounded-2xl hover:scale-110 active:scale-95 transition-all flex items-center gap-3 uppercase text-sm tracking-[0.2em] shadow-xl shadow-orange-500/30"
          >
            Mulai Sekarang <CheckCircle2 className="size-5" />
          </Link>
        </motion.div>
      </div>

      <Footer />
    </main>
  )
}
