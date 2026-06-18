import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { ManualBookForm, type ManualBookFormSubmitData } from '@/dashboard/components/forms/manual-book.form'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { API_URL } from '@/dashboard/constants/api-url.cont'
import { useAuth } from '@/dashboard/context-providers/auth.provider'
import { ManualBookServiceGenerator } from '@/dashboard/services/manual-book.service'
import { ArrowLeft } from 'lucide-react'
import { Button } from '@/dashboard/components/ui/button'
import { Link } from '@tanstack/react-router'
import { Card, CardContent } from '@/dashboard/components/ui/card'

export const Route = createFileRoute('/dashboard/manual-book/write')({
  component: WriteManualBookPage,
})

function WriteManualBookPage() {
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

  const createBookMut = useMutation({
    mutationFn: (payload: any) => mbService.createManualBook(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['manual-books'] })
      toast.success('Buku panduan berhasil dibuat.')
      navigate({ to: '/dashboard/manual-book' })
    },
    onError: error => toast.error(`Gagal: ${error.message}`),
  })

  const handleBookSubmit = (val: ManualBookFormSubmitData) => {
    createBookMut.mutate(val)
  }

  return (
    <div className="flex flex-col gap-8 max-w-5xl mx-auto w-full pb-10">
      <div className="flex items-center gap-4">
        <Link to="/dashboard/manual-book">
          <Button variant="ghost" size="icon" className="rounded-full">
            <ArrowLeft className="size-5" />
          </Button>
        </Link>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Tulis Panduan Baru</h1>
          <p className="text-muted-foreground">Buat SOP atau panduan baru untuk tim Anda.</p>
        </div>
      </div>

      <Card>
        <CardContent className="pt-6">
          <ManualBookForm 
            categories={categories || []} 
            isPending={createBookMut.isPending} 
            onSubmit={handleBookSubmit} 
          />
        </CardContent>
      </Card>
    </div>
  )
}
