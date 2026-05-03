import { useQuery } from '@tanstack/react-query'
import { createFileRoute, Link } from '@tanstack/react-router'
import {
  Package,
  Plus,
  ChevronRight,
  TrendingUp,
  AlertCircle,
  CheckCircle2,
} from 'lucide-react'
import { API_URL } from '@/dashboard/constants/api-url.cont'
import { useAuth } from '@/dashboard/context-providers/auth.provider'
import { ProductServiceGenerator } from '@/dashboard/services/product.service'
import { Button } from '@/dashboard/components/ui/button'
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/dashboard/components/ui/card'
import { Skeleton } from '@/dashboard/components/ui/skeleton'
import { NoData } from '@/dashboard/components/no-data'

export const Route = createFileRoute('/dashboard/account/')({
  component: RouteComponent,
})

function RouteComponent() {
  const auth = useAuth()
  const productService = ProductServiceGenerator(
    API_URL,
    auth.tenant!.accessToken,
    auth.tenant!.id,
  )

  const { data: stats, isLoading } = useQuery({
    queryKey: ['product-pooling-stats'],
    queryFn: ({ signal }) => productService.getPoolingStats(signal),
  })

  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-col md:flex-row gap-6 justify-between items-center">
        <div>
          <h1 className="scroll-m-20 text-4xl font-extrabold tracking-tight text-balance">
            Pooling Akun
          </h1>
          <p className="text-muted-foreground mt-2">
            Pilih produk untuk mengelola akun dan stok.
          </p>
        </div>
        <div className="flex items-center gap-4">
          <Button asChild>
            <Link to="/dashboard/product">
              <Package className="size-4" />
              Kelola Produk
            </Link>
          </Button>
          <Button variant="secondary" asChild>
             <Link to="/dashboard/account/create">
                <Plus className="size-4" />
                Tambah Akun
             </Link>
          </Button>
        </div>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3].map(i => (
            <Skeleton key={i} className="h-48 w-full rounded-xl" />
          ))}
        </div>
      ) : stats?.length ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {stats.map(item => (
            <Link 
              key={item.id} 
              to="/dashboard/account/$slug" 
              params={{ slug: item.slug }}
              className="group"
            >
              <Card className="h-full transition-all duration-300 hover:shadow-lg hover:border-primary/50 group-hover:scale-[1.02] cursor-pointer bg-card/50 backdrop-blur-sm">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-xl font-bold transition-colors">
                    {item.name}
                  </CardTitle>
                  <div className="p-2 bg-secondary rounded-lg transition-colors">
                    <Package className="size-5" />
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="mt-4 space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <TrendingUp className="size-4" />
                        <span>Total Stok</span>
                      </div>
                      <span className="font-bold text-lg">{item.total}</span>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4 pt-2 border-t border-border/50">
                      <div className="flex flex-col gap-1">
                        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                          <CheckCircle2 className="size-3" />
                          <span>Aktif</span>
                        </div>
                        <span className="font-semibold">
                          {item.active}
                        </span>
                      </div>
                      <div className="flex flex-col gap-1">
                        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                          <AlertCircle className="size-3" />
                          <span>Expired</span>
                        </div>
                        <span className="font-semibold">
                          {item.expired}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center justify-end pt-2 font-medium text-sm group-hover:gap-2 transition-all">
                      Lihat Akun <ChevronRight className="size-4" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      ) : (
        <NoData 
           title="Belum Ada Produk"
           description="Silakan buat produk terlebih dahulu di menu Kelola Produk."
        />
      )}
    </div>
  )
}
