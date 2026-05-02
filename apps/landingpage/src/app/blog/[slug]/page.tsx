'use client'

import { useEffect, useState, use } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { FileText, ArrowLeft, ZoomIn, X, Clock, Tag, Sparkles } from 'lucide-react'
import { api } from '@/lib/api'
import { Navbar } from '@/components/navbar'
import { Footer } from '@/components/footer'
import Link from 'next/link'

export default function BlogDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = use(params)
  
  const [article, setArticle] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [selectedImage, setSelectedImage] = useState<{ url: string, title: string } | null>(null)

  useEffect(() => {
    const fetchArticle = async () => {
      try {
        const { data } = await api.get(`/public/article/${slug}`)
        setArticle(data)
      } catch (error) {
        console.error('Failed to fetch article:', error)
      } finally {
        setIsLoading(false)
      }
    }
    fetchArticle()
  }, [slug])

  if (isLoading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="size-12 border-4 border-slate-100 border-t-[#f97316] rounded-full animate-spin" />
      </div>
    )
  }

  if (!article) {
    return (
      <div className="min-h-screen flex flex-col pt-32 bg-white">
        <Navbar />
        <div className="container mx-auto px-6 flex flex-col items-center justify-center py-32 flex-grow">
          <h1 className="text-4xl font-black text-[#0f172a] mb-6 uppercase">Artikel Tidak Ditemukan</h1>
          <Link href="/blog" className="text-[#f97316] font-black uppercase tracking-widest hover:underline flex items-center gap-2">
            <ArrowLeft className="size-4" /> Kembali ke Blog
          </Link>
        </div>
        <Footer />
      </div>
    )
  }

  return (
    <main className="min-h-screen flex flex-col pt-40 bg-slate-50">
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
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Header Section */}
      <div className="container mx-auto max-w-4xl px-6 mb-20">
        <Link 
          href="/blog" 
          className="inline-flex items-center gap-2 text-sm text-black hover:text-[#f97316] transition-colors mb-8 group"
        >
          <div className="size-8 rounded-full bg-white flex items-center justify-center group-hover:bg-orange-50 transition-colors shadow-sm">
            <ArrowLeft className="size-4" />
          </div>
          <span className="font-black uppercase tracking-widest text-[10px]">Kembali ke Blog</span>
        </Link>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div className="flex flex-wrap items-center gap-4 mb-6">
             <div className="flex items-center gap-2 px-3 py-1 bg-white rounded-full border border-slate-100 shadow-sm">
                <Clock className="size-3 text-slate-400" />
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                  {new Date(article.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}
                </span>
             </div>
             {article.category && (
               <div className="flex items-center gap-2 px-3 py-1 bg-[#f97316]/10 rounded-full border border-[#f97316]/20">
                  <Tag className="size-3 text-[#f97316]" />
                  <span className="text-[10px] font-black text-[#f97316] uppercase tracking-widest">{article.category}</span>
               </div>
             )}
          </div>
          
          <h1 className="text-4xl md:text-6xl font-black mb-8 text-[#0f172a] tracking-tight leading-tight uppercase italic">
            {article.title}
          </h1>
          
          {article.thumbnail_url && (
            <div className="relative aspect-video rounded-[40px] overflow-hidden border border-slate-100 shadow-2xl mb-12">
              <img src={article.thumbnail_url} alt={article.title} className="w-full h-full object-cover" />
            </div>
          )}

          <p className="text-slate-500 text-xl leading-relaxed font-medium">
            {article.subtitle}
          </p>
        </motion.div>
      </div>

      {/* Content Sections (Similar to Tutorial but without "Step X" text) */}
      <div className="container mx-auto max-w-4xl px-6 space-y-12 mb-32">
        {article.content_steps?.map((point: any, index: number) => (
          <motion.div
            key={index}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="bg-white rounded-[40px] overflow-hidden border border-slate-100 shadow-xl shadow-slate-200/50 hover:border-[#f97316]/30 transition-all duration-500"
          >
            <div className="flex flex-col lg:flex-row">
              {/* Image if available */}
              {point.image_url && (
                <div 
                  className="lg:w-1/2 aspect-video lg:aspect-auto relative overflow-hidden bg-slate-100 cursor-zoom-in group/img"
                  onClick={() => setSelectedImage({ url: point.image_url, title: point.title })}
                >
                  <img 
                    src={point.image_url} 
                    alt={point.title} 
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                  />
                  <div className="absolute inset-0 bg-black/0 group-hover/img:bg-black/20 transition-colors flex items-center justify-center opacity-0 group-hover/img:opacity-100">
                    <div className="bg-white/90 p-4 rounded-2xl shadow-xl backdrop-blur-sm">
                      <ZoomIn className="size-6 text-[#0f172a]" />
                    </div>
                  </div>
                </div>
              )}

              {/* Content */}
              <div className={cn(
                "p-8 md:p-12 flex flex-col justify-center",
                point.image_url ? "lg:w-1/2" : "w-full"
              )}>
                <h3 className="text-2xl md:text-3xl font-black text-[#0f172a] mb-6 uppercase italic leading-tight">
                  {point.title}
                </h3>
                <div className="bg-slate-50 rounded-3xl p-6 border border-slate-100">
                  <p className="text-slate-600 leading-relaxed text-lg font-medium whitespace-pre-wrap">
                    {point.description}
                  </p>
                </div>
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Recommended Articles or CTA */}
      <div className="container mx-auto max-w-4xl px-6 mb-32">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          className="bg-[#0f172a] rounded-[40px] p-10 md:p-16 border border-white/10 shadow-2xl flex flex-col md:flex-row items-center justify-between gap-10 overflow-hidden relative"
        >
          {/* Subtle Background Accent */}
          <div className="absolute top-0 right-0 w-64 h-64 bg-orange-500/10 blur-[100px] rounded-full -translate-y-1/2 translate-x-1/2" />
          
          <div className="space-y-3 text-center md:text-left relative z-10">
            <div className="flex items-center gap-2 justify-center md:justify-start mb-2">
               <Sparkles className="size-4 text-[#f97316]" />
               <span className="text-[10px] font-black text-orange-400 uppercase tracking-widest">Update Setiap Hari</span>
            </div>
            <h3 className="text-3xl font-black text-white uppercase italic tracking-tight">Cek Update Lainnya?</h3>
            <p className="text-slate-400 text-lg font-medium">Lihat koleksi artikel dan berita terbaru dari kami.</p>
          </div>
          <Link 
            href="/blog" 
            className="px-10 py-5 bg-white text-[#0f172a] font-black rounded-2xl hover:scale-110 active:scale-95 transition-all flex items-center gap-3 uppercase text-sm tracking-[0.2em] shadow-xl relative z-10"
          >
            Buka Blog <FileText className="size-5" />
          </Link>
        </motion.div>
      </div>

      <Footer />
    </main>
  )
}

function cn(...classes: any[]) {
  return classes.filter(Boolean).join(' ')
}
