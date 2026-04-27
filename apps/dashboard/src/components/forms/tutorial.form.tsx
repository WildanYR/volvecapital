import type { z } from 'zod'
import type { Tutorial } from '@/dashboard/services/tutorial.service'
import { Plus, Trash2, ArrowUp, ArrowDown, Image as ImageIcon } from 'lucide-react'
import { Button } from '@/dashboard/components/ui/button'
import { useAppForm } from '@/dashboard/hooks/form.hook'
import { TutorialFormSchema } from './common/schemas/tutorial-form.schema'
import { Card, CardContent } from '@/dashboard/components/ui/card'

export type TutorialFormSubmitData = z.infer<typeof TutorialFormSchema>

export function TutorialForm({
  onSubmit,
  isPending,
  initialData,
  submitButtonText,
}: {
  onSubmit: (values: TutorialFormSubmitData) => void
  isPending: boolean
  initialData?: Tutorial
  submitButtonText?: string
}) {
  const form = useAppForm({
    validators: { onSubmit: TutorialFormSchema },
    defaultValues: {
      title: initialData?.title ?? '',
      subtitle: initialData?.subtitle ?? '',
      thumbnail_url: initialData?.thumbnail_url ?? '',
      is_published: initialData?.is_published ?? false,
      steps: initialData?.steps ?? [],
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
                  label="Judul Tutorial"
                  placeholder="Contoh: Cara Beli Akun Premium"
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

          <form.AppField
            name="subtitle"
            children={field => (
              <field.TextareaField
                label="Subjudul / Deskripsi Singkat"
                placeholder="Masukkan panduan singkat..."
              />
            )}
          />

          <form.AppField
            name="is_published"
            children={field => (
              <div className="flex items-center gap-2 bg-white/5 p-4 rounded-xl border border-white/10">
                <field.BooleanCheckboxField label="Publish Tutorial (Tampilkan ke User)" />
              </div>
            )}
          />

          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <h3 className="text-xl font-bold">Langkah-langkah</h3>
            </div>

            <form.AppField name="steps" mode="array">
              {field => (
                <div className="flex flex-col gap-6">
                  {field.state.value.map((_, i) => (
                    <Card key={`step-${i}`} className="bg-white/5 border-white/10 relative overflow-hidden group">
                      <div className="absolute top-0 left-0 w-1 h-full bg-primary" />
                      <CardContent className="p-6">
                        <div className="flex justify-between items-start mb-6">
                          <div className="flex items-center gap-4">
                            <form.AppField
                              name={`steps[${i}].label`}
                              children={sub => (
                                <input
                                  value={sub.state.value}
                                  onChange={e => sub.handleChange(e.target.value)}
                                  onBlur={sub.handleBlur}
                                  className="bg-primary/20 text-primary text-xs font-black px-3 py-1 rounded-full uppercase tracking-widest border-none focus:ring-1 focus:ring-primary w-32"
                                  placeholder="LANGKAH 1"
                                />
                              )}
                            />
                          </div>
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
                              name={`steps[${i}].title`}
                              children={sub => (
                                <sub.TextField label="Judul Langkah" placeholder="Contoh: Pilih Produk" />
                              )}
                            />
                            <form.AppField
                              name={`steps[${i}].description`}
                              children={sub => (
                                <sub.TextareaField label="Deskripsi" placeholder="Jelaskan langkah ini secara singkat..." />
                              )}
                            />
                          </div>
                          <div className="space-y-4">
                            <form.AppField
                              name={`steps[${i}].image_url`}
                              children={sub => (
                                <div className="space-y-2">
                                  <sub.TextField label="URL Gambar Preview" placeholder="Paste link gambar di sini..." />
                                  {sub.state.value ? (
                                    <div className="aspect-video rounded-lg overflow-hidden border border-white/10 bg-black/40">
                                      <img src={sub.state.value} alt="Step Preview" className="w-full h-full object-cover" />
                                    </div>
                                  ) : (
                                    <div className="aspect-video rounded-lg border border-dashed border-white/10 bg-white/5 flex flex-col items-center justify-center text-muted-foreground gap-2">
                                      <ImageIcon className="size-8 opacity-20" />
                                      <p className="text-xs">Pratinjau gambar akan muncul di sini</p>
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
                    onClick={() => field.pushValue({ label: `LANGKAH ${field.state.value.length + 1}`, title: '', description: '', image_url: '' })}
                    className="w-full h-12 border-dashed border-white/20 hover:border-primary/50 hover:bg-primary/5 transition-all"
                  >
                    <Plus className="size-4 mr-2" />
                    Tambah Langkah Baru
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
