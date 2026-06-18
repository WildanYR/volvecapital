import { ManualBookForm, type ManualBookFormSubmitData } from '@/dashboard/components/forms/manual-book.form'
import { ManualBookCategoryForm, type ManualBookCategoryFormSubmitData } from '@/dashboard/components/forms/manual-book-category.form'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { createFileRoute, Link } from '@tanstack/react-router'
import {
  CheckCircle2,
  CircleDashed,
  EllipsisVertical,
  ExternalLink,
  Eye,
  BookOpen,
  Plus,
  Tag,
  FolderOpen,
  Search,
} from 'lucide-react'
import { useState } from 'react'
import { toast } from 'sonner'
import { PermissionGate } from '@/dashboard/components/permission-gate'
import { Badge } from '@/dashboard/components/ui/badge'
import { Button } from '@/dashboard/components/ui/button'
import { Input } from '@/dashboard/components/ui/input'
import { useDebounce } from '@/dashboard/hooks/use-debounce'
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
  DialogTitle,
  DialogDescription,
} from '@/dashboard/components/ui/dialog'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/dashboard/components/ui/dropdown-menu'
import { Skeleton } from '@/dashboard/components/ui/skeleton'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/dashboard/components/ui/tabs'
import { API_URL } from '@/dashboard/constants/api-url.cont'
import { useGlobalAlertDialog } from '@/dashboard/context-providers/alert-dialog.provider'
import { useAuth } from '@/dashboard/context-providers/auth.provider'
import { ManualBookServiceGenerator } from '@/dashboard/services/manual-book.service'

export const Route = createFileRoute('/dashboard/manual-book/')({
  component: ManualBookPage,
})

function ManualBookPage() {
  const auth = useAuth()
  const queryClient = useQueryClient()
  const { showAlertDialog, hideAlertDialog } = useGlobalAlertDialog()
  const mbService = ManualBookServiceGenerator(
    API_URL,
    auth.tenant!.accessToken,
    auth.tenant!.id,
  )

  const [catDialogOpen, setCatDialogOpen] = useState(false)
  
  const [selectedCat, setSelectedCat] = useState<any>(null)
  
  const [catFormMode, setCatFormMode] = useState<'CREATE' | 'EDIT'>('CREATE')
  const [activeTab, setActiveTab] = useState('books')
  
  const [search, setSearch] = useState('')
  const debouncedSearch = useDebounce(search, 500)

  const { data: books, isLoading: isBooksLoading } = useQuery({
    queryKey: ['manual-books', debouncedSearch],
    queryFn: () => mbService.getAllManualBooks({ q: debouncedSearch }),
  })

  const { data: categories, isLoading: isCatLoading } = useQuery({
    queryKey: ['manual-book-categories'],
    queryFn: () => mbService.getAllCategories(),
  })

  const buildCategoryTree = (cats: any[], parentId: string | null = null, depth = 0): any[] => {
    return cats
      .filter(c => c.parent_id === parentId || (parentId === null && !c.parent_id))
      .reduce((acc, cat) => {
        return [...acc, { ...cat, depth }, ...buildCategoryTree(cats, cat.id, depth + 1)];
      }, []);
  };

  const flatCategoriesTree = categories ? buildCategoryTree(categories) : [];

  const deleteBookMut = useMutation({
    mutationFn: (id: string) => mbService.deleteManualBook(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['manual-books'] })
      toast.success('Buku panduan dihapus.')
      hideAlertDialog()
    },
    onError: error => toast.error(`Gagal: ${error.message}`),
  })

  // --- Category Mutations ---
  const createCatMut = useMutation({
    mutationFn: (payload: any) => mbService.createCategory(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['manual-book-categories'] })
      toast.success('Kategori berhasil dibuat.')
      setCatDialogOpen(false)
    },
    onError: error => toast.error(`Gagal: ${error.message}`),
  })

  const updateCatMut = useMutation({
    mutationFn: ({ id, payload }: { id: string, payload: any }) =>
      mbService.updateCategory(id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['manual-book-categories'] })
      toast.success('Kategori diperbarui.')
      setCatDialogOpen(false)
    },
    onError: error => toast.error(`Gagal: ${error.message}`),
  })

  const deleteCatMut = useMutation({
    mutationFn: (id: string) => mbService.deleteCategory(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['manual-book-categories'] })
      toast.success('Kategori dihapus.')
      hideAlertDialog()
    },
    onError: error => toast.error(`Gagal: ${error.message}`),
  })

  // --- Handlers ---

  const handleCatSubmit = (val: ManualBookCategoryFormSubmitData) => {
    if (catFormMode === 'CREATE') createCatMut.mutate(val)
    else updateCatMut.mutate({ id: selectedCat.id, payload: val })
  }

  const confirmDeleteBook = (item: any) => {
    showAlertDialog({
      title: 'Hapus Panduan?',
      description: `Yakin ingin menghapus panduan "${item.title}"?`,
      confirmText: 'Hapus',
      isConfirming: deleteBookMut.isPending,
      onConfirm: () => deleteBookMut.mutate(item.id),
    })
  }

  const confirmDeleteCat = (item: any) => {
    showAlertDialog({
      title: 'Hapus Kategori?',
      description: `Yakin ingin menghapus kategori "${item.name}"? Ini tidak akan menghapus artikel di dalamnya.`,
      confirmText: 'Hapus',
      isConfirming: deleteCatMut.isPending,
      onConfirm: () => deleteCatMut.mutate(item.id),
    })
  }

  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-col md:flex-row gap-6 justify-between items-center">
        <div className="space-y-1">
          <h1 className="text-4xl font-extrabold tracking-tight uppercase italic">Manual Book & SOP</h1>
          <p className="text-muted-foreground text-sm">Pusat pengetahuan dan panduan operasional perusahaan Anda.</p>
        </div>
        <PermissionGate permission="manualbook.create">
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => {
              setCatFormMode('CREATE'); setSelectedCat(null); setCatDialogOpen(true);
            }}>
              <Plus className="size-4 mr-2" />
              Kategori Baru
            </Button>
            <Button asChild className="bg-primary hover:bg-primary/90 text-primary-foreground border-none shadow-lg cursor-pointer">
              <Link to="/dashboard/manual-book/write" onClick={(e) => {
                if (!categories?.length) {
                  e.preventDefault()
                  toast.error('Buat kategori terlebih dahulu')
                }
              }}>
                <Plus className="size-4 mr-2" />
                Tulis Panduan
              </Link>
            </Button>
          </div>
        </PermissionGate>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <div className="flex flex-col sm:flex-row justify-between gap-4 mb-6">
          <TabsList>
            <TabsTrigger value="books" className="gap-2"><BookOpen className="size-4" /> Daftar Panduan</TabsTrigger>
            <TabsTrigger value="categories" className="gap-2"><FolderOpen className="size-4" /> Kategori</TabsTrigger>
          </TabsList>

          {activeTab === 'books' && (
            <div className="relative max-w-sm w-full">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
              <Input 
                placeholder="Cari judul atau isi panduan..." 
                className="pl-9"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
          )}
        </div>

        <TabsContent value="books">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {isBooksLoading
              ? Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-40 rounded-xl" />)
              : books?.length
                ? books.map((book) => (
                    <Card key={book.id} className="group hover:border-primary/50 transition-all overflow-hidden bg-card">
                      <CardHeader className="space-y-1 pb-2">
                        <div className="flex justify-between items-start gap-2">
                          <CardTitle className="text-xl line-clamp-1 group-hover:text-primary transition-colors">
                            {book.title}
                          </CardTitle>
                          <PermissionGate permission="manualbook.edit,manualbook.delete">
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon" className="h-8 w-8 -mt-2 -mr-2">
                                  <EllipsisVertical className="size-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem asChild>
                                  <Link to="/dashboard/manual-book/edit/$id" params={{ id: book.id }} className="w-full cursor-pointer">
                                    Edit Panduan
                                  </Link>
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => confirmDeleteBook(book)} className="text-red-500">
                                  Hapus
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </PermissionGate>
                        </div>
                        <div className="flex gap-2 text-xs">
                          {book.category && (
                            <Badge variant="secondary" className="font-normal"><Tag className="size-3 mr-1"/>{book.category.name}</Badge>
                          )}
                          <Badge variant="outline" className={book.status === 'PUBLISHED' ? 'text-emerald-500 border-emerald-500/30' : 'text-orange-500 border-orange-500/30'}>
                            {book.status === 'PUBLISHED' ? <CheckCircle2 className="size-3 mr-1" /> : <CircleDashed className="size-3 mr-1" />}
                            {book.status}
                          </Badge>
                        </div>
                      </CardHeader>
                      <CardContent className="pt-4 border-t mt-4 flex items-center justify-between">
                        <Link to="/dashboard/manual-book/$slug" params={{ slug: book.slug }} className="w-full">
                          <Button variant="secondary" className="w-full gap-2">
                            <Eye className="size-4" /> Baca Panduan
                          </Button>
                        </Link>
                      </CardContent>
                    </Card>
                  ))
                : (
                    <Card className="col-span-full border-dashed bg-transparent py-16">
                      <CardContent className="flex flex-col items-center text-center">
                        <BookOpen className="size-10 text-muted-foreground mb-4" />
                        <p className="text-xl font-bold">Belum Ada Panduan</p>
                        <p className="text-muted-foreground max-w-xs">Buat panduan operasional pertama Anda.</p>
                      </CardContent>
                    </Card>
                  )}
          </div>
        </TabsContent>

        <TabsContent value="categories">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {isCatLoading
              ? Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-24 rounded-xl" />)
              : flatCategoriesTree.map((cat) => (
                <Card key={cat.id} className="relative group" style={{ marginLeft: `${cat.depth * 1.5}rem` }}>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-lg flex items-center gap-2">
                      <FolderOpen className="size-4 text-primary" />
                      {cat.name}
                    </CardTitle>
                    <CardDescription className="text-xs line-clamp-1">{cat.description || '-'}</CardDescription>
                  </CardHeader>
                  <PermissionGate permission="manualbook.edit,manualbook.delete">
                    <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-6 w-6"><EllipsisVertical className="size-4" /></Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent>
                          <DropdownMenuItem onClick={() => { setCatFormMode('EDIT'); setSelectedCat(cat); setCatDialogOpen(true); }}>Edit</DropdownMenuItem>
                          <DropdownMenuItem onClick={() => confirmDeleteCat(cat)} className="text-red-500">Hapus</DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </PermissionGate>
                </Card>
              ))}
          </div>
        </TabsContent>
      </Tabs>



      <Dialog open={catDialogOpen} onOpenChange={setCatDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{catFormMode === 'CREATE' ? 'Kategori Baru' : 'Edit Kategori'}</DialogTitle>
            <DialogDescription className="sr-only">Form Kategori Panduan</DialogDescription>
          </DialogHeader>
          <ManualBookCategoryForm categories={categories} initialData={selectedCat} isPending={createCatMut.isPending || updateCatMut.isPending} onSubmit={handleCatSubmit} />
        </DialogContent>
      </Dialog>
    </div>
  )
}
