import type React from 'react'
import { SearchX } from 'lucide-react'

export function NoData({ children }: { children: React.ReactNode }) {
  return (
    <div className="col-span-full flex flex-col justify-center items-center gap-4">
      <SearchX className="size-14" />
      <p className="text-sm">{children}</p>
    </div>
  )
}
