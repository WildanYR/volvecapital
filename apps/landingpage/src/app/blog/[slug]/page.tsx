'use client'

import { useEffect, useState, use } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { FileText, ArrowLeft, Clock, Share2, Heart } from 'lucide-react'
import { api } from '@/lib/api'
import Link from 'next/link'

export default function BlogDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const resolvedParams = use(params)
  return <BlogStoryPage slug={resolvedParams.slug} />
}

function BlogStoryPage({ slug }: { slug: string }) {
  const [article, setArticle] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [activeStep, setActiveStep] = useState(0)
  const [isLiked, setIsLiked] = useState(false)
  const [likeCount, setLikeCount] = useState(0)
  const [isShareOpen, setIsShareOpen] = useState(false)

  useEffect(() => {
    const fetchArticle = async () => {
      try {
        const { data } = await api.get(`/public/article/${slug}`)
        setArticle(data)
        // Initialize mock likes randomly for premium feel
        setLikeCount(Math.floor(Math.random() * 150) + 50)
      } catch (error) {
        console.error('Failed to fetch article:', error)
      } finally {
        setIsLoading(false)
      }
    }
    fetchArticle()
  }, [slug])

  const [slideDuration, setSlideDuration] = useState(6000)

  // Reset slide duration when activeStep changes
  useEffect(() => {
    setSlideDuration(6000)
  }, [activeStep])

  // Progress Bar effect (auto-advance slide)
  useEffect(() => {
    if (isLoading || !article) return

    const stepsCount = article.content_steps && article.content_steps.length > 0
      ? article.content_steps.length
      : 1

    const timer = setTimeout(() => {
      setActiveStep((curr) => (curr < stepsCount - 1 ? curr + 1 : 0))
    }, slideDuration)

    return () => {
      clearTimeout(timer)
    }
  }, [isLoading, article, activeStep, slideDuration])

  if (isLoading) {
    return (
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center">
        <div className="size-12 border-4 border-zinc-800 border-t-primary rounded-full animate-spin" />
      </div>
    )
  }

  if (!article) {
    return (
      <div className="min-h-screen bg-zinc-950 flex flex-col items-center justify-center p-6 text-center">
        <h1 className="text-2xl font-black text-white mb-6 uppercase">Artikel Tidak Ditemukan</h1>
        <Link href="/blog" className="text-primary font-black uppercase tracking-widest hover:underline flex items-center gap-2">
          <ArrowLeft className="size-4" /> Kembali ke Blog
        </Link>
      </div>
    )
  }

  const steps = article.content_steps && article.content_steps.length > 0
    ? article.content_steps
    : [{ title: article.title, description: article.subtitle || 'Klik untuk membaca selengkapnya.', image_url: article.thumbnail_url }]

  const currentStep = steps[activeStep] || steps[0]

  const handleNext = (e: React.MouseEvent) => {
    e.stopPropagation()
    if (activeStep < steps.length - 1) {
      setActiveStep(activeStep + 1)
    } else {
      // Loop back
      setActiveStep(0)
    }
  }

  const handlePrev = (e: React.MouseEvent) => {
    e.stopPropagation()
    if (activeStep > 0) {
      setActiveStep(activeStep - 1)
    } else {
      // Loop to end
      setActiveStep(steps.length - 1)
    }
  }

  const handleLike = (e: React.MouseEvent) => {
    e.stopPropagation()
    setIsLiked(!isLiked)
    setLikeCount(prev => isLiked ? prev - 1 : prev + 1)
  }

  const handleShare = (e: React.MouseEvent) => {
    e.stopPropagation()
    if (navigator.share) {
      navigator.share({
        title: article.title,
        text: article.subtitle,
        url: window.location.href,
      }).catch(console.error)
    } else {
      navigator.clipboard.writeText(window.location.href)
      setIsShareOpen(true)
      setTimeout(() => setIsShareOpen(false), 2000)
    }
  }

  const renderMedia = (url: string, title: string) => {
    if (!url) {
      return (
        <div className="w-full h-full bg-zinc-900 flex items-center justify-center opacity-40">
          <FileText className="size-16 text-white" />
        </div>
      )
    }

    // 1. YouTube & YouTube Shorts detection
    const ytRegex = /(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|shorts\/|watch\?v=)|youtu\.be\/)([^"&?\/\s]{11})/i
    const ytMatch = url.match(ytRegex)
    if (ytMatch && ytMatch[1]) {
      const videoId = ytMatch[1]
      return (
        <iframe
          src={`https://www.youtube.com/embed/${videoId}?autoplay=1&mute=1&loop=1&playlist=${videoId}&controls=0&modestbranding=1&rel=0`}
          title={title}
          className="w-full h-full border-0 scale-[1.3] origin-center"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
        />
      )
    }

    // 2. TikTok video detection
    const tiktokRegex = /tiktok\.com\/(?:@[^\/]+\/video\/|t\/|vm\/|embed\/v2\/)?([a-zA-Z0-9]+)/i
    const tiktokMatch = url.match(tiktokRegex)
    const isVideoId = /^\d+$/.test(tiktokMatch?.[1] || '')
    if (tiktokMatch && tiktokMatch[1] && isVideoId) {
      const videoId = tiktokMatch[1]
      return (
        <iframe
          src={`https://www.tiktok.com/embed/v2/${videoId}`}
          title={title}
          className="w-full h-full border-0 scale-[1.35] origin-center"
          allow="fullscreen"
        />
      )
    }

    // 3. Direct video file detection (MP4/WebM)
    const isVideoFile = /\.(mp4|webm|ogg)(?:\?.*)?$/i.test(url)
    if (isVideoFile) {
      return (
        <video
          src={url}
          autoPlay
          loop={steps.length === 1}
          muted
          playsInline
          className="w-full h-full object-cover"
          onLoadedMetadata={(e) => {
            const vid = e.currentTarget
            if (vid.duration) {
              setSlideDuration(vid.duration * 1000)
            }
          }}
        />
      )
    }

    // 4. Fallback to image
    return (
      <img
        src={url}
        alt={title}
        className="w-full h-full object-cover"
      />
    )
  }

  return (
    <main className="min-h-screen bg-zinc-950 flex items-center justify-center overflow-hidden select-none relative">
      {/* Desktop Background Blur - Glassmorphism Feel */}
      <div 
        className="absolute inset-0 bg-cover bg-center filter blur-3xl opacity-20 scale-105 hidden md:block"
        style={{ backgroundImage: `url(${currentStep.image_url || article.thumbnail_url})` }}
      />
      
      {/* Back to Blog Floating Button for Desktop */}
      <div className="absolute top-8 left-8 z-40 hidden md:block">
        <Link 
          href="/blog" 
          className="flex items-center gap-2 text-white/60 hover:text-white bg-white/10 hover:bg-white/20 px-4 py-2.5 rounded-full border border-white/10 backdrop-blur-md transition-all font-black text-xs uppercase tracking-widest"
        >
          <ArrowLeft className="size-4" /> Kembali ke Blog
        </Link>
      </div>

      {/* Main 16:9 / Full-Screen Canvas Container */}
      <div className="relative w-full h-[100dvh] md:h-[88vh] md:max-w-[450px] md:aspect-[9/16] bg-black md:rounded-[32px] md:border-[6px] md:border-zinc-800/80 shadow-[0_0_80px_rgba(0,0,0,0.8)] overflow-hidden flex flex-col justify-between z-10">
        
        {/* Background Image / Media */}
        <div className="absolute inset-0 z-0">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeStep}
              className="w-full h-full relative"
              initial={{ opacity: 0, scale: 1.05 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.4 }}
            >
              {renderMedia(currentStep.image_url, currentStep.title)}
            </motion.div>
          </AnimatePresence>
          {/* Enhanced Vignette/Gradients */}
          <div className="absolute inset-0 bg-gradient-to-b from-black/80 via-black/10 to-black/95 z-[1]" />
        </div>

        {/* Top Overlay: Progress indicators & Controls */}
        <div className="relative z-20 p-4 space-y-4">
          {/* Segmented Progress Indicators */}
          <div className="flex gap-1.5 w-full">
            <style key={`${activeStep}-${slideDuration}`}>{`
              @keyframes playProgress {
                from { width: 0%; }
                to { width: 100%; }
              }
              .animate-progress-bar {
                animation: playProgress ${slideDuration}ms linear forwards;
              }
            `}</style>
            {steps.map((_: any, index: number) => (
              <div key={index} className="h-1 bg-white/25 rounded-full flex-1 overflow-hidden">
                <div 
                  className={`h-full bg-white ${index === activeStep ? 'animate-progress-bar' : ''}`}
                  style={{
                    width: index < activeStep ? '100%' : '0%'
                  }}
                />
              </div>
            ))}
          </div>

          {/* Top Row Meta */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <Link href="/blog" className="md:hidden size-8 rounded-full bg-black/40 border border-white/10 flex items-center justify-center text-white backdrop-blur-md">
                <ArrowLeft className="size-4" />
              </Link>
              <div className="flex items-center gap-1.5 text-white/90 font-black uppercase text-[10px] tracking-widest bg-black/35 px-3 py-1.5 rounded-full border border-white/10 backdrop-blur-md shadow-sm">
                <Clock className="size-3 text-primary" />
                {new Date(article.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })}
              </div>
            </div>
            {article.category && (
              <div className="px-3.5 py-1.5 bg-primary text-primary-foreground font-black text-[9px] uppercase tracking-widest rounded-full shadow-lg shadow-primary/20">
                {article.category}
              </div>
            )}
          </div>
        </div>

        {/* Swipe & Tap Nav Area */}
        <div className="absolute inset-0 z-10 flex">
          <div className="w-1/3 h-full cursor-w-resize" onClick={handlePrev} />
          <div className="w-2/3 h-full cursor-e-resize" onClick={handleNext} />
        </div>

        {/* Right Interactions Sidebar (TikTok style) */}
        <div className="absolute right-4 bottom-40 z-30 flex flex-col gap-5 items-center">
          {/* Like Interaction */}
          <button 
            onClick={handleLike} 
            className="flex flex-col items-center gap-1 group"
          >
            <motion.div 
              whileTap={{ scale: 0.8 }}
              className={`p-3 rounded-full transition-all border shadow-lg ${
                isLiked 
                  ? 'bg-red-500 text-white border-red-500' 
                  : 'bg-black/40 text-white border-white/10 hover:border-white/20 backdrop-blur-md'
              }`}
            >
              <Heart className={`size-5 ${isLiked ? 'fill-current' : ''}`} />
            </motion.div>
            <span className="text-[10px] text-white/90 font-bold drop-shadow-md">{likeCount}</span>
          </button>

          {/* Share Interaction */}
          <button 
            onClick={handleShare} 
            className="flex flex-col items-center gap-1"
          >
            <motion.div 
              whileTap={{ scale: 0.8 }}
              className="p-3 rounded-full bg-black/40 text-white border border-white/10 hover:border-white/20 backdrop-blur-md shadow-lg"
            >
              <Share2 className="size-5" />
            </motion.div>
            <span className="text-[10px] text-white/90 font-bold drop-shadow-md">Share</span>
          </button>
        </div>

        {/* Clipboard copy feedback toast */}
        <AnimatePresence>
          {isShareOpen && (
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 20 }}
              className="absolute left-1/2 -translate-x-1/2 bottom-32 z-40 bg-white text-black text-xs font-black px-4 py-2.5 rounded-full shadow-xl"
            >
              Link disalin!
            </motion.div>
          )}
        </AnimatePresence>

        {/* Bottom Content Area */}
        <div className="relative z-20 p-6 pt-24 bg-gradient-to-t from-black via-black/90 to-transparent">
          <div className="space-y-3.5 max-w-[85%]">
            <h3 className="text-lg md:text-xl font-extrabold text-white leading-tight uppercase italic tracking-tight drop-shadow-md">
              {currentStep.title}
            </h3>
            
            <div className="max-h-[140px] overflow-y-auto pr-1 select-text scrollbar-thin">
              <p className="text-zinc-300 text-xs md:text-sm font-medium leading-relaxed drop-shadow-sm whitespace-pre-line">
                {currentStep.description}
              </p>
            </div>
          </div>

          {/* Indicator & Help Text */}
          <div className="mt-8 flex justify-center items-center flex-col gap-1 opacity-50">
            <div className="w-1.5 h-1.5 bg-white rounded-full animate-bounce" />
            <span className="text-[8px] font-black uppercase tracking-[0.2em] text-white">Tap Kiri/Kanan</span>
          </div>
        </div>

      </div>
    </main>
  )
}

