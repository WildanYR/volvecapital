import type {
  PlatformProduct,
  PlatformProductFilter,
} from '@/dashboard/services/platform-product.service'
import type { OrderByDirection } from '@/dashboard/types/order-by.type'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { createFileRoute, Link } from '@tanstack/react-router'
import {
  Blocks,
  EllipsisVertical,
  Package,
  Plus,
  SquarePen,
  Trash2,
} from 'lucide-react'
import { useState } from 'react'
import { toast } from 'sonner'
import { useDebouncedCallback } from 'use-debounce'
import { NoData } from '@/dashboard/components/no-data'
import { Pagination } from '@/dashboard/components/pagination'
import { Button } from '@/dashboard/components/ui/button'
import {
  Card,
  CardAction,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/dashboard/components/ui/card'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/dashboard/components/ui/dropdown-menu'
import { Input } from '@/dashboard/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/dashboard/components/ui/select'
import { Skeleton } from '@/dashboard/components/ui/skeleton'
import { API_URL } from '@/dashboard/constants/api-url.cont'
import { useGlobalAlertDialog } from '@/dashboard/context-providers/alert-dialog.provider'
import { useAuth } from '@/dashboard/context-providers/auth.provider'
import {
  GetPlatformProductParamsSchema,
  PlatformProductServiceGenerator,
} from '@/dashboard/services/platform-product.service'

export const Route = createFileRoute('/dashboard/platform-product/')({
  component: RouteComponent,
  validateSearch: GetPlatformProductParamsSchema,
})

function RouteComponent() {
  const searchParam = Route.useSearch()
  const navigate = Route.useNavigate()
  const auth = useAuth()
  const queryClient = useQueryClient()
  const { showAlertDialog, hideAlertDialog } = useGlobalAlertDialog()
  const platformProductService = PlatformProductServiceGenerator(
    API_URL,
    auth.tenant!.accessToken,
    auth.tenant!.id,
  )

  const [filter, setFilter] = useState<PlatformProductFilter>({
    name: searchParam.name ?? '',
    platform: searchParam.platform ?? '',
    platform_product_id: searchParam.platform_product_id ?? '',
    product_variant_id: searchParam.product_variant_id ?? '',
  })
  const [sort, setSort] = useState<string>(
    !!searchParam.order_by && !!searchParam.order_direction
      ? `${searchParam.order_by}:${searchParam.order_direction}`
      : 'default',
  )

  const { data: platformProducts, isLoading: isFetchPlatformProductLoading }
    = useQuery({
      queryKey: ['platform-product', searchParam],
      queryFn: ({ signal }) => platformProductService.getAllPlatformProduct({ ...searchParam, signal }),
    })

  const deleteMutation = useMutation({
    mutationFn: (id: string) =>
      platformProductService.deletePlatformProduct(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['platform-product'] })
      toast.success('Produk platform berhasil dihapus.')
    },
    onError: (error) => {
      toast.error(`Gagal menghapus produk platform: ${error.message}`)
    },
    onSettled: () => {
      hideAlertDialog()
    },
  })

  const handleDeletePlatformProduct = (platformProduct: PlatformProduct) => {
    showAlertDialog({
      title: 'Yakin ingin menghapus Produk Platform?',
      description: (
        <>
          Aksi tidak dapat dibatalkan. Ini akan menghapus Produk Platform
          <span className="font-bold">
            {' '}
            {platformProduct.name}
            {' '}
          </span>
          secara permanen.
        </>
      ),
      confirmText: 'Hapus',
      isConfirming: deleteMutation.isPending,
      onConfirm: () => deleteMutation.mutate(platformProduct.id),
    })
  }

  const handleSearchPlatformProduct = useDebouncedCallback((value: string) => {
    setFilter({ ...filter, name: value })
    const name = value || undefined
    navigate({ search: prev => ({ ...prev, name, page: 1 }), replace: true })
  }, 700)

  const handleSortChange = (value: string) => {
    setSort(value)

    const [orderBy, orderDirection]
      = value === 'default' ? [undefined, undefined] : value.split(':')
    navigate({
      search: prev => ({
        ...prev,
        order_by: orderBy,
        order_direction: orderDirection as OrderByDirection | undefined,
        page: 1,
      }),
      replace: true,
    })
  }

  const handlePaginationChange = (page: number) => {
    navigate({
      search: (prev: any) => ({
        ...prev,
        page,
      }),
      replace: true,
    })
  }

  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-col md:flex-row gap-6 justify-between items-center">
        <h1 className="scroll-m-20 text-4xl font-extrabold tracking-tight text-balance">
          Produk Platform
        </h1>
        <Button asChild>
          <Link to="/dashboard/platform-product/create">
            <span>
              <Plus />
            </span>
            {' '}
            Buat Produk Platform
          </Link>
        </Button>
      </div>
      <div className="flex flex-col md:flex-row justify-center items-center gap-4">
        <Input
          type="text"
          defaultValue={filter.name}
          placeholder="Cari Produk Platform..."
          onChange={e => handleSearchPlatformProduct(e.target.value)}
        />
        <div className="flex items-center gap-2 w-full md:w-min">
          <p className="text-sm">Urutkan:</p>
          <Select defaultValue={sort} onValueChange={handleSortChange}>
            <SelectTrigger className="w-full md:w-min">
              <SelectValue placeholder="Theme" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="default">Default</SelectItem>
              <SelectItem value="name:asc">Nama A-Z</SelectItem>
              <SelectItem value="name:desc">Nama Z-A</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
      {!!platformProducts && (
        <div className="flex items-center justify-center">
          <Pagination
            currentPage={platformProducts.paginationData.currentPage}
            totalPages={platformProducts.paginationData.totalPage}
            onPageChange={handlePaginationChange}
          />
        </div>
      )}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {isFetchPlatformProductLoading
          ? (
              <>
                <Skeleton className="h-16 rounded-md" />
                <Skeleton className="h-16 rounded-md" />
                <Skeleton className="h-16 rounded-md" />
              </>
            )
          : platformProducts?.items.length
            ? (
                platformProducts.items.map(platformProduct => (
                  <Card key={platformProduct.id}>
                    <CardHeader>
                      <CardTitle>
                        <p>{platformProduct.name}</p>
                      </CardTitle>
                      <CardAction>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="cursor-pointer"
                            >
                              <EllipsisVertical className="size-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="center">
                            <DropdownMenuItem
                              onSelect={() =>
                                navigate({
                                  to: '/dashboard/platform-product/$id',
                                  params: { id: platformProduct.id },
                                })}
                            >
                              <span>
                                <SquarePen />
                              </span>
                              {' '}
                              Update
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onSelect={() =>
                                handleDeletePlatformProduct(platformProduct)}
                            >
                              <span>
                                <Trash2 />
                              </span>
                              {' '}
                              Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </CardAction>
                    </CardHeader>
                    <CardContent>
                      <div className="flex justify-between items-center text-muted-foreground">
                        <div className="space-y-1 w-full px-3 border-l-2 border-secondary">
                          <p className="text-sm inline-flex items-center gap-1">
                            <Blocks className="size-4" />
                            {' '}
                            Platform
                          </p>
                          <p className="font-semibold">{platformProduct.platform}</p>
                        </div>
                        <div className="space-y-1 w-full px-3 border-l-2 border-secondary">
                          <p className="text-sm inline-flex items-center gap-1">
                            <Package className="size-4" />
                            {' '}
                            Produk
                          </p>
                          <p className="font-semibold text-sm">
                            {platformProduct.product_variant.product?.name}
                            {' '}
                            {platformProduct.product_variant.name}
                          </p>
                        </div>
                      </div>
                      {platformProduct.variant && (
                        <div className="mt-4 pt-4 border-t border-secondary/50">
                          <p className="text-xs text-muted-foreground uppercase tracking-wider font-medium mb-1">Varian Platform</p>
                          <p className="text-sm font-medium">{platformProduct.variant}</p>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ))
              )
            : (
                <NoData>Produk Platform tidak ditemukan</NoData>
              )}
      </div>
      {!!platformProducts && (
        <div className="flex items-center justify-center">
          <Pagination
            currentPage={platformProducts.paginationData.currentPage}
            totalPages={platformProducts.paginationData.totalPage}
            onPageChange={handlePaginationChange}
          />
        </div>
      )}
    </div>
  )
}
