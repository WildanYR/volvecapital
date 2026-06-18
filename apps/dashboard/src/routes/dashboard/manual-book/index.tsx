import { ManualBookCategoryForm, type ManualBookCategoryFormSubmitData } from '@/dashboard/components/forms/manual-book-category.form'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { createFileRoute, Link } from '@tanstack/react-router'
import {
  EllipsisVertical,
  BookOpen,
  Plus,
  FolderOpen,
  Search,
  ChevronRight,
  ChevronDown,
  FileText
} from 'lucide-react'
import { useState, useEffect } from 'react'
import { toast } from 'sonner'
import { PermissionGate } from '@/dashboard/components/permission-gate'
import { Badge } from '@/dashboard/components/ui/badge'
import { Button } from '@/dashboard/components/ui/button'
import { Input } from '@/dashboard/components/ui/input'
import { useDebounce } from '@/dashboard/hooks/use-debounce'
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
import { API_URL } from '@/dashboard/constants/api-url.cont'
import { useGlobalAlertDialog } from '@/dashboard/context-providers/alert-dialog.provider'
import { useAuth } from '@/dashboard/context-providers/auth.provider'
import { ManualBookServiceGenerator } from '@/dashboard/services/manual-book.service'

export const Route = createFileRoute('/dashboard/manual-book/')({
  component: ManualBookPage,
})

// Recursive Component for Tree Node
const CategoryTreeNode = ({ 
  category, 
  allCategories, 
  books, 
  onEditCat, 
  onDeleteCat, 
  onAddSubCat,
  onDeleteBook,
  searchActive
}: any) => {
  const [isOpen, setIsOpen] = useState(false)
  const [isDropdownOpen, setIsDropdownOpen] = useState(false)
  
  // Expand automatically when searching
  useEffect(() => {
    if (searchActive) setIsOpen(true)
  }, [searchActive])
  
  const childCategories = allCategories.filter((c: any) => c.parent_id === category.id)
  const categoryBooks = books.filter((b: any) => b.category_id === category.id)
  
  const hasChildren = childCategories.length > 0 || categoryBooks.length > 0

  return (
    <div className="w-full">
      <div 
        className={`group flex items-center justify-between p-3 rounded-lg cursor-pointer border transition-colors ${isDropdownOpen ? 'bg-muted/50 border-border' : 'border-transparent hover:bg-muted/50 hover:border-border'}`}
        onClick={() => hasChildren && setIsOpen(!isOpen)}
      >
        <div className="flex items-center gap-3">
          <div className="text-muted-foreground w-4 h-4 flex items-center justify-center">
            {hasChildren && (isOpen ? <ChevronDown className="size-4" /> : <ChevronRight className="size-4" />)}
          </div>
          <FolderOpen className="size-5 text-primary" />
          <div>
            <span className="font-semibold text-foreground">{category.name}</span>
            {category.description && (
              <p className="text-xs text-muted-foreground line-clamp-1">{category.description}</p>
            )}
          </div>
        </div>

        <PermissionGate permission="manualbook.edit,manualbook.delete">
          <div className={`transition-opacity ${isDropdownOpen ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`} onClick={e => e.stopPropagation()}>
            <DropdownMenu onOpenChange={setIsDropdownOpen}>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8"><EllipsisVertical className="size-4" /></Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => onAddSubCat(category)}>Tambah Sub-Kategori</DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link to="/dashboard/manual-book/write" search={{ category_id: category.id } as any} className="w-full cursor-pointer">
                    Tulis Panduan
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => onEditCat(category)}>Edit Kategori</DropdownMenuItem>
                <DropdownMenuItem onClick={() => onDeleteCat(category)} className="text-destructive">Hapus Kategori</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </PermissionGate>
      </div>

      {isOpen && hasChildren && (
        <div className="ml-6 pl-4 border-l-2 border-muted mt-1 space-y-1">
          {/* Render Sub Categories */}
          {childCategories.map((child: any) => (
            <CategoryTreeNode 
              key={`cat-${child.id}`}
              category={child}
              allCategories={allCategories}
              books={books}
              onEditCat={onEditCat}
              onDeleteCat={onDeleteCat}
              onAddSubCat={onAddSubCat}
              onDeleteBook={onDeleteBook}
              searchActive={searchActive}
            />
          ))}

          {/* Render Books in this Category */}
          {categoryBooks.map((book: any) => (
            <BookTreeNode key={`book-${book.id}`} book={book} onDeleteBook={onDeleteBook} />
          ))}
        </div>
      )}
    </div>
  )
}

const BookTreeNode = ({ book, onDeleteBook }: any) => {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false)

  return (
    <div className={`group flex items-center justify-between p-2 rounded-lg border transition-colors ${isDropdownOpen ? 'bg-muted/50 border-border' : 'border-transparent hover:bg-muted/50 hover:border-border'}`}>
      <Link to="/dashboard/manual-book/$slug" params={{ slug: book.slug }} className="flex items-center gap-3 flex-1">
        <div className="text-muted-foreground w-4 h-4" /> {/* Spacer */}
        <FileText className="size-4 text-emerald-500" />
        <span className="text-sm font-medium hover:text-primary transition-colors">{book.title}</span>
        <Badge variant="outline" className={`ml-2 text-[10px] h-5 ${book.status === 'PUBLISHED' ? 'text-emerald-500 border-emerald-500/30' : 'text-orange-500 border-orange-500/30'}`}>
          {book.status}
        </Badge>
      </Link>
      
      <PermissionGate permission="manualbook.edit,manualbook.delete">
        <div className={`transition-opacity ${isDropdownOpen ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`}>
          <DropdownMenu onOpenChange={setIsDropdownOpen}>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8"><EllipsisVertical className="size-4" /></Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem asChild>
                <Link to="/dashboard/manual-book/edit/$id" params={{ id: book.id }} className="w-full cursor-pointer">
                  Edit Panduan
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onDeleteBook(book)} className="text-destructive">
                Hapus Panduan
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </PermissionGate>
    </div>
  )
}

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

  const deleteBookMut = useMutation({
    mutationFn: (id: string) => mbService.deleteManualBook(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['manual-books'] })
      toast.success('Buku panduan dihapus.')
      hideAlertDialog()
    },
    onError: error => toast.error(`Gagal: ${error.message}`),
  })

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

  const onAddSubCat = (parentCategory: any) => {
    setCatFormMode('CREATE')
    setSelectedCat({ parent_id: parentCategory.id })
    setCatDialogOpen(true)
  }

  const rootCategories = categories?.filter(c => !c.parent_id) || []

  return (
    <div className="flex flex-col gap-8 w-full">
      <div className="flex flex-col md:flex-row gap-6 justify-between items-center bg-card p-6 rounded-2xl border border-border shadow-sm">
        <div className="space-y-2 text-center md:text-left">
          <h1 className="text-3xl font-extrabold tracking-tight uppercase italic text-primary">Daftar Isi Panduan</h1>
          <p className="text-muted-foreground text-sm">Pusat pengetahuan dan Standar Operasional Prosedur perusahaan Anda.</p>
        </div>
        <PermissionGate permission="manualbook.create">
          <div className="flex flex-wrap justify-center gap-2">
            <Button variant="outline" onClick={() => {
              setCatFormMode('CREATE'); setSelectedCat(null); setCatDialogOpen(true);
            }}>
              <Plus className="size-4 mr-2" />
              Kategori Baru
            </Button>
            <Button asChild className="bg-primary hover:bg-primary/90 text-primary-foreground border-none shadow-md cursor-pointer">
              <Link to="/dashboard/manual-book/write" onClick={(e: any) => {
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

      <div className="flex justify-between items-center">
        <div className="relative max-w-md w-full">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
          <Input 
            placeholder="Cari judul atau konten panduan..." 
            className="pl-9 bg-card border-border shadow-sm rounded-xl h-11"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      <div className="bg-card border border-border rounded-2xl p-4 sm:p-6 shadow-sm min-h-[400px]">
        {(isBooksLoading || isCatLoading) ? (
          <div className="space-y-4">
            {Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-14 w-full rounded-xl" />)}
          </div>
        ) : rootCategories.length === 0 ? (
          <div className="flex flex-col items-center justify-center text-center py-24 h-full">
            <BookOpen className="size-14 text-muted-foreground/50 mb-6" />
            <p className="text-2xl font-bold text-foreground">Belum Ada Kategori & Panduan</p>
            <p className="text-muted-foreground max-w-sm mt-3 leading-relaxed">Buat kategori dan panduan operasional pertama Anda untuk memulainya.</p>
          </div>
        ) : (
          <div className="space-y-2">
            {rootCategories.map((cat) => (
              <CategoryTreeNode 
                key={`root-${cat.id}`}
                category={cat}
                allCategories={categories || []}
                books={books || []}
                onEditCat={(cat: any) => { setCatFormMode('EDIT'); setSelectedCat(cat); setCatDialogOpen(true); }}
                onDeleteCat={confirmDeleteCat}
                onAddSubCat={onAddSubCat}
                onDeleteBook={confirmDeleteBook}
                searchActive={debouncedSearch.length > 0}
              />
            ))}
          </div>
        )}
      </div>

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
