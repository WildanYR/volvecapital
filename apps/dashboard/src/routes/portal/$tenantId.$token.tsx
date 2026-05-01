import { createFileRoute } from '@tanstack/react-router'
import { useQuery } from '@tanstack/react-query'
import { useState, useEffect } from 'react'
import { PortalServiceGenerator } from '@/dashboard/services/portal.service'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/dashboard/components/ui/card'
import { Button } from '@/dashboard/components/ui/button'
import { Badge } from '@/dashboard/components/ui/badge'
import { 
  Mail, 
  ExternalLink, 
  Clock, 
  RefreshCw, 
  AlertCircle,
  Calendar,
  User,
  ShieldCheck,
  CheckCircle2,
  Info
} from 'lucide-react'
import { formatDistanceToNow, format } from 'date-fns'
import { id } from 'date-fns/locale'
import { toast } from 'sonner'

export const Route = createFileRoute('/portal/$tenantId/$token')({
  component: PortalPage,
})

function PortalPage() {
  const { token, tenantId: paramTenantId } = Route.useParams()
  const [tenantId, setTenantId] = useState(paramTenantId)
  const apiUrl = import.meta.env.VITE_MASTER_URL || 'http://localhost:4000'

  // Smart Detection: Jika tenantId adalah 'master', coba cek subdomain
  useEffect(() => {
    if (paramTenantId === 'master' && typeof window !== 'undefined') {
      const hostname = window.location.hostname
      const parts = hostname.split('.')
      
      let detectedTenant = paramTenantId
      if (parts.length >= 2) {
        if (parts[parts.length - 1] === 'localhost' && parts.length > 1) {
          detectedTenant = parts[0]
        } else if (parts.length >= 3) {
          detectedTenant = parts[0]
        }
      }
      
      if (detectedTenant !== paramTenantId) {
        setTenantId(detectedTenant)
      }
    }
  }, [paramTenantId])
  
  const portalService = PortalServiceGenerator(apiUrl, tenantId)
  
  const { data, isLoading, isError, error, refetch, isFetching } = useQuery({
    queryKey: ['portal-data', token, tenantId],
    queryFn: () => portalService.getPortalData(token),
    refetchInterval: 30000,
    retry: false,
  })

  const [countdown, setCountdown] = useState(30)

  useEffect(() => {
    if (isFetching) {
      setCountdown(30)
      return
    }

    const timer = setInterval(() => {
      setCountdown(prev => {
        if (prev <= 1) {
          return 30
        }
        return prev - 1
      })
    }, 1000)

    return () => clearInterval(timer)
  }, [isFetching])

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center p-6">
        <Card className="w-full max-w-sm bg-white/5 border-white/10 p-8 flex flex-col items-center gap-6">
          <RefreshCw className="size-10 text-primary animate-spin" />
          <p className="text-muted-foreground animate-pulse text-center">Menghubungkan ke server aman...</p>
        </Card>
      </div>
    )
  }

  if (isError) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center p-6">
        <Card className="w-full max-w-sm border-destructive/20 bg-destructive/5 shadow-2xl shadow-destructive/10">
          <CardHeader className="text-center space-y-4 pb-6">
            <div className="mx-auto w-16 h-16 bg-destructive/10 rounded-full flex items-center justify-center">
              <AlertCircle className="size-8 text-destructive" />
            </div>
            <CardTitle className="text-2xl font-black">Akses Ditolak</CardTitle>
            <CardDescription className="text-destructive/80 text-base font-medium px-4">
              {error instanceof Error ? error.message : 'Terjadi kesalahan saat memuat portal.'}
            </CardDescription>
          </CardHeader>
          <CardContent className="flex justify-center pb-8">
            <Button 
              variant="destructive" 
              onClick={() => refetch()}
              className="w-full max-w-[200px] font-bold"
            >
              Coba Lagi
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  const account = data?.account
  const messages = (data?.messages || []).filter((msg: any) => {
    const emailDate = new Date(msg.email_date)
    const fifteenMinutesAgo = new Date(Date.now() - 15 * 60 * 1000)
    return emailDate >= fifteenMinutesAgo
  })
  const limit = data?.limit

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white p-4 md:p-8 font-sans selection:bg-primary/30">
      {/* Background Glow */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-primary/10 blur-[120px] rounded-full" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-blue-500/10 blur-[120px] rounded-full" />
      </div>

      <div className="max-w-4xl mx-auto space-y-8 relative">
        {/* Header */}
        <header className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <div className="p-2 bg-primary/20 rounded-lg">
                <ShieldCheck className="size-6 text-primary" />
              </div>
              <h1 className="text-3xl font-extrabold tracking-tight">Buyer Email Portal</h1>
            </div>
            <p className="text-muted-foreground">Akses kode OTP dan link reset secara real-time.</p>
          </div>

          <div className="flex items-center gap-3">
            <Card className="bg-white/5 border-white/10 backdrop-blur-md px-4 py-2 flex items-center gap-3">
              <div className="text-right">
                <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-bold">Kuota Harian</p>
                <p className="text-sm font-mono">{limit?.remaining ?? '...'} / {limit?.total ?? 10} Sisa</p>
              </div>
              <div className="h-8 w-px bg-white/10" />
              <Button 
                variant="ghost" 
                size="icon" 
                onClick={() => refetch()} 
                disabled={isFetching}
                className="hover:bg-primary/20"
              >
                <RefreshCw className={`size-4 ${isFetching ? 'animate-spin' : ''}`} />
              </Button>
            </Card>
          </div>
        </header>

        {/* Account Info Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="bg-white/5 border-white/10 backdrop-blur-md group hover:border-primary/30 transition-all duration-300">
            <CardHeader className="pb-2">
              <CardDescription className="flex items-center gap-2 text-xs uppercase font-bold tracking-widest">
                <Mail className="size-3 text-primary" /> Email Akun
              </CardDescription>
              <CardTitle className="text-lg truncate group-hover:text-primary transition-colors">
                {account?.email}
              </CardTitle>
            </CardHeader>
          </Card>

          <Card className="bg-white/5 border-white/10 backdrop-blur-md group hover:border-primary/30 transition-all duration-300">
            <CardHeader className="pb-2">
              <CardDescription className="flex items-center gap-2 text-xs uppercase font-bold tracking-widest">
                <User className="size-3 text-primary" /> Profil Anda
              </CardDescription>
              <CardTitle className="text-lg group-hover:text-primary transition-colors">
                {account?.profile_name || 'Utama'}
              </CardTitle>
            </CardHeader>
          </Card>

          <Card className="bg-white/5 border-white/10 backdrop-blur-md group hover:border-primary/30 transition-all duration-300">
            <CardHeader className="pb-2">
              <CardDescription className="flex items-center gap-2 text-xs uppercase font-bold tracking-widest">
                <Clock className="size-3 text-primary" /> Sisa Masa Aktif
              </CardDescription>
              <CardTitle className="text-lg group-hover:text-primary transition-colors">
                {account?.expired_at ? (
                  formatDistanceToNow(new Date(account.expired_at), { addSuffix: true, locale: id })
                ) : 'N/A'}
              </CardTitle>
            </CardHeader>
          </Card>
        </div>

        {/* Email Messages */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold flex items-center gap-2">
              <RefreshCw className="size-5 text-primary" /> Pesan Masuk
            </h2>
            <Badge variant="outline" className="bg-primary/5 text-primary border-primary/20">
              Update Otomatis Aktif
            </Badge>
          </div>

          <div className="grid gap-4">
            <div className="bg-blue-500/10 border border-blue-500/20 rounded-xl p-4 flex items-start gap-4 animate-in fade-in slide-in-from-bottom-2 duration-500">
              <div className="bg-blue-500/20 p-2 rounded-lg mt-0.5 shrink-0">
                <Info className="size-5 text-blue-400" />
              </div>
              <div className="space-y-1">
                <p className="text-sm font-bold text-blue-400 uppercase tracking-widest">Peringatan Penting</p>
                <p className="text-sm text-gray-300">
                  Setelah Anda me-request link/kode dari aplikasi, mohon tunggu <strong>setidaknya 1 menit</strong>. Sistem kami akan otomatis mengambil pesan tersebut.
                </p>
                <p className="text-xs font-mono text-muted-foreground pt-1 flex items-center gap-2">
                  <RefreshCw className={`size-3 ${countdown < 5 ? 'animate-spin text-primary' : ''}`} />
                  Refresh otomatis dalam {countdown} detik...
                </p>
              </div>
            </div>

            {messages.length === 0 ? (
              <Card className="bg-white/5 border-dashed border-white/10 py-12">
                <CardContent className="flex flex-col items-center gap-4 text-center">
                  <div className="p-4 bg-white/5 rounded-full">
                    <Mail className="size-8 text-muted-foreground/50" />
                  </div>
                  <div className="space-y-1">
                    <p className="font-bold text-muted-foreground">Belum ada pesan</p>
                    <p className="text-sm text-muted-foreground/60 max-w-xs">
                      Silakan request kode OTP atau link reset dari aplikasi/TV Anda. Pesan akan muncul di sini secara otomatis.
                    </p>
                  </div>
                </CardContent>
              </Card>
            ) : (
              messages.map((msg) => (
                <Card key={msg.id} className="bg-white/5 border-white/10 hover:bg-white/10 transition-colors group overflow-hidden relative">
                  <div className="absolute top-0 left-0 w-1 h-full bg-primary opacity-0 group-hover:opacity-100 transition-opacity" />
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <Badge className="bg-primary text-black font-bold uppercase text-[10px]">
                          {msg.parsed_context.replace('NETFLIX_', '').replace(/_/g, ' ')}
                        </Badge>
                        <span className="text-xs text-muted-foreground flex items-center gap-1">
                          <Calendar className="size-3" />
                          {format(new Date(msg.email_date), 'HH:mm - dd MMM yyyy')}
                        </span>
                      </div>
                      <CardTitle className="text-lg pt-1">{msg.subject}</CardTitle>
                    </div>
                    {msg.parsed_data.startsWith('http') && (
                      <Button 
                        size="sm" 
                        variant="secondary" 
                        className="gap-2 font-bold shrink-0"
                        onClick={() => window.open(msg.parsed_data, '_blank')}
                      >
                        Buka Link <ExternalLink className="size-3" />
                      </Button>
                    )}
                  </CardHeader>
                  <CardContent>
                    <div className="bg-black/40 p-4 rounded-xl border border-white/5 flex items-center justify-between gap-4">
                      <div className="space-y-1 overflow-hidden">
                        <p className="text-[10px] uppercase tracking-widest text-muted-foreground font-bold">Data Terdeteksi</p>
                        <p className="text-2xl font-mono font-bold text-primary truncate leading-none">
                          {msg.parsed_data}
                        </p>
                      </div>
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        className="shrink-0 text-xs font-bold hover:bg-primary/20 hover:text-primary"
                        onClick={() => {
                          navigator.clipboard.writeText(msg.parsed_data)
                          toast.success('Disalin ke clipboard!')
                        }}
                      >
                        Salin
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </div>

        {/* Footer */}
        <footer className="pt-12 text-center space-y-4">
          <p className="text-sm text-muted-foreground">
            Portal ini hanya menampilkan email yang dikhususkan untuk akun Anda.
          </p>
          <div className="flex items-center justify-center gap-2 text-[10px] uppercase tracking-[0.2em] font-bold text-muted-foreground/40">
            <CheckCircle2 className="size-3" /> Secure Access by Volve Capital
          </div>
        </footer>
      </div>
    </div>
  )
}
