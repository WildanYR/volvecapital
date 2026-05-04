import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { createFileRoute } from '@tanstack/react-router'
import { 
  Activity, 
  AlertTriangle, 
  BarChart3, 
  Calendar, 
  Check, 
  CheckCircle, 
  ChevronLeft,
  ChevronRight,
  Clock, 
  Copy, 
  Key, 
  Loader2, 
  Mail, 
  Phone, 
  Plus, 
  Search,
  ShieldCheck, 
  Ticket, 
  User, 
  Zap 
} from 'lucide-react'
import { useState, useEffect } from 'react'
import { toast } from 'sonner'
import { Button } from '@/dashboard/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/dashboard/components/ui/card'
import { Input } from '@/dashboard/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/dashboard/components/ui/select'
import { useAuth } from '@/dashboard/context-providers/auth.provider'
import { API_URL } from '@/dashboard/constants/api-url.cont'
import { ProductServiceGenerator } from '@/dashboard/services/product.service'
import { VoucherServiceGenerator } from '@/dashboard/services/voucher.service'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/dashboard/components/ui/dialog'
import { Separator } from '@/dashboard/components/ui/separator'

export const Route = createFileRoute('/dashboard/voucher-generator/')({
  component: RouteComponent,
})

function RouteComponent() {
  const auth = useAuth()
  const queryClient = useQueryClient()
  const productService = ProductServiceGenerator(API_URL, auth.tenant!.accessToken, auth.tenant!.id)
  const voucherService = VoucherServiceGenerator(API_URL, auth.tenant!.accessToken, auth.tenant!.id)

  const [formData, setFormData] = useState({
    product_variant_id: '',
    buyer_name: '',
    buyer_email: '',
    buyer_whatsapp: '',
  })
  const [generatedVoucher, setGeneratedVoucher] = useState<any>(null)
  
  // Search and Pagination State
  const [search, setSearch] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('ALL')
  const [page, setPage] = useState(1)
  const limit = 10

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search)
      setPage(1) // Reset to page 1 on search
    }, 500)
    return () => clearTimeout(timer)
  }, [search])

  const { data: productsData, isLoading: isProductsLoading } = useQuery({
    queryKey: ['product', 'all-for-gen'],
    queryFn: () => productService.getAllProduct({ limit: 100 }),
  })

  const { data: stats, isLoading: isStatsLoading } = useQuery({
    queryKey: ['vouchers', 'statistics'],
    queryFn: () => voucherService.getStatistics(),
  })

  const { data: vouchersData, isLoading: isVouchersLoading } = useQuery({
    queryKey: ['vouchers', 'list', page, debouncedSearch, statusFilter],
    queryFn: () => voucherService.list({ page, limit, search: debouncedSearch, status: statusFilter }),
  })

  const generateMutation = useMutation({
    mutationFn: (data: typeof formData) => voucherService.generate(data),
    onSuccess: (data) => {
      setGeneratedVoucher(data)
      toast.success('Voucher berhasil dibuat!')
      queryClient.invalidateQueries({ queryKey: ['vouchers'] })
    },
    onError: (error: any) => {
      toast.error(`Gagal membuat voucher: ${error.message}`)
    },
  })

  const handleCopy = (text: string, label: string = 'Kode voucher') => {
    if (!text) return
    
    const performCopy = async () => {
      try {
        if (navigator.clipboard && window.isSecureContext) {
          await navigator.clipboard.writeText(text)
          toast.success(`${label} disalin!`)
        } else {
          throw new Error('Clipboard API unavailable')
        }
      } catch (err) {
        // Fallback for non-secure contexts or older mobile browsers
        const textArea = document.createElement("textarea")
        textArea.value = text
        textArea.style.position = "fixed"
        textArea.style.left = "-9999px"
        textArea.style.top = "0"
        document.body.appendChild(textArea)
        textArea.focus()
        textArea.select()
        try {
          document.execCommand('copy')
          toast.success(`${label} disalin!`)
        } catch (copyErr) {
          toast.error(`Gagal menyalin ${label.toLowerCase()}`)
        }
        document.body.removeChild(textArea)
      }
    }

    performCopy()
  }

  const formatDate = (date: string | null | undefined) => {
    if (!date) return '-'
    return new Date(date).toLocaleString('id-ID', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const statCards = [
    { title: 'Total Generated', value: stats?.totalGenerated, icon: Ticket },
    { title: 'Total Redeemed', value: stats?.totalRedeemed, icon: CheckCircle },
    { title: 'Total Tersedia', value: stats?.totalTersedia, icon: Zap },
    { title: 'Redeem & Tersedia', value: stats?.totalRedeemedDanTersedia, icon: BarChart3 },
    { title: 'Total Unused', value: stats?.totalUnused, icon: Clock },
    { title: 'Total Pending', value: stats?.totalPending, icon: AlertTriangle },
    { title: 'Total Aktif', value: stats?.totalAktif, icon: Activity },
    { title: 'Total Kadaluarsa', value: stats?.totalKadaluarsa, icon: AlertTriangle },
  ]

  const totalPages = Math.ceil((vouchersData?.total || 0) / limit)

  return (
    <div className="flex flex-col gap-8 pb-10">
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl sm:text-3xl md:text-4xl font-extrabold tracking-tight">Voucher Generator</h1>
        <p className="text-xs sm:text-sm text-muted-foreground">Kelola dan pantau statistik voucher streaming.</p>
      </div>

      {/* Statistics Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
        {statCards.map((stat, i) => (
          <Card key={i} className="border-none bg-muted/30 min-w-0 shadow-none">
            <CardContent className="p-3 sm:p-4 flex flex-col gap-1 min-w-0">
              <div className="flex items-center justify-between gap-1">
                <p className="text-[9px] sm:text-[10px] font-bold text-muted-foreground uppercase tracking-wider truncate">{stat.title}</p>
                <div className="p-2 bg-secondary rounded-lg shrink-0">
                  <stat.icon className="size-5 sm:size-6" />
                </div>
              </div>
              <p className="text-xl sm:text-2xl font-black tracking-tight truncate mt-1">
                {isStatsLoading ? <Loader2 className="size-4 animate-spin" /> : (stat.value ?? 0)}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Form Section */}
        <Card className="h-fit">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Plus className="size-5" />
              Generate Voucher Baru
            </CardTitle>
            <CardDescription>Buat kode voucher baru untuk diberikan kepada customer.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Pilih Varian Produk</label>
              <Select 
                onValueChange={(val) => setFormData({ ...formData, product_variant_id: val })}
                disabled={isProductsLoading}
              >
                <SelectTrigger>
                  <SelectValue placeholder={isProductsLoading ? "Memuat..." : "Pilih Varian"} />
                </SelectTrigger>
                <SelectContent>
                  {productsData?.items.map(product => (
                    product.variants.map(variant => (
                      <SelectItem key={variant.id} value={variant.id}>
                        {product.name} - {variant.name}
                      </SelectItem>
                    ))
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Nama Pembeli</label>
                <Input 
                  placeholder="Budi" 
                  value={formData.buyer_name}
                  onChange={e => setFormData({ ...formData, buyer_name: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Email Pembeli</label>
                <Input 
                  type="email" 
                  placeholder="budi@mail.com" 
                  value={formData.buyer_email}
                  onChange={e => setFormData({ ...formData, buyer_email: e.target.value })}
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">WhatsApp Pembeli (628...)</label>
              <Input 
                placeholder="62812345678" 
                value={formData.buyer_whatsapp}
                onChange={e => setFormData({ ...formData, buyer_whatsapp: e.target.value })}
              />
            </div>

            <Button 
              className="w-full" 
              onClick={() => generateMutation.mutate(formData)}
              disabled={generateMutation.isPending || !formData.product_variant_id || !formData.buyer_name}
            >
              {generateMutation.isPending ? <Loader2 className="animate-spin" /> : 'Generate Voucher'}
            </Button>

            {generatedVoucher && (
              <div className="mt-6 p-4 bg-primary/10 border border-primary/20 rounded-xl space-y-3">
                <p className="text-sm font-bold text-primary">Voucher Berhasil Dibuat!</p>
                <div className="flex items-center justify-between bg-background p-3 rounded-lg border border-border">
                  <code className="text-lg font-black">{generatedVoucher.id}</code>
                  <Button size="sm" variant="ghost" onClick={() => handleCopy(generatedVoucher.id)}>
                    <Copy className="size-4" />
                  </Button>
                </div>
                <p className="text-[10px] text-muted-foreground italic">Berikan kode ini ke user untuk di-redeem di Landing Page.</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* History Section */}
        <Card className="flex flex-col">
          <CardHeader>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <CardTitle className="flex items-center gap-2">
                <Ticket className="size-5" />
                Daftar Voucher
              </CardTitle>
              <div className="flex flex-col sm:flex-row items-center gap-2 w-full sm:w-auto">
                <div className="relative w-full sm:w-64">
                  <Search className="absolute left-2.5 top-2.5 size-4 text-muted-foreground" />
                  <Input 
                    placeholder="Cari voucher/nama/tlp..." 
                    className="pl-9 h-9 text-xs w-full"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                  />
                </div>
                <Select value={statusFilter} onValueChange={(val) => { setStatusFilter(val); setPage(1) }}>
                  <SelectTrigger className="h-9 w-full sm:w-[130px] text-xs">
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ALL">Semua</SelectItem>
                    <SelectItem value="PENDING">Pending</SelectItem>
                    <SelectItem value="UNUSED">Unused</SelectItem>
                    <SelectItem value="USED">Used</SelectItem>
                    <SelectItem value="EXPIRED">Expired</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <CardDescription>Menampilkan daftar voucher yang pernah dibuat.</CardDescription>
          </CardHeader>
          <CardContent className="flex-1 flex flex-col gap-4">
            <div className="flex-1 space-y-4">
              {isVouchersLoading ? (
                <div className="flex justify-center py-10"><Loader2 className="animate-spin" /></div>
              ) : vouchersData?.items?.length ? (
                vouchersData.items.map((v: any) => (
                  <Dialog key={v.id}>
                    <DialogTrigger asChild>
                      <div 
                        className="flex items-center justify-between p-3 border border-border hover:bg-muted/50 rounded-xl transition-all cursor-pointer group min-w-0 gap-3"
                      >
                        <div className="flex flex-col min-w-0 flex-1">
                          <span className="font-bold text-sm group-hover:text-primary transition-colors truncate">{v.id}</span>
                          <span className="text-[10px] text-muted-foreground truncate">
                            {v.product_variant?.product?.name} - {v.product_variant?.name}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          <div className="flex flex-col items-end">
                            <span className="text-[9px] text-muted-foreground whitespace-nowrap">{formatDate(v.created_at)}</span>
                            <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full mt-1 ${
                              v.status === 'USED' 
                                ? 'bg-red-500/10 text-red-500' 
                                : v.status === 'EXPIRED' 
                                ? 'bg-slate-500/10 text-slate-500'
                                : v.status === 'PENDING'
                                ? 'bg-yellow-500/10 text-yellow-500'
                                : 'bg-green-500/10 text-green-500'
                            }`}>
                              {v.status}
                            </span>
                          </div>
                          <Button size="icon" variant="ghost" className="size-8" onClick={(e) => {
                            e.stopPropagation();
                            handleCopy(v.id);
                          }}>
                            <Copy className="size-4" />
                          </Button>
                        </div>
                      </div>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-[500px]">
                      <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                          <Ticket className="size-5 text-primary" />
                          Detail Voucher: {v.id}
                        </DialogTitle>
                      </DialogHeader>
                      
                      <div className="space-y-6 pt-4">
                        {/* Status Section */}
                        <div className="flex justify-between items-center bg-muted/30 p-4 rounded-xl border border-border">
                          <div className="space-y-1">
                            <p className="text-[10px] uppercase font-bold text-muted-foreground tracking-widest">Status Voucher</p>
                            <p className={`text-lg font-black ${
                              v.status === 'USED' ? 'text-red-500' : v.status === 'PENDING' ? 'text-yellow-500' : 'text-green-500'
                            }`}>{v.status}</p>
                          </div>
                          <div className="text-right space-y-1">
                            <p className="text-[10px] uppercase font-bold text-muted-foreground tracking-widest">Varian Produk</p>
                            <p className="font-bold">{v.product_variant?.product?.name} - {v.product_variant?.name}</p>
                          </div>
                        </div>

                        {/* Dates Grid */}
                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-1">
                            <div className="flex items-center gap-1.5 text-muted-foreground">
                              <Plus className="size-3" />
                              <span className="text-[10px] font-bold uppercase">Dibuat</span>
                            </div>
                            <p className="text-sm font-medium">{formatDate(v.created_at)}</p>
                          </div>
                          <div className="space-y-1">
                            <div className="flex items-center gap-1.5 text-muted-foreground">
                              <AlertTriangle className="size-3" />
                              <span className="text-[10px] font-bold uppercase">Kadaluarsa</span>
                            </div>
                            <p className="text-sm font-medium">{formatDate(v.expired_at)}</p>
                          </div>
                          {v.status === 'USED' && (
                            <div className="space-y-1">
                              <div className="flex items-center gap-1.5 text-muted-foreground">
                                <Check className="size-3" />
                                <span className="text-[10px] font-bold uppercase">Digunakan</span>
                              </div>
                              <p className="text-sm font-medium text-red-500">{formatDate(v.used_at || v.updated_at)}</p>
                            </div>
                          )}
                          <div className="space-y-1">
                            <div className="flex items-center gap-1.5 text-muted-foreground">
                              <Clock className="size-3" />
                              <span className="text-[10px] font-bold uppercase">Durasi</span>
                            </div>
                            <p className="text-sm font-medium">
                              {v.product_variant?.duration ? Math.floor(v.product_variant.duration / (1000 * 60 * 60 * 24)) : '-'} Hari
                            </p>
                          </div>
                        </div>

                        <Separator />

                        {/* Buyer Info */}
                        <div className="space-y-3">
                          <h4 className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Informasi Pembeli</h4>
                          <div className="grid grid-cols-1 gap-3 bg-muted/10 p-4 rounded-xl border border-border/50">
                            <div className="flex items-center gap-3">
                              <div className="p-2 rounded-lg bg-background border border-border">
                                <User className="size-4 text-primary" />
                              </div>
                              <div>
                                <p className="text-[10px] text-muted-foreground font-bold uppercase">Nama</p>
                                <p className="text-sm font-bold">{v.buyer_name}</p>
                              </div>
                            </div>
                            <div className="flex items-center gap-3">
                              <div className="p-2 rounded-lg bg-background border border-border">
                                <Mail className="size-4 text-primary" />
                              </div>
                              <div>
                                <p className="text-[10px] text-muted-foreground font-bold uppercase">Email</p>
                                <p className="text-sm font-bold">{v.buyer_email}</p>
                              </div>
                            </div>
                            <div className="flex items-center gap-3">
                              <div className="p-2 rounded-lg bg-background border border-border">
                                <Phone className="size-4 text-primary" />
                              </div>
                              <div>
                                <p className="text-[10px] text-muted-foreground font-bold uppercase">WhatsApp</p>
                                <p className="text-sm font-bold">{v.buyer_whatsapp}</p>
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Account Allocation Info (If USED) */}
                        {v.status === 'USED' && v.transaction_item?.user && (
                          <>
                            <Separator />
                            <div className="space-y-3">
                              <h4 className="text-xs font-bold uppercase tracking-widest text-emerald-500">Informasi Akun Dialokasikan</h4>
                              <div className="grid grid-cols-1 gap-3 bg-emerald-500/5 p-4 rounded-xl border border-emerald-500/20">
                                <div className="flex items-center gap-3">
                                  <div className="p-2 rounded-lg bg-background border border-border">
                                    <Mail className="size-4 text-emerald-500" />
                                  </div>
                                  <div className="flex-1">
                                    <p className="text-[10px] text-muted-foreground font-bold uppercase">Email Akun</p>
                                    <p className="text-sm font-bold">{v.transaction_item.user.account?.email?.email}</p>
                                  </div>
                                </div>
                                <div className="flex items-center gap-3">
                                  <div className="p-2 rounded-lg bg-background border border-border">
                                    <Key className="size-4 text-emerald-500" />
                                  </div>
                                  <div className="flex-1">
                                    <p className="text-[10px] text-muted-foreground font-bold uppercase">Password Akun</p>
                                    <div className="flex items-center justify-between">
                                      <p className="text-sm font-bold tracking-widest">••••••••</p>
                                      <Button size="sm" variant="ghost" className="h-6 px-2 text-[10px]" onClick={() => handleCopy(v.transaction_item.user.account?.account_password)}>Copy Pass</Button>
                                    </div>
                                  </div>
                                </div>
                                <div className="flex items-center gap-3">
                                  <div className="p-2 rounded-lg bg-background border border-border">
                                    <ShieldCheck className="size-4 text-emerald-500" />
                                  </div>
                                  <div>
                                    <p className="text-[10px] text-muted-foreground font-bold uppercase">Profile Slot</p>
                                    <p className="text-sm font-bold">{v.transaction_item.user.profile?.name || '-'}</p>
                                  </div>
                                </div>
                                <div className="flex items-center gap-3 border-t border-emerald-500/10 pt-2 mt-1">
                                  <div className="p-2 rounded-lg bg-background border border-border">
                                    <Calendar className="size-4 text-emerald-500" />
                                  </div>
                                  <div>
                                    <p className="text-[10px] text-muted-foreground font-bold uppercase">Habis Langganan</p>
                                    <p className="text-sm font-bold text-emerald-600">{formatDate(v.transaction_item.user.expired_at)}</p>
                                  </div>
                                </div>
                              </div>
                            </div>
                          </>
                        )}
                        
                        <div className="flex flex-col sm:flex-row gap-2 pt-2">
                          <Button className="flex-1 gap-2" variant="outline" onClick={() => handleCopy(v.id)}>
                            <Copy className="size-4" />
                            Salin Kode Voucher
                          </Button>
                          <Button className="flex-1 gap-2 bg-primary/10 text-primary hover:bg-primary/20 border-primary/20" variant="ghost" onClick={() => {
                            const landingUrl = window.location.origin.replace('dashboard.', '').replace(':3000', ':3001')
                            handleCopy(`${landingUrl}/redeem?code=${v.id}`, 'Link redeem')
                          }}>
                            <Zap className="size-4" />
                            Salin Link Redeem
                          </Button>
                        </div>
                      </div>
                    </DialogContent>
                  </Dialog>
                ))
              ) : (
                <p className="text-center text-sm text-muted-foreground py-10">Belum ada voucher.</p>
              )}
            </div>

            {/* Pagination Controls */}
            {vouchersData?.total > limit && (
              <div className="flex items-center justify-between pt-4 border-t border-border">
                <p className="text-[10px] text-muted-foreground font-medium">
                  Menampilkan {(page - 1) * limit + 1} - {Math.min(page * limit, vouchersData.total)} dari {vouchersData.total} voucher
                </p>
                <div className="flex items-center gap-2">
                  <Button 
                    size="icon" 
                    variant="outline" 
                    className="size-8"
                    disabled={page === 1}
                    onClick={() => setPage(prev => prev - 1)}
                  >
                    <ChevronLeft className="size-4" />
                  </Button>
                  <span className="text-[10px] font-bold w-12 text-center">Hal {page}</span>
                  <Button 
                    size="icon" 
                    variant="outline" 
                    className="size-8"
                    disabled={page >= totalPages}
                    onClick={() => setPage(prev => prev + 1)}
                  >
                    <ChevronRight className="size-4" />
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
