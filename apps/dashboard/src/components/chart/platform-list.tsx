import type { AllStatistic } from '@/dashboard/services/statistic.service'

export function PlatformList({ data }: { data: AllStatistic['platform'] }) {
  return (
    <div className="flex flex-col gap-4 py-2">
      {data.length === 0 ? (
        <div className="text-center text-sm text-muted-foreground p-4">Belum ada data</div>
      ) : (
        data.map((item) => (
          <div key={item.platform} className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="font-medium text-sm">{item.platform}</span>
            </div>
            <div className="font-medium text-sm">{item.transaction_count} transaksi</div>
          </div>
        ))
      )}
    </div>
  )
}
