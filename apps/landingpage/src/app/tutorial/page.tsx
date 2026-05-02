'use client'

import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { BookOpen, ArrowRight, Clock, ChevronRight, ShieldCheck } from 'lucide-react'
import { api } from '@/lib/api'
import { Navbar } from '@/components/navbar'
import { Footer } from '@/components/footer'
import Link from 'next/link'

export default function TutorialListPage() {
  const [tutorials, setTutorials] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const fetchTutorials = async () => {
      try {
        const { data } = await api.get('/public/tutorial')
        setTutorials(data)
      } catch (error) {
        console.error('Failed to fetch tutorials:', error)
      } finally {
        setIsLoading(false)
      }
    }
    fetchTutorials()
  }, [])

  return (
    <main className="min-h-screen flex flex-col pt-40 pb-20 bg-slate-50">
      <Navbar />
      
      <div className="container mx-auto max-w-6xl px-6">
        <div className="text-center mb-20">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-orange-50 border border-orange-100 mb-6 shadow-sm"
          >
            <ShieldCheck className="size-4 text-[#f97316]" />
            <span className="text-[10px] font-black tracking-widest uppercase text-[#f97316]">Pusat Panduan Resmi</span>
          </motion.div>
          <h1 className="text-4xl md:text-7xl font-black mb-6 text-[#0f172a] tracking-tight uppercase italic">
            Koleksi <span className="bg-clip-text text-transparent bg-gradient-to-br from-[#f97316] to-[#ef4444]">Tutorial.</span>
          </h1>
          <p className="text-slate-500 text-lg max-w-2xl mx-auto font-medium">
            Pelajari cara memaksimalkan layanan kami melalui panduan visual langkah-demi-langkah yang mudah dipahami.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10 mb-32">
          {isLoading ? (
            Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="aspect-[4/5] rounded-[40px] bg-white animate-pulse border border-slate-100" />
            ))
          ) : tutorials.length > 0 ? (
            tutorials.map((tutorial, idx) => (
              <motion.div
                key={tutorial.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.1 }}
                className="group h-full"
              >
                <Link href={`/tutorial/${tutorial.slug}`} className="block h-full">
                  <div className="relative h-full bg-white rounded-[40px] overflow-hidden border border-slate-100 shadow-xl shadow-slate-200/50 group-hover:border-[#f97316]/30 group-hover:-translate-y-2 transition-all duration-500 flex flex-col">
                    <div className="aspect-[16/10] overflow-hidden relative bg-slate-50">
                      {tutorial.thumbnail_url ? (
                        <img 
                          src={tutorial.thumbnail_url} 
                          alt={tutorial.title} 
                          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center opacity-10">
                          <BookOpen className="size-12 text-[#f97316]" />
                        </div>
                      )}
                      <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent opacity-60" />
                    </div>
                    
                    <div className="p-10 flex-grow flex flex-col">
                      <div className="flex items-center gap-3 mb-6">
                        <div className="flex items-center gap-1.5 text-[10px] text-slate-400 font-black uppercase tracking-widest bg-slate-50 px-3 py-1.5 rounded-full border border-slate-100">
                          <Clock className="size-3" />
                          {new Date(tutorial.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}
                        </div>
                      </div>
                      
                      <h2 className="text-2xl font-black text-[#0f172a] mb-4 group-hover:text-[#f97316] transition-colors leading-tight uppercase italic">
                        {tutorial.title}
                      </h2>
                      <p className="text-slate-500 text-sm line-clamp-2 mb-10 flex-grow font-medium leading-relaxed">
                        {tutorial.subtitle || 'Klik untuk melihat panduan lengkap langkah-demi-langkah.'}
                      </p>
                      
                      <div className="flex items-center justify-between mt-auto pt-6 border-t border-slate-50">
                        <span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 group-hover:text-[#f97316] transition-colors">Lihat Panduan</span>
                        <div className="size-12 rounded-full bg-slate-50 border border-slate-100 flex items-center justify-center group-hover:bg-[#f97316] group-hover:border-[#f97316] group-hover:text-white transition-all duration-300 shadow-sm">
                          <ChevronRight className="size-5" />
                        </div>
                      </div>
                    </div>
                  </div>
                </Link>
              </motion.div>
            ))
          ) : (
            <div className="col-span-full py-32 text-center bg-white rounded-[40px] border border-dashed border-slate-200">
              <BookOpen className="size-16 text-slate-100 mx-auto mb-6" />
              <p className="text-slate-400 font-black uppercase tracking-widest text-sm">Belum ada tutorial tersedia</p>
            </div>
          )}
        </div>
      </div>

      <Footer />
    </main>
  )
}
