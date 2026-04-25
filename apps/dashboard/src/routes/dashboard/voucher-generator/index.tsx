import { useMutation, useQuery } from '@tanstack/react-query'
import { createFileRoute } from '@tanstack/react-router'
import { Check, Copy, Loader2, Plus, Ticket } from 'lucide-react'
import { useState } from 'react'
import { toast } from 'sonner'
import { Button } from '@/dashboard/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/dashboard/components/ui/card'
import { Input } from '@/dashboard/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/dashboard/components/ui/select'
import { useAuth } from '@/dashboard/context-providers/auth.provider'
import { API_URL } from '@/dashboard/constants/api-url.cont'
import { ProductServiceGenerator } from '@/dashboard/services/product.service'
import { VoucherServiceGenerator } from '@/dashboard/services/voucher.service'

export const Route = createFileRoute('/dashboard/voucher-generator/')({
  component: RouteComponent,
})

function RouteComponent() {
  const auth = useAuth()
  const productService = ProductServiceGenerator(API_URL, auth.tenant!.accessToken, auth.tenant!.id)
  const voucherService = VoucherServiceGenerator(API_URL, auth.tenant!.accessToken, auth.tenant!.id)

  const [formData, setFormData] = useState({
    product_variant_id: '',
    buyer_name: '',
    buyer_email: '',
    buyer_whatsapp: '',
  })
  const [generatedVoucher, setGeneratedVoucher] = useState<any>(null)

  const { data: productsData, isLoading: isProductsLoading } = useQuery({
    queryKey: ['product', 'all-for-gen'],
    queryFn: () => productService.getAllProduct({ limit: 100 }),
  })

  const generateMutation = useMutation({
    mutationFn: (data: typeof formData) => voucherService.generate(data),
    onSuccess: (data) => {
      setGeneratedVoucher(data)
      toast.success('Voucher berhasil dibuat!')
    },
    onError: (error: any) => {
      toast.error(`Gagal membuat voucher: ${error.message}`)
    },
  })

  const { data: vouchers, isLoading: isVouchersLoading } = useQuery({
    queryKey: ['vouchers', 'list'],
    queryFn: () => voucherService.list(),
  })

  const handleCopy = (code: string) => {
    navigator.clipboard.writeText(code)
    toast.success('Kode voucher disalin!')
  }

  return (
    <div className="flex flex-col gap-8">
      <h1 className="text-4xl font-extrabold tracking-tight">Voucher Generator</h1>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Form Section */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Plus className="size-5" />
              Generate Voucher Baru
            </CardTitle>
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
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Ticket className="size-5" />
              Voucher Terakhir
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {isVouchersLoading ? (
                <div className="flex justify-center py-10"><Loader2 className="animate-spin" /></div>
              ) : vouchers?.length ? (
                vouchers.map((v: any) => (
                  <div key={v.id} className="flex items-center justify-between p-3 border-b border-border last:border-0 hover:bg-muted/50 rounded-lg transition-colors">
                    <div className="flex flex-col">
                      <span className="font-bold text-sm">{v.id}</span>
                      <span className="text-[10px] text-muted-foreground">{v.product_variant?.product?.name} - {v.product_variant?.name}</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${v.status === 'USED' ? 'bg-red-500/10 text-red-500' : 'bg-green-500/10 text-green-500'}`}>
                        {v.status}
                      </span>
                      <Button size="icon" variant="ghost" className="size-8" onClick={() => handleCopy(v.id)}>
                        <Copy className="size-4" />
                      </Button>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-center text-sm text-muted-foreground py-10">Belum ada voucher.</p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
