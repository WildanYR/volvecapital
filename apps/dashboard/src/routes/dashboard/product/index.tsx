import type { ProductEditFormSubmitData } from '@/dashboard/components/forms/product-edit.form'
import type { ProductVariantFormSubmitData } from '@/dashboard/components/forms/product-variant.form'
import type { TimeUnit } from '@/dashboard/lib/time-converter.util'
import type {
  CreateProductVariantPayload,
  Product,
  ProductFilter,
  ProductVariant,
  UpdateProductPayload,
  UpdateProductVariantPayload,
} from '@/dashboard/services/product.service'
import type { OrderByDirection } from '@/dashboard/types/order-by.type'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { createFileRoute, Link } from '@tanstack/react-router'
import {
  ClockFading,
  EllipsisVertical,
  Hourglass,
  Package,
  Plus,
  SquarePen,
  Timer,
  Trash2,
} from 'lucide-react'
import { useState } from 'react'
import { toast } from 'sonner'
import { useDebouncedCallback } from 'use-debounce'
import { ProductEditForm } from '@/dashboard/components/forms/product-edit.form'
import { ProductVariantForm } from '@/dashboard/components/forms/product-variant.form'
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
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/dashboard/components/ui/dialog'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/dashboard/components/ui/dropdown-menu'
import { Input } from '@/dashboard/components/ui/input'
import { ScrollArea } from '@/dashboard/components/ui/scroll-area'
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
import { getTimeUnitSymbol } from '@/dashboard/lib/time-converter.util'
import {
  GetProductsParamsSchema,
  ProductServiceGenerator,
} from '@/dashboard/services/product.service'

export const Route = createFileRoute('/dashboard/product/')({
  component: RouteComponent,
  validateSearch: GetProductsParamsSchema,
})

function RouteComponent() {
  const searchParam = Route.useSearch()
  const navigate = Route.useNavigate()
  const auth = useAuth()
  const queryClient = useQueryClient()
  const { showAlertDialog, hideAlertDialog } = useGlobalAlertDialog()
  const productService = ProductServiceGenerator(
    API_URL,
    auth.tenant!.accessToken,
    auth.tenant!.id,
  )

  const [filter, setFilter] = useState<ProductFilter>({
    name: searchParam.name ?? '',
  })
  const [sort, setSort] = useState<string>(
    !!searchParam.order_by && !!searchParam.order_direction
      ? `${searchParam.order_by}:${searchParam.order_direction}`
      : 'default',
  )

  const [dialogProductEditOpen, setDialogProductEditOpen]
    = useState<boolean>(false)
  const [selectedProduct, setSelectedProduct] = useState<Product>()
  const [dialogProductVariantOpen, setDialogProductVariantOpen]
    = useState<boolean>(false)
  const [selectedProductVariant, setSelectedProductVariant]
    = useState<ProductVariant>()
  const [productVariantFormMode, setProductVariantFormMode] = useState<
    'CREATE' | 'EDIT'
  >('CREATE')

  const { data: products, isLoading: isFetchProductLoading } = useQuery({
    queryKey: ['product', searchParam],
    queryFn: ({ signal }) => productService.getAllProduct({ ...searchParam, signal }),
  })

  const productVariantCreateMutation = useMutation({
    mutationFn: (payload: CreateProductVariantPayload) =>
      productService.createNewProductVariant(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['product'] })
      toast.success('Varian produk berhasil dibuat.')
    },
    onError: (error) => {
      toast.error(`Gagal membuat varian produk: ${error.message}`)
    },
    onSettled: () => {
      setDialogProductVariantOpen(false)
    },
  })

  const handleCreateProductVariant = (product: Product) => {
    setProductVariantFormMode('CREATE')
    setSelectedProductVariant(undefined)
    setSelectedProduct(product)
    setDialogProductVariantOpen(true)
  }

  const productEditMutation = useMutation({
    mutationFn: ({
      id,
      payload,
    }: {
      id: string
      payload: UpdateProductPayload
    }) => productService.updateProduct(id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['product'] })
      toast.success('Produk berhasil diperbarui.')
    },
    onError: (error) => {
      toast.error(`Gagal memperbarui produk: ${error.message}`)
    },
    onSettled: () => {
      setDialogProductEditOpen(false)
    },
  })

  const handleProductSelectedEdit = (product: Product) => {
    setSelectedProduct(product)
    setDialogProductEditOpen(true)
  }

  const handleProductEditSubmit = (value: ProductEditFormSubmitData) => {
    productEditMutation.mutate({ id: selectedProduct!.id, payload: value })
  }

  const productVariantEditMutation = useMutation({
    mutationFn: ({
      id,
      payload,
    }: {
      id: string
      payload: UpdateProductVariantPayload
    }) => productService.updateProductVariant(id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['product'] })
      toast.success('Varian produk berhasil diperbarui.')
    },
    onError: (error) => {
      toast.error(`Gagal memperbarui varian produk: ${error.message}`)
    },
    onSettled: () => {
      setDialogProductVariantOpen(false)
    },
  })

  const handleProductVariantSelectedEdit = (productVariant: ProductVariant) => {
    setProductVariantFormMode('EDIT')
    setSelectedProductVariant(productVariant)
    setDialogProductVariantOpen(true)
  }

  const handleProductVariantFormSubmit = (
    value: ProductVariantFormSubmitData,
  ) => {
    const payload = {
      name: value.name,
      duration: Number.parseInt(value.duration),
      interval: Number.parseInt(value.interval),
      cooldown: Number.parseInt(value.cooldown),
      copy_template: value.copy_template ? value.copy_template : undefined,
    }
    if (productVariantFormMode === 'CREATE') {
      productVariantCreateMutation.mutate({
        product_id: selectedProduct!.id,
        ...payload,
      })
    }
    else {
      productVariantEditMutation.mutate({
        id: selectedProductVariant!.id,
        payload,
      })
    }
  }

  const productDeleteMutation = useMutation({
    mutationFn: (id: string) => productService.deleteProduct(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['product'] })
      toast.success('Produk berhasil dihapus.')
    },
    onError: (error) => {
      toast.error(`Gagal menghapus produk: ${error.message}`)
    },
    onSettled: () => {
      hideAlertDialog()
    },
  })

  const handleDeleteProduct = (product: Product) => {
    showAlertDialog({
      title: 'Yakin ingin menghapus Produk?',
      description: (
        <>
          Aksi tidak dapat dibatalkan. Ini akan menghapus produk
          <span className="font-bold">
            {' '}
            {product.name}
            {' '}
          </span>
          secara permanen.
        </>
      ),
      confirmText: 'Hapus',
      isConfirming: productDeleteMutation.isPending,
      onConfirm: () => productDeleteMutation.mutate(product.id),
    })
  }

  const productVariantDeleteMutation = useMutation({
    mutationFn: (id: string) => productService.deleteProductVariant(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['product'] })
      toast.success('Varian produk berhasil dihapus.')
    },
    onError: (error) => {
      toast.error(`Gagal menghapus varian produk: ${error.message}`)
    },
    onSettled: () => {
      hideAlertDialog()
    },
  })

  const handleDeleteProductVariant = (
    productName: string,
    productVariant: ProductVariant,
  ) => {
    showAlertDialog({
      title: 'Yakin ingin menghapus Varian Produk?',
      description: (
        <>
          Aksi tidak dapat dibatalkan. Ini akan menghapus varian produk
          <span className="font-bold">
            {' '}
            {productName}
            {' '}
            {productVariant.name}
            {' '}
          </span>
          secara permanen.
        </>
      ),
      confirmText: 'Hapus',
      isConfirming: productVariantDeleteMutation.isPending,
      onConfirm: () => productVariantDeleteMutation.mutate(productVariant.id),
    })
  }

  const handleSearchProduct = useDebouncedCallback((value: string) => {
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
    <>
      <div className="flex flex-col gap-8">
        <div className="flex flex-col md:flex-row gap-6 justify-between items-center">
          <h1 className="scroll-m-20 text-4xl font-extrabold tracking-tight text-balance">
            Produk
          </h1>
          <Button asChild>
            <Link to="/dashboard/product/create">
              <span>
                <Plus />
              </span>
              {' '}
              Buat Produk
            </Link>
          </Button>
        </div>
        <div className="flex flex-col md:flex-row justify-center items-center gap-4">
          <Input
            type="text"
            defaultValue={filter.name}
            placeholder="Cari Produk..."
            onChange={e => handleSearchProduct(e.target.value)}
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
        {!!products && (
          <div className="flex items-center justify-center">
            <Pagination
              currentPage={products.paginationData.currentPage}
              totalPages={products.paginationData.totalPage}
              onPageChange={handlePaginationChange}
            />
          </div>
        )}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {isFetchProductLoading
            ? (
                <>
                  <Skeleton className="h-20 rounded-md" />
                  <Skeleton className="h-20 rounded-md" />
                  <Skeleton className="h-20 rounded-md" />
                </>
              )
            : products?.items.length
              ? (
                  products.items.map(product => (
                    <Card key={`product-${product.id}`}>
                      <CardHeader>
                        <CardTitle>
                          <p className="text-xl inline-flex items-center gap-1">
                            <Package className="size-4" />
                            {' '}
                            {product.name}
                          </p>
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
                                onSelect={() => {
                                  handleProductSelectedEdit(product)
                                }}
                              >
                                <span>
                                  <SquarePen />
                                </span>
                                {' '}
                                Update
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onSelect={() => handleDeleteProduct(product)}
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
                      <CardContent className="space-y-4">
                        <div className="flex justify-between items-center">
                          <p className="font-medium text-lg">Varian</p>
                          <Button
                            variant="secondary"
                            size="sm"
                            onClick={() => handleCreateProductVariant(product)}
                            className="cursor-pointer"
                          >
                            <Plus className="size-4" />
                            {' '}
                            Tambah Varian
                          </Button>
                        </div>
                        {product.variants.map(variant => (
                          <div
                            key={`variant-${variant.id}`}
                            className="py-4 border-t border-neutral-600 space-y-4"
                          >
                            <div className="flex justify-between items-center">
                              <p>{variant.name}</p>
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
                                    onSelect={() => {
                                      handleProductVariantSelectedEdit(variant)
                                    }}
                                  >
                                    <span>
                                      <SquarePen />
                                    </span>
                                    {' '}
                                    Update
                                  </DropdownMenuItem>
                                  <DropdownMenuItem
                                    onSelect={() => {
                                      handleDeleteProductVariant(
                                        product.name,
                                        variant,
                                      )
                                    }}
                                  >
                                    <span>
                                      <Trash2 />
                                    </span>
                                    {' '}
                                    Delete
                                  </DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </div>
                            <div className="flex justify-between items-center text-muted-foreground">
                              <div className="space-y-1 w-full px-3 border-l-2 border-secondary">
                                <p className="text-sm inline-flex items-center gap-1">
                                  <Timer className="size-4" />
                                  {' '}
                                  Durasi
                                </p>
                                <p className="font-semibold">
                                  {variant.duration}
                                  {' '}
                                  {getTimeUnitSymbol(
                                    variant.duration_unit as TimeUnit,
                                  )}
                                </p>
                              </div>
                              <div className="space-y-1 w-full px-3 border-l-2 border-secondary">
                                <p className="text-sm inline-flex items-center gap-1">
                                  <ClockFading className="size-4" />
                                  {' '}
                                  Interval
                                </p>
                                <p className="font-semibold">
                                  {variant.interval}
                                  {' '}
                                  {getTimeUnitSymbol(
                                    variant.interval_unit as TimeUnit,
                                  )}
                                </p>
                              </div>
                              <div className="space-y-1 w-full px-3 border-l-2 border-secondary">
                                <p className="text-sm inline-flex items-center gap-1">
                                  <Hourglass className="size-4" />
                                  {' '}
                                  Cooldown
                                </p>
                                <p className="font-semibold">
                                  {variant.cooldown}
                                  {' '}
                                  {getTimeUnitSymbol(
                                    variant.cooldown_unit as TimeUnit,
                                  )}
                                </p>
                              </div>
                            </div>
                          </div>
                        ))}
                      </CardContent>
                    </Card>
                  ))
                )
              : (
                  <NoData>Produk tidak ditemukan</NoData>
                )}
        </div>
        {!!products && (
          <div className="flex items-center justify-center">
            <Pagination
              currentPage={products.paginationData.currentPage}
              totalPages={products.paginationData.totalPage}
              onPageChange={handlePaginationChange}
            />
          </div>
        )}
      </div>
      {/* Edit Product Dialog */}
      <Dialog
        open={dialogProductEditOpen}
        onOpenChange={setDialogProductEditOpen}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Ubah Produk</DialogTitle>
          </DialogHeader>
          <ProductEditForm
            initialData={selectedProduct!}
            isPending={productEditMutation.isPending}
            onSubmit={handleProductEditSubmit}
          />
        </DialogContent>
      </Dialog>
      {/* Edit Product Variant Dialog */}
      <Dialog
        open={dialogProductVariantOpen}
        onOpenChange={setDialogProductVariantOpen}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Ubah Varian Produk</DialogTitle>
          </DialogHeader>
          <ScrollArea
            type="auto"
            className="max-h-[calc(100vh-200px)] **:data-[slot=scroll-area-scrollbar]:-right-4!"
          >
            <ProductVariantForm
              initialData={selectedProductVariant}
              isPending={productVariantEditMutation.isPending}
              onSubmit={handleProductVariantFormSubmit}
            />
          </ScrollArea>
        </DialogContent>
      </Dialog>
    </>
  )
}
