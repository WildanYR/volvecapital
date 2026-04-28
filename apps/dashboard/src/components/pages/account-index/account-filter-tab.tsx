import type { AccountFilter } from '@/dashboard/services/account.service'
import { useInfiniteQuery } from '@tanstack/react-query'
import { useCallback, useEffect, useMemo } from 'react'
import { API_URL } from '@/dashboard/constants/api-url.cont'
import { useAuth } from '@/dashboard/context-providers/auth.provider'
import { ProductServiceGenerator } from '@/dashboard/services/product.service'
import { TabButton } from '../../tab-button'
import { Skeleton } from '../../ui/skeleton'

export function AccountFilterTab({ accountFilter, onAccountFilterChange }: { accountFilter: AccountFilter, onAccountFilterChange: (filter: AccountFilter) => void }) {
  const auth = useAuth()
  const productService = ProductServiceGenerator(
    API_URL,
    auth.tenant!.accessToken,
    auth.tenant!.id,
  )

  const {
    data: productsData,
    isLoading: isFetchProductLoading,
    hasNextPage: hasProductNextPage,
    fetchNextPage: fetchProductNextPage,
  } = useInfiniteQuery({
    queryKey: ['product'],
    queryFn: ({ signal, pageParam }) => productService.getAllProduct({ page: pageParam, limit: 10, signal }),
    initialPageParam: 1,
    getNextPageParam: (lastPage) => {
      const nextPage = lastPage.paginationData.currentPage + 1
      if (nextPage > lastPage.paginationData.totalPage)
        return undefined
      return nextPage
    },
  })
  const products = productsData?.pages.flatMap(page => page.items)

  const activeProductId = accountFilter.product_id || 'default'
  const activeProductVariantId = accountFilter.product_variant_id || 'default'
  const activeStatus = accountFilter.status || 'default'

  const activeProductVariants = useMemo(() => {
    if (!products?.length || activeProductId === 'default')
      return []
    const variants = products.find(v => v.id === activeProductId)?.variants
    if (!variants)
      return []
    return variants
  }, [products, activeProductId])

  const handleProductChange = useCallback((productId: string) => {
    onAccountFilterChange({
      ...accountFilter,
      product_id: productId,
      product_variant_id: '',
    })
  }, [accountFilter, onAccountFilterChange])

  const handleProductVariantChange = useCallback((variantId: string) => {
    onAccountFilterChange({
      ...accountFilter,
      product_variant_id: variantId,
    })
  }, [accountFilter, onAccountFilterChange])

  const handleStatusChange = useCallback((status: string) => {
    onAccountFilterChange({
      ...accountFilter,
      status,
    })
  }, [accountFilter, onAccountFilterChange])

  useEffect(() => {
    if (hasProductNextPage && !isFetchProductLoading) {
      fetchProductNextPage()
    }
  }, [hasProductNextPage, isFetchProductLoading, fetchProductNextPage])

  return (
    <div className="flex flex-col gap-1">
      <p className="text-sm">Filter Produk</p>
      <div className="flex flex-row justify-start items-center gap-2 border-y border-gray-800 py-2 overflow-x-auto">
        <TabButton tabDefault tabName="default" tabActive={activeProductId} onClick={() => { handleProductChange('') }}>All</TabButton>
        {products?.length && products.map(product => (
          <TabButton key={`tab-product-${product.id}`} tabName={product.id} tabActive={activeProductId} onClick={(value) => { handleProductChange(value) }}>{product.name}</TabButton>
        ))}
        {isFetchProductLoading && (
          <>
            <Skeleton className="h-8 w-16 rounded-md" />
            <Skeleton className="h-8 w-16 rounded-md" />
            <Skeleton className="h-8 w-16 rounded-md" />
          </>
        )}
      </div>
      <p className="text-sm">Filter Varian Produk</p>
      <div className="flex flex-row justify-start items-center gap-2 border-y border-gray-800 py-2 overflow-x-auto">
        <TabButton tabDefault tabName="default" tabActive={activeProductVariantId} onClick={() => { handleProductVariantChange('') }}>All</TabButton>
        {activeProductVariants?.length > 0 && activeProductVariants.map(productVariant => (
          <TabButton key={`tab-product-variant-${productVariant.id}`} tabName={productVariant.id} tabActive={activeProductVariantId} onClick={(value) => { handleProductVariantChange(value) }}>{productVariant.name}</TabButton>
        ))}
      </div>
      <p className="text-sm">Filter Status</p>
      <div className="flex flex-row justify-start items-center gap-2 border-y border-gray-800 py-2 overflow-x-auto">
        <TabButton tabDefault tabName="default" tabActive={activeStatus} onClick={() => { handleStatusChange('') }}>All</TabButton>
        <TabButton tabName="ready" tabActive={activeStatus} onClick={(value) => { handleStatusChange(value) }}>Enable</TabButton>
        <TabButton tabName="disable" tabActive={activeStatus} onClick={(value) => { handleStatusChange(value) }}>Disable</TabButton>
        <TabButton tabName="active" tabActive={activeStatus} onClick={(value) => { handleStatusChange(value) }}>Aktif</TabButton>
        <TabButton tabName="freeze" tabActive={activeStatus} onClick={(value) => { handleStatusChange(value) }}>Freeze</TabButton>
      </div>
    </div>
  )
}
