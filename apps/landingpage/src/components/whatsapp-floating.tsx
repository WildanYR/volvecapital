'use client'

import { motion, AnimatePresence } from 'framer-motion'
import { MessageCircle } from 'lucide-react'
import { useSettings } from '@/hooks/use-settings'
import { useTenant } from '@/hooks/use-tenant'
import { useState, useEffect } from 'react'

export function WhatsAppFloating() {
  const { tenantId } = useTenant()
  const { data: settings } = useSettings(tenantId || '')
  const [isHovered, setIsHovered] = useState(false)
  const [showTooltip, setShowTooltip] = useState(false)

  const whatsappNumber = settings?.whatsapp_number || '6285189307255'

  // Periodic tooltip for mobile/auto-attention
  useEffect(() => {
    const interval = setInterval(() => {
      if (!isHovered) {
        setShowTooltip(true)
        setTimeout(() => setShowTooltip(false), 3000)
      }
    }, 8000)

    return () => clearInterval(interval)
  }, [isHovered])

  return (
    <motion.div
      drag
      dragMomentum={false}
      initial={{ opacity: 0, scale: 0.8, y: 20 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      whileHover={{ scale: 1.1 }}
      whileTap={{ scale: 0.9 }}
      whileDrag={{ scale: 1.2, rotate: 15, cursor: 'grabbing' }}
      onHoverStart={() => {
        setIsHovered(true)
        setShowTooltip(true)
      }}
      onHoverEnd={() => {
        setIsHovered(false)
        setShowTooltip(false)
      }}
      className="fixed bottom-8 right-8 z-[100] w-16 h-16 flex items-center justify-center cursor-grab active:cursor-grabbing"
      style={{ touchAction: 'none' }}
    >
      <AnimatePresence>
        {(isHovered || showTooltip) && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.5, filter: 'blur(10px)' }}
            animate={{ opacity: 1, y: -60, scale: 1, filter: 'blur(0px)' }}
            exit={{ opacity: 0, y: 10, scale: 0.5, filter: 'blur(10px)' }}
            className="absolute right-0 bg-white text-[#0f172a] text-[10px] font-black px-4 py-2 rounded-2xl shadow-[0_15px_30px_rgba(0,0,0,0.15)] border border-slate-100 whitespace-nowrap uppercase tracking-widest flex items-center gap-2 pointer-events-none"
          >
            <div className="size-2 bg-[#25D366] rounded-full animate-pulse" />
            Butuh Bantuan?
            <div className="absolute -bottom-1 right-7 w-3 h-3 bg-white rotate-45 border-r border-b border-slate-100" />
          </motion.div>
        )}
      </AnimatePresence>

      <a
        href={`https://wa.me/${whatsappNumber}`}
        target="_blank"
        rel="noopener noreferrer"
        className="w-full h-full bg-[#25D366] text-white rounded-full shadow-[0_10px_40px_rgba(37,211,102,0.4)] flex items-center justify-center relative overflow-hidden group"
      >
        <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300" />
        <MessageCircle className="size-8 fill-white/20 relative z-10" />
        
        {/* Pulse Effect */}
        <div className="absolute inset-0 rounded-full bg-[#25D366] animate-ping opacity-20" />
      </a>
    </motion.div>
  )
}
