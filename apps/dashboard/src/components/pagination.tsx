import { ChevronLeft, ChevronRight } from 'lucide-react'
import { useMemo } from 'react'
import { Button } from '@/dashboard/components/ui/button'

interface PaginationProps {
  currentPage: number
  totalPages: number
  onPageChange: (page: number) => void
  maxVisiblePages?: number // default 5
}

export function Pagination({
  currentPage,
  totalPages,
  onPageChange,
  maxVisiblePages = 5,
}: PaginationProps) {
  const pages = useMemo(() => {
    const half = Math.floor(maxVisiblePages / 2)
    let start = Math.max(2, currentPage - half) // mulai dari 2 (1 selalu ditampilkan)
    let end = Math.min(totalPages - 1, currentPage + half) // berhenti di totalPages - 1 (last selalu ditampilkan)

    // Jika dekat awal
    if (currentPage <= half + 1) {
      start = 2
      end = Math.min(totalPages - 1, maxVisiblePages)
    }

    // Jika dekat akhir
    if (currentPage >= totalPages - half) {
      start = Math.max(2, totalPages - maxVisiblePages + 1)
      end = totalPages - 1
    }

    const range = Array.from({ length: end - start + 1 }, (_, i) => start + i)

    const result: Array<number | '...'> = []

    // Always show first page
    result.push(1)

    // Ellipsis after first if needed
    if (start > 2)
      result.push('...')

    result.push(...range)

    // Ellipsis before last if needed
    if (end < totalPages - 1)
      result.push('...')

    // Always show last page (if more than 1)
    if (totalPages > 1)
      result.push(totalPages)

    return result
  }, [currentPage, totalPages, maxVisiblePages])

  return (
    <div className="flex items-center gap-2">
      <Button
        variant="outline"
        size="sm"
        onClick={() => onPageChange(currentPage - 1)}
        disabled={currentPage === 1}
      >
        <ChevronLeft className="size-4" />
      </Button>

      {pages.map((page, idx) =>
        page === '...'
          ? (
              <span key={`ellipsis-${idx}`} className="px-2">
                ...
              </span>
            )
          : (
              <Button
                key={page}
                variant={page === currentPage ? 'default' : 'outline'}
                size="sm"
                onClick={() => onPageChange(page)}
              >
                {page}
              </Button>
            ),
      )}

      <Button
        variant="outline"
        size="sm"
        onClick={() => onPageChange(currentPage + 1)}
        disabled={currentPage === totalPages}
      >
        <ChevronRight className="size-4" />
      </Button>
    </div>
  )
}
