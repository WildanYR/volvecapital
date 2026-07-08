# Rancangan Implementasi Fitur Blog Ala Instagram Stories & TikTok (16:9 Vertikal)

Tentu saja sangat bisa! Membuat blog dengan format micro-content vertical (9:16) seperti IG Story/TikTok/Shorts adalah strategi yang sangat bagus untuk meningkatkan engagement dan kenyamanan pengguna saat ini. 

Berikut adalah rancangan detail konsep, visual, dan implementasi teknis untuk halaman blog baru dengan gaya Story/TikTok.

---

## 📱 Konsep Desain & Interaksi (UX/UI)

1. **Rasio Kanvas 9:16 (Vertikal)**
   - Konten dibatasi dalam container dengan aspect ratio `9/16` (misalnya `max-w-[450px] w-full aspect-[9/16]`) yang dipusatkan di layar desktop dan memenuhi layar penuh pada perangkat mobile.
   
2. **Skema Navigasi Ganda**
   - **Instagram Story Style (Horizontal)**: 
     - Klik/Tap di sisi **kanan** layar untuk beralih ke halaman/langkah berikutnya.
     - Klik/Tap di sisi **kawan** (kiri) layar untuk kembali ke halaman/langkah sebelumnya.
     - Indikator bar tipis di bagian atas (`Progress Bar Segment`) yang otomatis bergerak maju sesuai durasi baca (misal 5-7 detik per slide) atau bergeser saat di-tap.
   - **TikTok Style (Vertical Swipe/Scroll)**:
     - Swipe atas/bawah untuk berpindah dari satu artikel ke artikel lainnya.
     
3. **Struktur Konten Per Slide**
   - **Media Background**: Gambar latar belakang (thumbnail atau gambar step) berukuran penuh (cover) dengan filter gelap (gradient overlay) di bagian bawah agar teks mudah dibaca.
   - **Top Header**: Nama kategori, tombol Close/Back, dan indikator progres.
   - **Bottom Overlay**: Judul artikel, deskripsi singkat, tombol share/like di sisi kanan, dan tombol CTA "Baca Selengkapnya" atau "Geser ke Atas" di paling bawah.

---

## 🛠️ Rencana File & Modifikasi

Kita akan mengimplementasikan ini di dalam aplikasi Next.js `landingpage`. Kita dapat membuat rute baru atau memodifikasi file-file berikut:

- **[apps/landingpage/src/app/blog/page.tsx](file:///e:/latihan%20coding/1volvecapital/volvecapital/apps/landingpage/src/app/blog/page.tsx)**: Berfungsi sebagai daftar artikel dalam bentuk feed vertical scroll.
- **[apps/landingpage/src/app/blog/[slug]/page.tsx](file:///e:/latihan%20coding/1volvecapital/volvecapital/apps/landingpage/src/app/blog/%5Bslug%5D/page.tsx)**: Halaman detail artikel yang akan disulap menjadi mode IG Story (menggunakan slide-slide dari data `content_steps`).

---

## 💻 Contoh Kode Implementasi

Berikut draf kode React + Tailwind CSS + Framer Motion untuk komponen `BlogDetailPage` berorientasi 9:16 vertical:

```tsx
'use client'

import { useEffect, useState, use } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ArrowLeft, ChevronLeft, ChevronRight, Share2, Heart, Volume2, VolumeX } from 'lucide-react'
import { api } from '@/lib/api'
import Link from 'next/link'

export default function BlogStoryPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = use(params)
  
  const [article, setArticle] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(true)
  
  // State untuk melacak langkah/slide aktif (IG Story)
  const [activeStep, setActiveStep] = useState(0)
  // State untuk auto play progress
  const [progress, setProgress] = useState(0)
  const [isLiked, setIsLiked] = useState(false)
  const [isMuted, setIsMuted] = useState(true)

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

  // Simulasi progress bar otomatis (seperti IG Story)
  useEffect(() => {
    if (isLoading || !article) return

    const interval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          // Pindah ke slide berikutnya jika ada
          const stepsCount = article.content_steps?.length || 0
          if (activeStep < stepsCount - 1) {
            setActiveStep((prevStep) => prevStep + 1)
            return 0
          } else {
            // Loop kembali ke awal atau berhenti
            setActiveStep(0)
            return 0
          }
        }
        return prev + 1
      })
    }, 50) // Kecepatan progress bar (total ~5 detik per slide)

    return () => clearInterval(interval)
  }, [isLoading, article, activeStep])

  if (isLoading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="size-12 border-4 border-slate-800 border-t-primary rounded-full animate-spin" />
      </div>
    )
  }

  if (!article) return null

  const steps = article.content_steps || []
  const currentStep = steps[activeStep] || { title: article.title, description: article.subtitle, image_url: article.thumbnail_url }

  const handleNext = () => {
    if (activeStep < steps.length - 1) {
      setActiveStep(activeStep + 1)
      setProgress(0)
    }
  }

  const handlePrev = () => {
    if (activeStep > 0) {
      setActiveStep(activeStep - 1)
      setProgress(0)
    }
  }

  return (
    <main className="min-h-screen bg-zinc-950 flex items-center justify-center md:py-8 overflow-hidden select-none">
      {/* 16:9 Vertical Canvas Container */}
      <div className="relative w-full max-w-[450px] aspect-[9/16] bg-black md:rounded-[32px] md:border-[6px] md:border-zinc-800 shadow-2xl overflow-hidden flex flex-col justify-between">
        
        {/* BACKGROUND MEDIA */}
        <div className="absolute inset-0 z-0">
          <AnimatePresence mode="wait">
            <motion.img
              key={activeStep}
              src={currentStep.image_url || article.thumbnail_url}
              alt={currentStep.title}
              className="w-full h-full object-cover"
              initial={{ opacity: 0, scale: 1.1 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.4 }}
            />
          </AnimatePresence>
          {/* Gradient Overlay untuk kenyamanan membaca teks */}
          <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/20 to-black/90" />
        </div>

        {/* TOP OVERLAY: PROGRESS BAR & METADATA */}
        <div className="relative z-10 p-4 space-y-3">
          {/* IG-style Segmented Progress Bar */}
          <div className="flex gap-1.5 w-full">
            {steps.map((_, index) => (
              <div key={index} className="h-1 bg-white/30 rounded-full flex-1 overflow-hidden">
                <div 
                  className="h-full bg-white transition-all duration-75"
                  style={{
                    width: index === activeStep ? `${progress}%` : index < activeStep ? '100%' : '0%'
                  }}
                />
              </div>
            ))}
          </div>

          {/* Header Controls */}
          <div className="flex items-center justify-between">
            <Link href="/blog" className="flex items-center gap-2 text-white hover:opacity-80">
              <ArrowLeft className="size-5" />
              <span className="text-xs font-bold uppercase tracking-wider">Keluar</span>
            </Link>
            
            <div className="flex items-center gap-3">
              <button onClick={() => setIsMuted(!isMuted)} className="text-white hover:opacity-80">
                {isMuted ? <VolumeX className="size-5" /> : <Volume2 className="size-5" />}
              </button>
            </div>
          </div>
        </div>

        {/* TAP DETECTORS (Sisi Kiri/Kanan untuk Navigasi Instan) */}
        <div className="absolute inset-0 z-20 flex">
          <div className="w-1/3 h-full cursor-w-resize" onClick={handlePrev} />
          <div className="w-2/3 h-full cursor-e-resize" onClick={handleNext} />
        </div>

        {/* RIGHT SIDEBAR (TikTok-style Interaction) */}
        <div className="absolute right-4 bottom-32 z-30 flex flex-col gap-6 items-center">
          {/* Tombol Like */}
          <button 
            onClick={() => setIsLiked(!isLiked)} 
            className="flex flex-col items-center gap-1 group"
          >
            <div className={`p-3 rounded-full transition-transform active:scale-75 ${isLiked ? 'bg-red-500 text-white' : 'bg-black/50 text-white border border-white/20'}`}>
              <Heart className={`size-5 ${isLiked ? 'fill-current' : ''}`} />
            </div>
            <span className="text-[10px] text-white font-medium">{isLiked ? 1 : 0}</span>
          </button>

          {/* Tombol Share */}
          <button className="flex flex-col items-center gap-1">
            <div className="p-3 rounded-full bg-black/50 text-white border border-white/20 active:scale-75">
              <Share2 className="size-5" />
            </div>
            <span className="text-[10px] text-white font-medium">Bagikan</span>
          </button>
        </div>

        {/* BOTTOM CONTENT OVERLAY */}
        <div className="relative z-30 p-6 pt-20 bg-gradient-to-t from-black via-black/85 to-transparent">
          <div className="space-y-4 max-w-[85%]">
            <div className="inline-block px-3 py-1 bg-primary/20 border border-primary/30 rounded-full">
              <span className="text-[9px] font-extrabold uppercase tracking-widest text-primary">
                {article.category || 'TIPS'} • STEP {activeStep + 1} OF {steps.length}
              </span>
            </div>

            <h2 className="text-xl font-extrabold text-white leading-tight uppercase tracking-tight">
              {currentStep.title}
            </h2>

            <p className="text-zinc-300 text-sm line-clamp-4 font-normal leading-relaxed">
              {currentStep.description}
            </p>
          </div>

          {/* Swipe Up / Scroll hint */}
          <div className="mt-8 flex justify-center items-center flex-col gap-1 opacity-70">
            <div className="w-1.5 h-1.5 bg-white rounded-full animate-bounce" />
            <span className="text-[9px] uppercase font-bold tracking-widest text-white">Tap/Geser untuk Lanjut</span>
          </div>
        </div>

      </div>
    </main>
  )
}
```

---

## 🔥 Keunggulan Implementasi Ini
1. **Interactive Experience**: Pengguna bisa membaca artikel layaknya menonton Story/TikTok, sangat cocok untuk tips tutorial langkah demi langkah.
2. **Mobile First**: Desain auto-responsive yang langsung pas di genggaman HP.
3. **Framer Motion Transition**: Animasi pergantian slide yang mulus memberikan kesan modern dan premium.
4. **Auto-play Progress**: Slide akan bergeser otomatis layaknya status IG, tapi pembaca juga bebas mengklik manual.

Bagaimana menurutmu? Apakah kita mau langsung memodifikasi halaman blog di `apps/landingpage/src/app/blog/[slug]/page.tsx` untuk menggunakan format story interaktif ini?
