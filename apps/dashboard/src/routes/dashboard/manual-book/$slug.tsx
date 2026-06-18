import { useQuery } from '@tanstack/react-query'
import { createFileRoute, Link } from '@tanstack/react-router'
import { ArrowLeft, Calendar, Tag, BookOpen } from 'lucide-react'
import { Badge } from '@/dashboard/components/ui/badge'
import { Button } from '@/dashboard/components/ui/button'
import { Skeleton } from '@/dashboard/components/ui/skeleton'
import { API_URL } from '@/dashboard/constants/api-url.cont'
import { useAuth } from '@/dashboard/context-providers/auth.provider'
import { ManualBookServiceGenerator } from '@/dashboard/services/manual-book.service'
import { RichTextEditor } from '@/dashboard/components/ui/rich-text-editor'

export const Route = createFileRoute('/dashboard/manual-book/$slug')({
  component: ManualBookDetailPage,
})

function ManualBookDetailPage() {
  const { slug } = Route.useParams()
  const auth = useAuth()
  
  const mbService = ManualBookServiceGenerator(
    API_URL,
    auth.tenant!.accessToken,
    auth.tenant!.id,
  )

  const { data: book, isLoading, error } = useQuery({
    queryKey: ['manual-book', slug],
    queryFn: () => mbService.getManualBookBySlug(slug),
  })

  if (isLoading) {
    return (
      <div className="max-w-4xl mx-auto space-y-8 animate-pulse">
        <Skeleton className="h-8 w-24" />
        <div className="space-y-4">
          <Skeleton className="h-12 w-3/4" />
          <div className="flex gap-4">
            <Skeleton className="h-6 w-32" />
            <Skeleton className="h-6 w-32" />
          </div>
        </div>
        <Skeleton className="h-[400px] w-full" />
      </div>
    )
  }

  if (error || !book) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center space-y-4">
        <BookOpen className="size-16 text-muted-foreground opacity-50" />
        <h2 className="text-2xl font-bold">Panduan Tidak Ditemukan</h2>
        <p className="text-muted-foreground max-w-md">
          Buku panduan yang Anda cari tidak ada atau belum dipublikasikan.
        </p>
        <Link to="/dashboard/manual-book">
          <Button variant="outline" className="mt-4 gap-2">
            <ArrowLeft className="size-4" /> Kembali ke Daftar
          </Button>
        </Link>
      </div>
    )
  }

  const formattedDate = new Date(book.updated_at).toLocaleDateString('id-ID', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })

  return (
    <div className="max-w-5xl mx-auto">
      <Link to="/dashboard/manual-book" className="inline-flex mb-8">
        <Button variant="ghost" className="gap-2 text-muted-foreground hover:text-foreground">
          <ArrowLeft className="size-4" />
          Kembali ke Daftar Panduan
        </Button>
      </Link>

      <article className="bg-card rounded-2xl border shadow-sm overflow-hidden">
        <div className="p-8 md:p-12 border-b bg-muted/30">
          <div className="flex flex-wrap gap-3 mb-6">
            {book.category && (
              <Badge variant="secondary" className="bg-primary/10 text-primary hover:bg-primary/20 border-primary/20 gap-1.5 px-3 py-1">
                <Tag className="size-3.5" /> {book.category.name}
              </Badge>
            )}
            <Badge variant="outline" className="gap-1.5 px-3 py-1 text-muted-foreground">
              <Calendar className="size-3.5" /> Diperbarui {formattedDate}
            </Badge>
          </div>

          <h1 className="text-3xl md:text-5xl font-extrabold tracking-tight mb-4 text-foreground leading-tight">
            {book.title}
          </h1>
        </div>

        <div className="p-8 md:p-12 bg-background">
          {book.content ? (
            <RichTextEditor content={book.content} onChange={() => {}} readOnly={true} />
          ) : (
            <div className="text-center py-12 text-muted-foreground italic">
              Tidak ada konten untuk panduan ini.
            </div>
          )}
        </div>
      </article>
    </div>
  )
}
