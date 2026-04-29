import type React from 'react'
import { SearchX } from 'lucide-react'

export function NoData({ 
  children, 
  title = "Belum Ada Data", 
  description = "Silakan tambahkan data baru untuk memulai."
}: { 
  children?: React.ReactNode
  title?: string
  description?: string
}) {
  return (
    <div className="col-span-full flex flex-col justify-center items-center gap-4">
      <SearchX className="size-14" />
      {title && <h3 className="text-lg font-semibold">{title}</h3>}
      {description && <p className="text-sm text-muted-foreground text-center">{description}</p>}
      {children && <p className="text-sm">{children}</p>}
    </div>
  )
}
