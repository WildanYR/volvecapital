import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { ManualBookForm, type ManualBookFormSubmitData } from '@/dashboard/components/forms/manual-book.form'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { API_URL } from '@/dashboard/constants/api-url.cont'
import { useAuth } from '@/dashboard/context-providers/auth.provider'
import { ManualBookServiceGenerator } from '@/dashboard/services/manual-book.service'
import { ArrowLeft, Loader2 } from 'lucide-react'
import { Button } from '@/dashboard/components/ui/button'
import { Link } from '@tanstack/react-router'
import { Card, CardContent } from '@/dashboard/components/ui/card'

export const Route = createFileRoute('/dashboard/manual-book/edit/$id')({
  component: EditManualBookPage,
})

function EditManualBookPage() {
  const { id } = Route.useParams()
  const auth = useAuth()
  const queryClient = useQueryClient()
  const navigate = useNavigate()
  const mbService = ManualBookServiceGenerator(
    API_URL,
    auth.tenant!.accessToken,
    auth.tenant!.id,
  )

  const { data: categories } = useQuery({
    queryKey: ['manual-book-categories'],
    queryFn: () => mbService.getAllCategories(),
  })

  const { data: book, isLoading } = useQuery({
    queryKey: ['manual-book', id],
    queryFn: () => mbService.getManualBookById(id),
  })

  const updateBookMut = useMutation({
    mutationFn: (payload: any) => mbService.updateManualBook(id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['manual-books'] })
      queryClient.invalidateQueries({ queryKey: ['manual-book', id] })
      toast.success('Buku panduan berhasil diperbarui.')
      navigate({ to: '/dashboard/manual-book' })
    },
    onError: error => toast.error(`Gagal: ${error.message}`),
  })

  const handleBookSubmit = (val: ManualBookFormSubmitData) => {
    updateBookMut.mutate(val)
  }

  if (isLoading) {
    return (
      <div className="flex h-[50vh] items-center justify-center">
        <Loader2 className="size-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (!book) {
    return (
      <div className="flex h-[50vh] flex-col items-center justify-center gap-4">
        <p className="text-muted-foreground">Buku panduan tidak ditemukan.</p>
        <Link to="/dashboard/manual-book">
          <Button variant="outline">Kembali</Button>
        </Link>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-8 w-full pb-10">
      <div className="flex items-center gap-4">
        <Link to="/dashboard/manual-book">
          <Button variant="ghost" size="icon" className="rounded-full">
            <ArrowLeft className="size-5" />
          </Button>
        </Link>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Edit Panduan</h1>
          <p className="text-muted-foreground">Perbarui konten panduan {book.title}.</p>
        </div>
      </div>

      <Card>
        <CardContent className="pt-6">
          <ManualBookForm 
            initialData={book}
            categories={categories || []} 
            isPending={updateBookMut.isPending} 
            onSubmit={handleBookSubmit} 
          />
        </CardContent>
      </Card>
    </div>
  )
}
