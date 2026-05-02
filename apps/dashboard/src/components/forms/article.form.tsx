import type { z } from 'zod'
import type { Article } from '@/dashboard/services/article.service'
import { Plus, Trash2, ArrowUp, ArrowDown, Image as ImageIcon } from 'lucide-react'
import { Button } from '@/dashboard/components/ui/button'
import { useAppForm } from '@/dashboard/hooks/form.hook'
import { ArticleFormSchema } from './common/schemas/article-form.schema'
import { Card, CardContent } from '@/dashboard/components/ui/card'

export type ArticleFormSubmitData = z.infer<typeof ArticleFormSchema>

export function ArticleForm({
  onSubmit,
  isPending,
  initialData,
  submitButtonText,
}: {
  onSubmit: (values: ArticleFormSubmitData) => void
  isPending: boolean
  initialData?: Article
  submitButtonText?: string
}) {
  const form = useAppForm({
    validators: { onSubmit: ArticleFormSchema as any },
    defaultValues: {
      title: initialData?.title ?? '',
      subtitle: initialData?.subtitle ?? '',
      thumbnail_url: initialData?.thumbnail_url ?? '',
      category: initialData?.category ?? 'Umum',
      is_published: initialData?.is_published ?? false,
      content_steps: (initialData?.content_steps ?? []).map(step => ({
        title: step.title ?? '',
        description: step.description ?? '',
        image_url: step.image_url ?? '',
      })),
    },
    onSubmit: ({ value }) => {
      onSubmit(value)
    },
  })

  return (
    <form.AppForm>
      <form
        onSubmit={(e) => {
          e.preventDefault()
          e.stopPropagation()
          form.handleSubmit()
        }}
      >
        <div className="flex flex-col gap-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <form.AppField
              name="title"
              children={field => (
                <field.TextField
                  label="Judul Artikel"
                  placeholder="Contoh: Update Film Netflix Mei 2024"
                />
              )}
            />
            <form.AppField
              name="thumbnail_url"
              children={field => (
                <div className="space-y-2">
                  <field.TextField
                    label="URL Thumbnail Utama (Link)"
                    placeholder="Masukkan link gambar..."
                  />
                  {field.state.value && (
                    <div className="relative aspect-video rounded-lg overflow-hidden border border-white/10 bg-black/20 group">
                       <img src={field.state.value} alt="Preview" className="w-full h-full object-cover" />
                       <div className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity">
                         <ImageIcon className="text-white size-8" />
                       </div>
                    </div>
                  )}
                </div>
              )}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <form.AppField
              name="subtitle"
              children={field => (
                <field.TextField
                  label="Subjudul / Deskripsi Singkat"
                  placeholder="Masukkan ringkasan artikel..."
                />
              )}
            />
            <form.AppField
              name="category"
              children={field => (
                <field.TextField
                  label="Kategori"
                  placeholder="Contoh: Netflix, Disney+, Berita"
                />
              )}
            />
          </div>

          <form.AppField
            name="is_published"
            children={field => (
              <div className="flex items-center gap-2 bg-white/5 p-4 rounded-xl border border-white/10">
                <field.BooleanCheckboxField label="Publish Artikel (Tampilkan ke User)" />
              </div>
            )}
          />

          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <h3 className="text-xl font-bold">Poin Konten</h3>
            </div>

            <form.AppField name="content_steps" mode="array">
              {field => (
                <div className="flex flex-col gap-6">
                  {field.state.value.map((_: any, i: number) => (
                    <Card key={`step-${i}`} className="bg-white/5 border-white/10 relative overflow-hidden group">
                      <div className="absolute top-0 left-0 w-1 h-full bg-primary" />
                      <CardContent className="p-6">
                        <div className="flex justify-between items-start mb-6">
                          <span className="text-xs font-black text-muted-foreground uppercase tracking-widest">Poin {i + 1}</span>
                          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              disabled={i === 0}
                              onClick={() => field.moveValue(i, i - 1)}
                              className="h-8 w-8"
                            >
                              <ArrowUp className="size-4" />
                            </Button>
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              disabled={i === field.state.value.length - 1}
                              onClick={() => field.moveValue(i, i + 1)}
                              className="h-8 w-8"
                            >
                              <ArrowDown className="size-4" />
                            </Button>
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              onClick={() => field.removeValue(i)}
                              className="h-8 w-8 text-red-500 hover:text-red-600 hover:bg-red-500/10"
                            >
                              <Trash2 className="size-4" />
                            </Button>
                          </div>
                        </div>

                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                          <div className="space-y-4">
                            <form.AppField
                              name={`content_steps.${i}.title` as any}
                              children={sub => (
                                <sub.TextField label="Judul Poin" placeholder="Contoh: Film A" />
                              )}
                            />
                            <form.AppField
                              name={`content_steps.${i}.description` as any}
                              children={sub => (
                                <sub.TextareaField label="Isi Konten" placeholder="Tulis penjelasan poin ini..." />
                              )}
                            />
                          </div>
                          <div className="space-y-4">
                            <form.AppField
                              name={`content_steps.${i}.image_url` as any}
                              children={sub => (
                                <div className="space-y-2">
                                  <sub.TextField label="URL Gambar (Opsional)" placeholder="Paste link gambar di sini..." />
                                  {sub.state.value ? (
                                    <div className="aspect-video rounded-lg overflow-hidden border border-white/10 bg-black/40">
                                      <img src={sub.state.value} alt="Point Preview" className="w-full h-full object-cover" />
                                    </div>
                                  ) : (
                                    <div className="aspect-video rounded-lg border border-dashed border-white/10 bg-white/5 flex flex-col items-center justify-center text-muted-foreground gap-2">
                                      <ImageIcon className="size-8 opacity-20" />
                                      <p className="text-xs">Gambar (opsional)</p>
                                    </div>
                                  )}
                                </div>
                              )}
                            />
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => field.pushValue({ title: '', description: '', image_url: '' })}
                    className="w-full h-12 border-dashed border-white/20 hover:border-primary/50 hover:bg-primary/5 transition-all"
                  >
                    <Plus className="size-4 mr-2" />
                    Tambah Poin Konten
                  </Button>
                </div>
              )}
            </form.AppField>
          </div>

          <form.SubscribeButton
            isPending={isPending}
            label={submitButtonText}
          />
        </div>
      </form>
    </form.AppForm>
  )
}
