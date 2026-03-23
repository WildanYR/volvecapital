import type { AllStatistic } from '@/dashboard/services/statistic.service'

export function ProductSales({ data }: { data: AllStatistic['product'] }) {
  // Ambil hanya 3 data teratas (data dari API sudah di sort secara DESC)
  const topProducts = data.slice(0, 3)

  return (
    <div className="flex flex-col gap-4 py-2">
      {topProducts.length === 0 ? (
        <div className="text-center text-sm text-muted-foreground p-4">
          Belum ada data
        </div>
      ) : (
        topProducts.map((item, index) => (
          <div key={item.product_variant_id} className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-primary font-bold text-sm">
                {index + 1}
              </div>
              <div className="flex flex-col">
                <span className="font-medium text-sm">
                  {item.product_variant.product.name}
                </span>
                <span className="text-xs text-muted-foreground">
                  {item.product_variant.name}
                </span>
              </div>
            </div>
            <div className="font-medium text-sm">{item.items_sold} terjual</div>
          </div>
        ))
      )}
    </div>
  )
}
