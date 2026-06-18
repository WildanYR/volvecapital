import { RichTextEditor } from '@/dashboard/components/ui/rich-text-editor'
import { Button } from '@/dashboard/components/ui/button'
import { Input } from '@/dashboard/components/ui/input'
import { Label } from '@/dashboard/components/ui/label'
import { useForm } from '@tanstack/react-form'
import { zodValidator } from '@tanstack/zod-form-adapter'
import { z } from 'zod'
import { Loader2 } from 'lucide-react'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/dashboard/components/ui/select'
import type { ManualBookCategory } from '@/dashboard/services/manual-book.service'

const manualBookSchema = z.object({
  title: z.string().min(1, 'Judul wajib diisi'),
  slug: z.string().min(1, 'Slug wajib diisi'),
  category_id: z.string().min(1, 'Kategori wajib dipilih'),
  content: z.string().optional(),
  status: z.enum(['DRAFT', 'PUBLISHED']).default('DRAFT'),
})

export type ManualBookFormSubmitData = z.infer<typeof manualBookSchema>

interface ManualBookFormProps {
  initialData?: any
  categories: ManualBookCategory[]
  onSubmit: (values: ManualBookFormSubmitData) => void
  isPending: boolean
  submitButtonText?: string
}

export function ManualBookForm({
  initialData,
  categories,
  onSubmit,
  isPending,
  submitButtonText = 'Simpan',
}: ManualBookFormProps) {
  const form = useForm({
    defaultValues: {
      title: initialData?.title || '',
      slug: initialData?.slug || '',
      category_id: initialData?.category_id || '',
      content: initialData?.content || '',
      status: initialData?.status || 'DRAFT',
    },
    validatorAdapter: zodValidator(),
    validators: {
      onChange: manualBookSchema,
    },
    onSubmit: async ({ value }) => {
      onSubmit(value)
    },
  })

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault()
        e.stopPropagation()
        form.handleSubmit()
      }}
      className="space-y-6"
    >
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <form.Field name="title">
          {(field) => (
            <div className="space-y-2">
              <Label htmlFor={field.name}>Judul</Label>
              <Input
                id={field.name}
                value={field.state.value}
                onBlur={field.handleBlur}
                onChange={(e) => field.handleChange(e.target.value)}
                placeholder="Contoh: SOP Customer Service"
              />
              {field.state.meta.errors ? (
                <p className="text-sm text-destructive">{field.state.meta.errors.join(', ')}</p>
              ) : null}
            </div>
          )}
        </form.Field>

        <form.Field name="slug">
          {(field) => (
            <div className="space-y-2">
              <Label htmlFor={field.name}>Slug (URL Friendly)</Label>
              <Input
                id={field.name}
                value={field.state.value}
                onBlur={field.handleBlur}
                onChange={(e) => field.handleChange(e.target.value)}
                placeholder="Contoh: sop-customer-service"
              />
              {field.state.meta.errors ? (
                <p className="text-sm text-destructive">{field.state.meta.errors.join(', ')}</p>
              ) : null}
            </div>
          )}
        </form.Field>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <form.Field name="category_id">
          {(field) => (
            <div className="space-y-2">
              <Label htmlFor={field.name}>Kategori</Label>
              <Select value={field.state.value} onValueChange={(val) => field.handleChange(val)}>
                <SelectTrigger>
                  <SelectValue placeholder="Pilih Kategori" />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((c) => (
                    <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {field.state.meta.errors ? (
                <p className="text-sm text-destructive">{field.state.meta.errors.join(', ')}</p>
              ) : null}
            </div>
          )}
        </form.Field>

        <form.Field name="status">
          {(field) => (
            <div className="space-y-2">
              <Label htmlFor={field.name}>Status</Label>
              <Select value={field.state.value} onValueChange={(val: any) => field.handleChange(val)}>
                <SelectTrigger>
                  <SelectValue placeholder="Pilih Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="DRAFT">Draft</SelectItem>
                  <SelectItem value="PUBLISHED">Published</SelectItem>
                </SelectContent>
              </Select>
              {field.state.meta.errors ? (
                <p className="text-sm text-destructive">{field.state.meta.errors.join(', ')}</p>
              ) : null}
            </div>
          )}
        </form.Field>
      </div>

      <form.Field name="content">
        {(field) => (
          <div className="space-y-2">
            <Label>Konten (SOP / Panduan)</Label>
            <RichTextEditor
              content={field.state.value}
              onChange={(val) => field.handleChange(val)}
            />
          </div>
        )}
      </form.Field>

      <div className="flex justify-end pt-4 border-t border-border">
        <form.Subscribe
          selector={(state) => [state.canSubmit, state.isSubmitting]}
          children={([canSubmit]) => (
            <Button type="submit" disabled={!canSubmit || isPending}>
              {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {submitButtonText}
            </Button>
          )}
        />
      </div>
    </form>
  )
}
