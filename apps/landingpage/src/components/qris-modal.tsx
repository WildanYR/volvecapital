'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, CheckCircle2, Loader2, RefreshCw, AlertCircle, ShieldCheck } from 'lucide-react'
import { QRCodeSVG } from 'qrcode.react'
import { api } from '@/lib/api'
import { toast } from 'sonner'
import { formatCurrency } from '@/lib/format'

interface QrisModalProps {
  isOpen: boolean
  onClose: () => void
  qrString: string
  orderId: string
  amount: number
  productName: string
}

export function QrisModal({ isOpen, onClose, qrString, orderId, amount, productName }: QrisModalProps) {
  const [isChecking, setIsChecking] = useState(false)
  const [status, setStatus] = useState<'PENDING' | 'PAID' | 'FAILED'>('PENDING')
  const [timeLeft, setTimeLeft] = useState(1800) // 30 minutes

  useEffect(() => {
    if (!isOpen) return
    const timer = setInterval(() => {
      setTimeLeft((prev) => (prev > 0 ? prev - 1 : 0))
    }, 1000)
    return () => clearInterval(timer)
  }, [isOpen])

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  const checkStatus = async () => {
    setIsChecking(true)
    try {
      const { data } = await api.get(`/public/payment/status/${orderId}`)
      if (data.payment_status === 'PAID') {
        setStatus('PAID')
        toast.success('Pembayaran Berhasil!')
        setTimeout(() => {
          window.location.href = `/success?order_id=${orderId}`
        }, 2000)
      } else {
        toast.info('Pembayaran belum diterima. Silakan selesaikan pembayaran Anda.')
      }
    } catch (error) {
      toast.error('Gagal mengecek status pembayaran')
    } finally {
      setIsChecking(false)
    }
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[300] flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/95 backdrop-blur-xl"
          />
          
          <motion.div
            initial={{ scale: 0.9, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.9, opacity: 0, y: 20 }}
            className="relative bg-[#121212] w-full max-w-md rounded-[48px] p-8 md:p-10 border border-white/10 shadow-[0_0_100px_rgba(255,184,0,0.1)] overflow-hidden"
          >
            {status === 'PAID' ? (
              <div className="flex flex-col items-center justify-center py-12 text-center space-y-6">
                <div className="size-24 bg-green-500/20 rounded-full flex items-center justify-center">
                  <CheckCircle2 className="size-12 text-green-500" />
                </div>
                <h2 className="text-3xl font-black text-white">Pembayaran Berhasil!</h2>
                <p className="text-gray-400 font-bold">Mengalihkan Anda ke halaman sukses...</p>
                <Loader2 className="size-6 animate-spin text-[#FFB800]" />
              </div>
            ) : (
              <>
                <div className="flex items-center justify-between mb-8">
                  <div className="flex items-center gap-3 text-[#FFB800]">
                    <ShieldCheck className="size-6" />
                    <span className="text-[10px] font-black uppercase tracking-[0.3em]">Pembayaran QRIS</span>
                  </div>
                  <button onClick={onClose} className="text-gray-500 hover:text-white transition-colors">
                    <X className="size-6" />
                  </button>
                </div>

                <div className="text-center mb-8">
                  <h2 className="text-2xl font-black text-white mb-2">{productName}</h2>
                  <p className="text-3xl font-black text-[#FFB800]">{formatCurrency(amount)}</p>
                </div>

                <div className="bg-white p-6 rounded-3xl mb-8 flex flex-col items-center shadow-[0_0_50px_rgba(255,255,255,0.1)]">
                  <QRCodeSVG 
                    value={qrString} 
                    size={240}
                    level="H"
                    includeMargin={false}
                  />
                  <div className="mt-4 flex items-center gap-2">
                    <img src="/qris-logo.png" alt="QRIS" className="h-6 opacity-80" onError={(e) => e.currentTarget.style.display = 'none'} />
                    <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Scan menggunakan aplikasi bank atau e-wallet</span>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="flex items-center justify-between bg-white/[0.03] p-4 rounded-2xl border border-white/5">
                    <div className="flex items-center gap-2 text-gray-400">
                      <RefreshCw className={`size-4 ${timeLeft === 0 ? '' : 'animate-spin-slow'}`} />
                      <span className="text-xs font-bold">Berakhir dalam</span>
                    </div>
                    <span className={`text-sm font-black ${timeLeft < 300 ? 'text-red-500' : 'text-white'}`}>
                      {formatTime(timeLeft)}
                    </span>
                  </div>

                  <button
                    onClick={checkStatus}
                    disabled={isChecking || timeLeft === 0}
                    className="w-full bg-white text-black font-black py-4 rounded-2xl flex items-center justify-center gap-3 hover:scale-105 active:scale-[0.98] transition-all disabled:opacity-50 text-sm uppercase tracking-widest"
                  >
                    {isChecking ? (
                      <Loader2 className="size-5 animate-spin" />
                    ) : (
                      <>
                        Cek Status Pembayaran
                        <RefreshCw className="size-5" />
                      </>
                    )}
                  </button>
                  
                  <div className="flex items-center gap-2 justify-center text-gray-600 text-[10px] font-bold uppercase tracking-wider">
                    <AlertCircle className="size-3" />
                    <span>Otomatis aktif setelah pembayaran terdeteksi</span>
                  </div>
                </div>
              </>
            )}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  )
}
