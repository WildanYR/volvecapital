'use client'

import { useQuery } from '@tanstack/react-query'
import { useState, useEffect } from 'react'
import { api } from '@/lib/api'
import { 
  Mail, 
  RefreshCw, 
  AlertCircle,
  Calendar,
  Copy,
  ExternalLink,
  ShieldAlert,
  Inbox
} from 'lucide-react'
import { toast } from 'sonner'
import { motion, AnimatePresence } from 'framer-motion'

interface Message {
  id: string
  subject: string
  email_date: string
  parsed_context: string
  parsed_data: string
}

interface PortalData {
  account: {
    email: string
    profile_name: string
    expired_at: string
  }
  messages: Message[]
  limit: {
    remaining: number
    total: number
  }
}

interface EmailPortalProps {
  token: string
}

export function EmailPortal({ token }: EmailPortalProps) {
  const [countdown, setCountdown] = useState(30)

  const { data, isLoading, isError, error, refetch, isFetching } = useQuery<PortalData>({
    queryKey: ['portal-data', token],
    queryFn: async () => {
      const { data } = await api.get(`/public/email-access/${token}`)
      return data
    },
    refetchInterval: 30000,
    retry: false,
  })

  useEffect(() => {
    if (isFetching) {
      setCountdown(30)
      return
    }

    const timer = setInterval(() => {
      setCountdown(prev => {
        if (prev <= 1) return 30
        return prev - 1
      })
    }, 1000)

    return () => clearInterval(timer)
  }, [isFetching])

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
    toast.success('Disalin ke clipboard!')
  }

  const formatDateTime = (dateStr: string) => {
    try {
      const date = new Date(dateStr)
      return new Intl.DateTimeFormat('id-ID', {
        hour: '2-digit',
        minute: '2-digit',
        day: '2-digit',
        month: 'short',
      }).format(date)
    } catch (e) {
      return dateStr
    }
  }

  if (isLoading) {
    return (
      <div className="w-full p-12 bg-slate-50 border border-slate-100 rounded-[32px] flex flex-col items-center justify-center gap-4">
        <RefreshCw className="size-8 text-[#f97316] animate-spin" />
        <p className="text-sm font-bold text-slate-400 uppercase tracking-widest">Menghubungkan ke Portal...</p>
      </div>
    )
  }

  if (isError) {
    return (
      <div className="w-full p-12 bg-red-50 border border-red-100 rounded-[32px] flex flex-col items-center text-center gap-4">
        <div className="p-4 bg-red-100 rounded-full">
          <ShieldAlert className="size-8 text-red-500" />
        </div>
        <div>
          <h4 className="text-lg font-black text-red-600 mb-1">Gagal Memuat Portal</h4>
          <p className="text-sm text-red-400 font-medium">{(error as any)?.message || 'Terjadi kesalahan sistem'}</p>
        </div>
        <button 
          onClick={() => refetch()}
          className="px-6 py-2 bg-red-500 text-white font-bold rounded-xl text-xs uppercase tracking-widest hover:bg-red-600 transition-all"
        >
          Coba Lagi
        </button>
      </div>
    )
  }

  // Filter messages from the last 15 minutes like in the dashboard
  const messages = (data?.messages || []).filter((msg) => {
    const emailDate = new Date(msg.email_date)
    const fifteenMinutesAgo = new Date(Date.now() - 15 * 60 * 1000)
    return emailDate >= fifteenMinutesAgo
  })

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-orange-50 rounded-lg">
            <Mail className="size-5 text-[#f97316]" />
          </div>
          <h3 className="text-xl font-black text-[#0f172a] tracking-tight">Email OTP Inbox</h3>
        </div>
        <div className="flex items-center gap-4">
          <div className="hidden md:flex flex-col items-end">
            <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Sisa Kuota</p>
            <p className="text-xs font-black text-[#0f172a]">{data?.limit?.remaining ?? '...'} / {data?.limit?.total ?? 10}</p>
          </div>
          <div className="flex items-center gap-2 px-3 py-1 bg-emerald-50 text-emerald-600 rounded-full border border-emerald-100">
            <div className="size-1.5 bg-emerald-500 rounded-full animate-pulse" />
            <span className="text-[10px] font-black uppercase tracking-widest">Real-time</span>
          </div>
        </div>
      </div>

      {/* Info Warning */}
      <div className="bg-[#0f172a] border border-slate-800 rounded-2xl p-5 flex items-start gap-4">
        <div className="bg-white/10 p-2 rounded-lg shrink-0">
          <AlertCircle className="size-5 text-orange-400" />
        </div>
        <div className="space-y-1">
          <p className="text-[10px] font-black text-orange-400 uppercase tracking-widest">Peringatan Penting</p>
          <p className="text-xs text-slate-300 font-medium leading-relaxed">
            Setelah request kode/link dari aplikasi, tunggu <strong>1 menit</strong>. Pesan akan muncul otomatis di bawah.
          </p>
          <p className="text-[10px] text-slate-500 font-bold flex items-center gap-1.5 pt-1">
            <RefreshCw className={`size-3 ${countdown < 5 ? 'animate-spin text-[#f97316]' : ''}`} />
            Update dalam {countdown} detik...
          </p>
        </div>
      </div>

      {/* Messages List */}
      <div className="space-y-4">
        {messages.length === 0 ? (
          <div className="p-16 border-2 border-dashed border-slate-100 rounded-[32px] flex flex-col items-center text-center gap-4 bg-slate-50/30">
            <div className="p-4 bg-white rounded-full shadow-sm">
              <Inbox className="size-8 text-slate-200" />
            </div>
            <div className="max-w-xs">
              <p className="text-sm font-black text-[#0f172a] mb-1">Belum Ada Pesan</p>
              <p className="text-xs text-slate-400 font-medium leading-relaxed">Pesan OTP atau link reset akan otomatis muncul di sini setelah Anda request dari aplikasi/TV.</p>
            </div>
          </div>
        ) : (
          <AnimatePresence mode="popLayout">
            {messages.map((msg, idx) => (
              <motion.div
                key={msg.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.1 }}
                className="bg-white border border-slate-100 rounded-2xl p-5 hover:border-[#f97316] transition-all group relative overflow-hidden shadow-sm"
              >
                <div className="flex flex-col md:flex-row justify-between items-start gap-4">
                  <div className="space-y-2 flex-grow">
                    <div className="flex items-center gap-2">
                      <span className="px-2 py-0.5 bg-orange-50 text-[#f97316] text-[8px] font-black uppercase tracking-widest rounded-md border border-orange-100">
                        {msg.parsed_context.replace('NETFLIX_', '').replace(/_/g, ' ')}
                      </span>
                      <span className="text-[10px] text-slate-400 font-bold flex items-center gap-1">
                        <Calendar className="size-3" />
                        {formatDateTime(msg.email_date)}
                      </span>
                    </div>
                    <h4 className="text-base font-black text-[#0f172a]">{msg.subject}</h4>
                  </div>
                  
                  {msg.parsed_data.startsWith('http') && (
                    <a 
                      href={msg.parsed_data}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-4 py-2 bg-slate-50 hover:bg-[#0f172a] hover:text-white text-[#0f172a] text-[10px] font-black uppercase tracking-widest rounded-lg border border-slate-100 transition-all flex items-center gap-2 shrink-0"
                    >
                      Buka Link <ExternalLink className="size-3" />
                    </a>
                  )}
                </div>

                <div className="mt-4 p-4 bg-slate-50 rounded-xl border border-slate-100 flex items-center justify-between gap-4">
                  <div className="overflow-hidden">
                    <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-0.5">Kode / Data</p>
                    <p className="text-xl font-mono font-black text-[#f97316] truncate leading-none">
                      {msg.parsed_data}
                    </p>
                  </div>
                  <button 
                    onClick={() => copyToClipboard(msg.parsed_data)}
                    className="p-2 hover:bg-orange-50 text-slate-400 hover:text-[#f97316] transition-all rounded-lg"
                  >
                    <Copy className="size-5" />
                  </button>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        )}
      </div>

      <div className="flex items-center justify-center gap-2 pt-4 opacity-30 grayscale pointer-events-none">
        <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest italic">Powered by Volve Engine v2</span>
      </div>
    </div>
  )
}
