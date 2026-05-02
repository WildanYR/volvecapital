import { createFileRoute } from '@tanstack/react-router'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { 
  Plus, 
  FileText, 
  EllipsisVertical,
  CheckCircle2,
  CircleDashed,
  ExternalLink,
  Eye,
  Tag
} from 'lucide-react'
import { useState } from 'react'
import { toast } from 'sonner'
import { Button } from '@/dashboard/components/ui/button'
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle,
} from '@/dashboard/components/ui/card'
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle 
} from '@/dashboard/components/ui/dialog'
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from '@/dashboard/components/ui/dropdown-menu'
import { Skeleton } from '@/dashboard/components/ui/skeleton'
import { Badge } from '@/dashboard/components/ui/badge'
import { API_URL, LANDING_URL } from '@/dashboard/constants/api-url.cont'
import { useAuth } from '@/dashboard/context-providers/auth.provider'
import { useGlobalAlertDialog } from '@/dashboard/context-providers/alert-dialog.provider'
import { ArticleServiceGenerator } from '@/dashboard/services/article.service'
import { ArticleForm } from '@/dashboard/components/forms/article.form'
import type { ArticleFormSubmitData } from '@/dashboard/components/forms/article.form'

export const Route = createFileRoute('/dashboard/setting/article/')({
  component: ArticleListPage,
})

function ArticleListPage() {
  const auth = useAuth()
  const queryClient = useQueryClient()
  const { showAlertDialog, hideAlertDialog } = useGlobalAlertDialog()
  const articleService = ArticleServiceGenerator(
    API_URL,
    auth.tenant!.accessToken,
    auth.tenant!.id,
  )

  const [dialogOpen, setDialogOpen] = useState(false)
  const [selectedArticle, setSelectedArticle] = useState<any>(null)
  const [formMode, setFormMode] = useState<'CREATE' | 'EDIT'>('CREATE')

  const { data: articles, isLoading } = useQuery({
    queryKey: ['articles'],
    queryFn: () => articleService.getAllArticles(),
  })

  const createMutation = useMutation({
    mutationFn: (payload: any) => articleService.createArticle(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['articles'] })
      toast.success('Artikel berhasil dibuat.')
      setDialogOpen(false)
    },
    onError: (error) => toast.error(`Gagal: ${error.message}`),
  })

  const updateMutation = useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: any }) => 
      articleService.updateArticle(id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['articles'] })
      toast.success('Artikel berhasil diperbarui.')
      setDialogOpen(false)
    },
    onError: (error) => toast.error(`Gagal: ${error.message}`),
  })

  const deleteMutation = useMutation({
    mutationFn: (id: string) => articleService.deleteArticle(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['articles'] })
      toast.success('Artikel berhasil dihapus.')
      hideAlertDialog()
    },
    onError: (error) => toast.error(`Gagal: ${error.message}`),
  })

  const handleCreate = () => {
    setFormMode('CREATE')
    setSelectedArticle(null)
    setDialogOpen(true)
  }

  const handleEdit = (article: any) => {
    setFormMode('EDIT')
    setSelectedArticle(article)
    setDialogOpen(true)
  }

  const handleDelete = (article: any) => {
    showAlertDialog({
      title: 'Hapus Artikel?',
      description: `Apakah Anda yakin ingin menghapus artikel "${article.title}"?`,
      confirmText: 'Hapus',
      isConfirming: deleteMutation.isPending,
      onConfirm: () => deleteMutation.mutate(article.id),
    })
  }

  const handleSubmit = (values: ArticleFormSubmitData) => {
    if (formMode === 'CREATE') {
      createMutation.mutate(values)
    } else {
      updateMutation.mutate({ id: selectedArticle.id, payload: values })
    }
  }

  const getArticleUrl = (slug: string) => {
    const tenantId = auth.tenant?.id || 'master'
    if (LANDING_URL.includes('localhost')) {
      return `http://${LANDING_URL}/blog/${slug}?tenant=${tenantId}`
    }
    return `https://${tenantId}.${LANDING_URL}/blog/${slug}`
  }

  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-col md:flex-row gap-6 justify-between items-center">
        <div className="space-y-1">
          <h1 className="text-4xl font-extrabold tracking-tight uppercase italic">Artikel & Blog</h1>
          <p className="text-muted-foreground text-sm">Kelola konten berita dan update untuk pengunjung website Anda.</p>
        </div>
        <Button onClick={handleCreate} className="gap-2 bg-[#f97316] hover:bg-[#ef4444] text-white border-none shadow-lg">
          <Plus className="size-4" />
          Tulis Artikel Baru
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {isLoading ? (
          Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-64 rounded-xl" />
          ))
        ) : articles?.length ? (
          articles.map((article) => (
            <Card key={article.id} className="group hover:border-[#f97316]/50 transition-all overflow-hidden bg-white/5 border-white/10">
              <div className="aspect-video relative overflow-hidden bg-black/40">
                {article.thumbnail_url ? (
                  <img 
                    src={article.thumbnail_url} 
                    alt={article.title} 
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" 
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center opacity-20">
                    <FileText className="size-12" />
                  </div>
                )}
                <div className="absolute top-3 left-3 flex gap-2">
                  {article.is_published ? (
                    <Badge className="bg-emerald-500/20 text-emerald-500 border-emerald-500/30 gap-1 backdrop-blur-sm">
                      <CheckCircle2 className="size-3" /> Published
                    </Badge>
                  ) : (
                    <Badge variant="outline" className="bg-black/40 text-neutral-400 border-white/10 gap-1 backdrop-blur-sm">
                      <CircleDashed className="size-3" /> Draft
                    </Badge>
                  )}
                </div>
                {article.category && (
                  <div className="absolute bottom-3 left-3">
                    <Badge variant="secondary" className="bg-white/10 text-white border-white/10 backdrop-blur-md gap-1">
                      <Tag className="size-3" /> {article.category}
                    </Badge>
                  </div>
                )}
              </div>
              <CardHeader className="space-y-1">
                <div className="flex justify-between items-start gap-2">
                  <CardTitle className="text-xl line-clamp-1 group-hover:text-[#f97316] transition-colors">{article.title}</CardTitle>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-8 w-8">
                        <EllipsisVertical className="size-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => handleEdit(article)}>
                        Edit Artikel
                      </DropdownMenuItem>
                       <DropdownMenuItem asChild>
                          <a 
                           href={getArticleUrl(article.slug)}
                           target="_blank" 
                           rel="noreferrer"
                           className="flex items-center gap-2"
                          >
                            <Eye className="size-4" /> Lihat Halaman
                          </a>
                       </DropdownMenuItem>
                      <DropdownMenuItem 
                        onClick={() => handleDelete(article)}
                        className="text-red-500 focus:text-red-500 focus:bg-red-500/10"
                      >
                        Hapus
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
                <CardDescription className="line-clamp-2 text-sm">{article.subtitle || 'Tidak ada deskripsi'}</CardDescription>
              </CardHeader>
              <CardContent className="pt-0 flex items-center justify-between">
                <span className="text-xs text-neutral-500">{article.content_steps?.length || 0} Poin Konten</span>
                <Button variant="ghost" size="sm" onClick={() => handleEdit(article)} className="text-xs gap-1 group/btn">
                  Edit Detail <ExternalLink className="size-3 opacity-0 group-hover/btn:opacity-100 transition-opacity" />
                </Button>
              </CardContent>
            </Card>
          ))
        ) : (
          <Card className="col-span-full border-dashed border-white/10 bg-transparent py-16">
            <CardContent className="flex flex-col items-center gap-4 text-center">
              <div className="p-4 bg-white/5 rounded-full">
                <FileText className="size-10 text-neutral-600" />
              </div>
              <div className="space-y-1">
                <p className="text-xl font-bold">Belum Ada Artikel</p>
                <p className="text-muted-foreground max-w-xs">
                  Mulai tulis artikel pertama Anda untuk memberikan update terbaru kepada pengunjung.
                </p>
              </div>
              <Button onClick={handleCreate} variant="secondary" className="mt-4">
                Tulis Artikel Pertama
              </Button>
            </CardContent>
          </Card>
        )}
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{formMode === 'CREATE' ? 'Tulis Artikel Baru' : 'Edit Artikel'}</DialogTitle>
          </DialogHeader>
          <ArticleForm
            initialData={selectedArticle}
            isPending={createMutation.isPending || updateMutation.isPending}
            onSubmit={handleSubmit}
            submitButtonText={formMode === 'CREATE' ? 'Simpan Artikel' : 'Perbarui Artikel'}
          />
        </DialogContent>
      </Dialog>
    </div>
  )
}
