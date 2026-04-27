import { createFileRoute, Link } from '@tanstack/react-router'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { 
  Plus, 
  BookOpen, 
  Trash2, 
  ExternalLink, 
  EllipsisVertical,
  CheckCircle2,
  CircleDashed,
  Eye
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
  CardAction
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
import { API_URL } from '@/dashboard/constants/api-url.cont'
import { useAuth } from '@/dashboard/context-providers/auth.provider'
import { useGlobalAlertDialog } from '@/dashboard/context-providers/alert-dialog.provider'
import { TutorialServiceGenerator } from '@/dashboard/services/tutorial.service'
import { TutorialForm } from '@/dashboard/components/forms/tutorial.form'
import type { TutorialFormSubmitData } from '@/dashboard/components/forms/tutorial.form'

export const Route = createFileRoute('/dashboard/setting/tutorial/')({
  component: TutorialListPage,
})

function TutorialListPage() {
  const auth = useAuth()
  const queryClient = useQueryClient()
  const { showAlertDialog, hideAlertDialog } = useGlobalAlertDialog()
  const tutorialService = TutorialServiceGenerator(
    API_URL,
    auth.tenant!.accessToken,
    auth.tenant!.id,
  )

  const [dialogOpen, setDialogOpen] = useState(false)
  const [selectedTutorial, setSelectedTutorial] = useState<any>(null)
  const [formMode, setFormMode] = useState<'CREATE' | 'EDIT'>('CREATE')

  const { data: tutorials, isLoading } = useQuery({
    queryKey: ['tutorials'],
    queryFn: () => tutorialService.getAllTutorials(),
  })

  const createMutation = useMutation({
    mutationFn: (payload: any) => tutorialService.createTutorial(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tutorials'] })
      toast.success('Tutorial berhasil dibuat.')
      setDialogOpen(false)
    },
    onError: (error) => toast.error(`Gagal: ${error.message}`),
  })

  const updateMutation = useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: any }) => 
      tutorialService.updateTutorial(id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tutorials'] })
      toast.success('Tutorial berhasil diperbarui.')
      setDialogOpen(false)
    },
    onError: (error) => toast.error(`Gagal: ${error.message}`),
  })

  const deleteMutation = useMutation({
    mutationFn: (id: string) => tutorialService.deleteTutorial(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tutorials'] })
      toast.success('Tutorial berhasil dihapus.')
      hideAlertDialog()
    },
    onError: (error) => toast.error(`Gagal: ${error.message}`),
  })

  const handleCreate = () => {
    setFormMode('CREATE')
    setSelectedTutorial(null)
    setDialogOpen(true)
  }

  const handleEdit = (tutorial: any) => {
    setFormMode('EDIT')
    setSelectedTutorial(tutorial)
    setDialogOpen(true)
  }

  const handleDelete = (tutorial: any) => {
    showAlertDialog({
      title: 'Hapus Tutorial?',
      description: `Apakah Anda yakin ingin menghapus tutorial "${tutorial.title}"?`,
      confirmText: 'Hapus',
      isConfirming: deleteMutation.isPending,
      onConfirm: () => deleteMutation.mutate(tutorial.id),
    })
  }

  const handleSubmit = (values: TutorialFormSubmitData) => {
    if (formMode === 'CREATE') {
      createMutation.mutate(values)
    } else {
      updateMutation.mutate({ id: selectedTutorial.id, payload: values })
    }
  }

  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-col md:flex-row gap-6 justify-between items-center">
        <div className="space-y-1">
          <h1 className="text-4xl font-extrabold tracking-tight">Tutorial</h1>
          <p className="text-muted-foreground text-sm">Kelola panduan dan langkah-langkah untuk pengguna Anda.</p>
        </div>
        <Button onClick={handleCreate} className="gap-2">
          <Plus className="size-4" />
          Buat Tutorial Baru
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {isLoading ? (
          Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-64 rounded-xl" />
          ))
        ) : tutorials?.length ? (
          tutorials.map((tutorial) => (
            <Card key={tutorial.id} className="group hover:border-primary/50 transition-all overflow-hidden bg-white/5 border-white/10">
              <div className="aspect-video relative overflow-hidden bg-black/40">
                {tutorial.thumbnail_url ? (
                  <img 
                    src={tutorial.thumbnail_url} 
                    alt={tutorial.title} 
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" 
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center opacity-20">
                    <BookOpen className="size-12" />
                  </div>
                )}
                <div className="absolute top-3 left-3">
                  {tutorial.is_published ? (
                    <Badge className="bg-green-500/20 text-green-500 border-green-500/30 gap-1 backdrop-blur-sm">
                      <CheckCircle2 className="size-3" /> Published
                    </Badge>
                  ) : (
                    <Badge variant="outline" className="bg-black/40 text-neutral-400 border-white/10 gap-1 backdrop-blur-sm">
                      <CircleDashed className="size-3" /> Draft
                    </Badge>
                  )}
                </div>
              </div>
              <CardHeader className="space-y-1">
                <div className="flex justify-between items-start gap-2">
                  <CardTitle className="text-xl line-clamp-1">{tutorial.title}</CardTitle>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-8 w-8">
                        <EllipsisVertical className="size-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => handleEdit(tutorial)}>
                        Edit Tutorial
                      </DropdownMenuItem>
                      <DropdownMenuItem asChild>
                         <a 
                          href={`http://${auth.tenant?.id}.localhost:3001/tutorial/${tutorial.slug}`} 
                          target="_blank" 
                          rel="noreferrer"
                          className="flex items-center gap-2"
                         >
                           <Eye className="size-4" /> Lihat Halaman
                         </a>
                      </DropdownMenuItem>
                      <DropdownMenuItem 
                        onClick={() => handleDelete(tutorial)}
                        className="text-red-500 focus:text-red-500 focus:bg-red-500/10"
                      >
                        Hapus
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
                <CardDescription className="line-clamp-2 text-sm">{tutorial.subtitle || 'Tidak ada deskripsi'}</CardDescription>
              </CardHeader>
              <CardContent className="pt-0 flex items-center justify-between">
                <span className="text-xs text-neutral-500">{tutorial.steps.length} Langkah</span>
                <Button variant="ghost" size="sm" onClick={() => handleEdit(tutorial)} className="text-xs gap-1 group/btn">
                  Edit Detail <ExternalLink className="size-3 opacity-0 group-hover/btn:opacity-100 transition-opacity" />
                </Button>
              </CardContent>
            </Card>
          ))
        ) : (
          <Card className="col-span-full border-dashed border-white/10 bg-transparent py-16">
            <CardContent className="flex flex-col items-center gap-4 text-center">
              <div className="p-4 bg-white/5 rounded-full">
                <BookOpen className="size-10 text-neutral-600" />
              </div>
              <div className="space-y-1">
                <p className="text-xl font-bold">Belum Ada Tutorial</p>
                <p className="text-muted-foreground max-w-xs">
                  Mulai buat tutorial pertama Anda untuk memandu pengguna menggunakan layanan Anda.
                </p>
              </div>
              <Button onClick={handleCreate} variant="secondary" className="mt-4">
                Buat Tutorial Pertama
              </Button>
            </CardContent>
          </Card>
        )}
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{formMode === 'CREATE' ? 'Buat Tutorial Baru' : 'Edit Tutorial'}</DialogTitle>
          </DialogHeader>
          <TutorialForm
            initialData={selectedTutorial}
            isPending={createMutation.isPending || updateMutation.isPending}
            onSubmit={handleSubmit}
            submitButtonText={formMode === 'CREATE' ? 'Simpan Tutorial' : 'Perbarui Tutorial'}
          />
        </DialogContent>
      </Dialog>
    </div>
  )
}
