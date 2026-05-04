'use client'

import { useMutation, useQuery } from '@tanstack/react-query'
import { Wallet, AlertTriangle, CheckCircle2, XCircle, Copy } from 'lucide-react'
import { AccountServiceGenerator } from '@/dashboard/services/account.service'
import { useAuth } from '@/dashboard/context-providers/auth.provider'
import { API_URL } from '@/dashboard/constants/api-url.cont'
import { Button } from '@/dashboard/components/ui/button'
import { Card, CardContent } from '@/dashboard/components/ui/card'
import { toast } from 'sonner'
import { useState } from 'react'

export function PendingTopupNotification() {
  const auth = useAuth()
  
  // Gunakan AccountServiceGenerator (PascalCase)
  // Dan pastikan ambil accessToken dari auth.tenant
  const accountService = AccountServiceGenerator(
    API_URL, 
    auth.tenant?.accessToken || '', 
    auth.tenant?.id || ''
  )
  
  const [dismissed, setDismissed] = useState<string[]>([])

  const { data: pendingTopups, refetch } = useQuery({
    queryKey: ['pendingTopups', auth.tenant?.id],
    queryFn: () => accountService.getPendingTopups(),
    refetchInterval: 5000, 
    enabled: !!auth.tenant?.accessToken,
  })

  const confirmTopupMutation = useMutation({
    mutationFn: (accountId: string) => accountService.confirmTopup(accountId),
    onSuccess: () => {
      toast.success('Konfirmasi pembayaran berhasil dikirim ke Bot!')
      refetch()
    },
    onError: (error: any) => {
      toast.error(`Gagal konfirmasi: ${error.message}`)
    },
  })

  const visibleTopups = pendingTopups?.filter(t => !dismissed.includes(t.accountId)) ?? []

  const handleCopy = (text: string) => {
    // Ambil hanya angka saja
    const numbersOnly = text.replace(/\D/g, '')
    if (numbersOnly) {
      navigator.clipboard.writeText(numbersOnly)
      toast.success(`Berhasil disalin: ${numbersOnly}`)
    } else {
      // Jika tidak ada angka, salin teks aslinya
      navigator.clipboard.writeText(text)
      toast.success(`Berhasil disalin: ${text}`)
    }
  }

  if (visibleTopups.length === 0) return null

  return (
    <div className="fixed top-20 right-6 z-50 flex flex-col gap-4 max-w-sm w-full animate-in slide-in-from-right duration-500">
      <div className="flex flex-col gap-4 w-full">
      {visibleTopups.map((topup) => (
        <Card key={topup.accountId} className="border-red-600 shadow-2xl bg-background backdrop-blur-md text-white overflow-hidden ring-2 ring-red-600/20">
          <div className="bg-red-600 px-4 py-2 flex items-center justify-between">
            <div className="flex items-center gap-2 text-sm font-bold">
              <Wallet className="h-4 w-4" />
              KONFIRMASI PEMBAYARAN NETFLIX
            </div>
            <button 
              onClick={() => setDismissed(prev => [...prev, topup.accountId])}
              className="text-white/80 hover:text-white"
            >
              <XCircle className="h-4 w-4" />
            </button>
          </div>
          <CardContent className="p-4 space-y-4">
            <div className="flex gap-3 items-start">
              <div className="bg-red-600/20 p-2 rounded-lg">
                <AlertTriangle className="h-5 w-5 text-red-600" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium text-slate-300">Akun: <span className="text-white font-bold">{topup.email}</span></p>
                <div className="flex items-center justify-between mt-1">
                  <p className="text-sm font-medium text-slate-300 italic">
                    Billing: <span className="text-red-500 font-mono text-sm not-italic font-bold">{topup.billing || 'Default'}</span>
                  </p>
                  <button 
                    onClick={() => handleCopy(topup.billing || '')}
                    className="p-1.5 hover:bg-white/10 rounded-md transition-colors text-slate-400 hover:text-red-500"
                    title="Salin Angka Saja"
                  >
                    <Copy className="h-4 w-4" />
                  </button>
                </div>
                <p className="text-[11px] text-slate-400 mt-2 leading-relaxed">
                  Bot sedang menunggu di halaman pembayaran. Silakan pastikan dana tersedia di kartu/e-wallet Anda, lalu klik tombol di bawah.
                </p>
              </div>
            </div>

            <div className="flex gap-2">
              <Button 
                onClick={() => confirmTopupMutation.mutate(topup.accountId)}
                disabled={confirmTopupMutation.isPending}
                className="flex-1 bg-red-600 hover:bg-red-700 text-white font-bold h-10"
              >
                {confirmTopupMutation.isPending ? (
                  "Memproses..."
                ) : (
                  <>
                    <CheckCircle2 className="mr-2 h-4 w-4" />
                    Saya Sudah Bayar
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      ))}
      </div>
    </div>
  )
}
