import type {
  GetProductVariantsParams,
  ProductVariant,
} from '@/dashboard/services/product.service'
import { RadioGroup, RadioGroupItem } from '@radix-ui/react-radio-group'
import { useQuery } from '@tanstack/react-query'
import { useState } from 'react'
import { NoData } from '@/dashboard/components/no-data'
import { Pagination } from '@/dashboard/components/pagination'
import { Button } from '@/dashboard/components/ui/button'
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/dashboard/components/ui/dialog'
import { Input } from '@/dashboard/components/ui/input'
import { Skeleton } from '@/dashboard/components/ui/skeleton'
import { API_URL } from '@/dashboard/constants/api-url.cont'
import { useAuth } from '@/dashboard/context-providers/auth.provider'
import { ProductServiceGenerator } from '@/dashboard/services/product.service'

export function ProductVariantSelect({
  selectedItem,
  onSelect,
  disabled,
  productSlug,
}: {
  selectedItem?: ProductVariant
  onSelect: (selected?: ProductVariant) => void
  disabled?: boolean
  productSlug?: string
}) {
  const auth = useAuth()
  const productService = ProductServiceGenerator(
    API_URL,
    auth.tenant!.accessToken,
    auth.tenant!.id,
  )

  const [isOpen, setIsOpen] = useState<boolean>(false)
  const [params, setParams] = useState<GetProductVariantsParams>({
    name: '',
    product: '',
    product_slug: productSlug ?? '',
    page: 1,
  })

  const { data: productVariants, isLoading: isFetchProductVariantLoading }
    = useQuery({
      queryKey: ['product-variant', params],
      queryFn: () => productService.getAllProductVariant(params),
    })

  const handleRadioValueChange = (value: string) => {
    const selectedProductVariant = productVariants?.items.length
      ? productVariants.items.find(v => v.id === (value as any))
      : undefined
    if (!selectedProductVariant) {
      onSelect(undefined)
    }
    else {
      onSelect(selectedProductVariant)
    }
    setIsOpen(false)
  }

  const handlePaginationChange = (page: number) => {
    setParams({ ...params, page })
  }

  const handleSearchProduct = (value: string) => {
    setParams({ ...params, product: value })
  }

  const handleSearchProductVariant = (value: string) => {
    setParams({ ...params, name: value })
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button
          variant={selectedItem ? 'outline' : 'outline-dashed'}
          disabled={disabled}
          className="w-full"
        >
          {selectedItem
            ? (
                <span className="flex-1 text-left font-normal">
                  {selectedItem.product?.name}
                  {' '}
                  {selectedItem.name}
                </span>
              )
            : (
                'Pilih Varian Produk...'
              )}
        </Button>
      </DialogTrigger>
      <DialogContent className="w-screen h-screen sm:max-w-none max-w-none rounded-none flex flex-col p-4 md:p-14">
        <DialogHeader>
          <DialogTitle>Pilih Varian Produk</DialogTitle>
          <div className="flex flex-col md:flex-row justify-center items-center gap-4">
            {!productSlug && (
              <Input
                type="text"
                defaultValue={params.product}
                placeholder="Cari Produk..."
                onChange={e => handleSearchProduct(e.target.value)}
              />
            )}
            <Input
              type="text"
              defaultValue={params.name}
              placeholder="Cari Varian Produk..."
              onChange={e => handleSearchProductVariant(e.target.value)}
            />
          </div>
        </DialogHeader>
        {isFetchProductVariantLoading
          ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <Skeleton className="h-16 rounded-md" />
                <Skeleton className="h-16 rounded-md" />
                <Skeleton className="h-16 rounded-md" />
              </div>
            )
          : productVariants?.items.length
            ? (
                <RadioGroup
                  value={selectedItem?.id ?? ''}
                  onValueChange={handleRadioValueChange}
                  className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4"
                >
                  {productVariants.items.map(productVariant => (
                    <RadioGroupItem
                      key={productVariant.id}
                      id={productVariant.id}
                      value={productVariant.id}
                      className="bg-secondary p-4 rounded-md flex justify-between items-center gap-4 data-[state=checked]:bg-primary/30 data-[state=checked]:border data-[state=checked]:border-primary"
                    >
                      <p>
                        {productVariant.product?.name ?? ''}
                        {' '}
                        {productVariant.name}
                      </p>
                    </RadioGroupItem>
                  ))}
                </RadioGroup>
              )
            : (
                <NoData>Varian Produk tidak ditemukan</NoData>
              )}
        {!!productVariants && (
          <div className="flex items-center justify-center">
            <Pagination
              currentPage={productVariants.paginationData.currentPage}
              totalPages={productVariants.paginationData.totalPage}
              onPageChange={handlePaginationChange}
            />
          </div>
        )}
        <DialogFooter>
          <DialogClose asChild>
            <Button variant="outline" className="w-full cursor-pointer">
              Cancel
            </Button>
          </DialogClose>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
