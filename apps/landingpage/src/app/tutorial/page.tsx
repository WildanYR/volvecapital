'use client'

import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { BookOpen, ArrowRight, Clock, ChevronRight } from 'lucide-react'
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
    <main className="min-h-screen flex flex-col pt-32 pb-20">
      <Navbar />
      
      <div className="container mx-auto max-w-6xl px-6">
        <div className="text-center mb-20">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary/10 border border-primary/20 mb-6"
          >
            <BookOpen className="size-3 text-primary" />
            <span className="text-[10px] font-black tracking-[0.3em] text-primary uppercase">Pusat Panduan</span>
          </motion.div>
          <h1 className="text-4xl md:text-6xl font-black mb-6 text-white tracking-tight">Koleksi <span className="text-primary">Tutorial.</span></h1>
          <p className="text-gray-400 text-lg max-w-2xl mx-auto">Pelajari cara memaksimalkan layanan kami melalui panduan visual langkah-demi-langkah.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-20">
          {isLoading ? (
            Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="aspect-[4/5] rounded-[40px] bg-white/5 animate-pulse" />
            ))
          ) : tutorials.length > 0 ? (
            tutorials.map((tutorial, idx) => (
              <motion.div
                key={tutorial.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.1 }}
              >
                <Link href={`/tutorial/${tutorial.slug}`} className="group block h-full">
                  <div className="relative h-full glass-card rounded-[40px] overflow-hidden border-white/5 group-hover:border-primary/30 transition-all duration-500 flex flex-col">
                    <div className="aspect-[16/10] overflow-hidden relative">
                      {tutorial.thumbnail_url ? (
                        <img 
                          src={tutorial.thumbnail_url} 
                          alt={tutorial.title} 
                          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                        />
                      ) : (
                        <div className="w-full h-full bg-primary/5 flex items-center justify-center">
                          <BookOpen className="size-12 text-primary opacity-20" />
                        </div>
                      )}
                      <div className="absolute inset-0 bg-gradient-to-t from-[#0a0a0a] to-transparent opacity-60" />
                    </div>
                    
                    <div className="p-8 flex-grow flex flex-col">
                      <div className="flex items-center gap-3 mb-4">
                        <div className="flex items-center gap-1.5 text-xs text-gray-500 font-medium">
                          <Clock className="size-3" />
                          {new Date(tutorial.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}
                        </div>
                      </div>
                      
                      <h2 className="text-2xl font-black text-white mb-3 group-hover:text-primary transition-colors leading-tight">
                        {tutorial.title}
                      </h2>
                      <p className="text-gray-500 text-sm line-clamp-2 mb-8 flex-grow">
                        {tutorial.subtitle || 'Klik untuk melihat panduan lengkap langkah-demi-langkah.'}
                      </p>
                      
                      <div className="flex items-center justify-between mt-auto">
                        <span className="text-[10px] font-black uppercase tracking-widest text-primary/50 group-hover:text-primary transition-colors">Lihat Panduan</span>
                        <div className="size-10 rounded-full bg-white/5 border border-white/10 flex items-center justify-center group-hover:bg-primary group-hover:border-primary group-hover:text-black transition-all duration-300">
                          <ChevronRight className="size-5" />
                        </div>
                      </div>
                    </div>
                  </div>
                </Link>
              </motion.div>
            ))
          ) : (
            <div className="col-span-full py-32 text-center">
              <p className="text-gray-500 italic">Belum ada tutorial yang tersedia saat ini.</p>
            </div>
          )}
        </div>
      </div>

      <Footer />
    </main>
  )
}
