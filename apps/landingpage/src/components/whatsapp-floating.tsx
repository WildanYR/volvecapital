'use client'

import { motion } from 'framer-motion'
import { MessageCircle } from 'lucide-react'
import { useSettings } from '@/hooks/use-settings'
import { useTenant } from '@/hooks/use-tenant'

export function WhatsAppFloating() {
  const { tenantId } = useTenant()
  const { data: settings } = useSettings(tenantId || '')

  const whatsappNumber = settings?.whatsapp_number || '6285189307255'

  return (
    <motion.a
      initial={{ opacity: 0, scale: 0.8, y: 20 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      whileHover={{ scale: 1.1 }}
      whileTap={{ scale: 0.9 }}
      href={`https://wa.me/${whatsappNumber}`}
      target="_blank"
      rel="noopener noreferrer"
      className="fixed bottom-8 right-8 z-[100] bg-[#25D366] text-white p-4 rounded-full shadow-[0_10px_30px_rgba(37,211,102,0.4)] flex items-center justify-center group"
    >
      <div className="absolute -top-12 right-0 bg-white text-black text-[10px] font-black px-3 py-1.5 rounded-lg shadow-xl opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none uppercase tracking-widest border border-gray-100">
        Butuh Bantuan?
        <div className="absolute -bottom-1 right-4 w-2 h-2 bg-white rotate-45 border-r border-b border-gray-100" />
      </div>
      <MessageCircle className="size-8 fill-white/20" />
    </motion.a>
  )
}
