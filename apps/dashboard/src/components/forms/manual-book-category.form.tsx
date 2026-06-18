import { Button } from '@/dashboard/components/ui/button'
import { Input } from '@/dashboard/components/ui/input'
import { Label } from '@/dashboard/components/ui/label'
import { useForm } from '@tanstack/react-form'
import { zodValidator } from '@tanstack/zod-form-adapter'
import { z } from 'zod'
import { Loader2 } from 'lucide-react'

const categorySchema = z.object({
  name: z.string().min(1, 'Nama kategori wajib diisi'),
  slug: z.string().min(1, 'Slug wajib diisi'),
  description: z.string().optional(),
  parent_id: z.string().optional(),
})

export type ManualBookCategoryFormSubmitData = z.infer<typeof categorySchema>

interface ManualBookCategoryFormProps {
  initialData?: any
  onSubmit: (values: ManualBookCategoryFormSubmitData) => void
  isPending: boolean
  submitButtonText?: string
  categories?: any[] // List of available categories for parent selection
}

export function ManualBookCategoryForm({
  initialData,
  onSubmit,
  isPending,
  submitButtonText = 'Simpan',
  categories = [],
}: ManualBookCategoryFormProps) {
  const form = useForm({
    defaultValues: {
      name: initialData?.name || '',
      slug: initialData?.slug || '',
      description: initialData?.description || '',
      parent_id: initialData?.parent_id || '',
    },
    validators: {
      onChange: categorySchema as any,
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
      className="space-y-4"
    >
      <form.Field name="name">
        {(field) => (
          <div className="space-y-2">
            <Label htmlFor={field.name}>Nama Kategori</Label>
            <Input
              id={field.name}
              value={field.state.value}
              onBlur={field.handleBlur}
              onChange={(e) => field.handleChange(e.target.value)}
              placeholder="Contoh: SOP HRD"
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
              placeholder="Contoh: sop-hrd"
            />
            {field.state.meta.errors ? (
              <p className="text-sm text-destructive">{field.state.meta.errors.join(', ')}</p>
            ) : null}
          </div>
        )}
      </form.Field>

      <form.Field name="description">
        {(field) => (
          <div className="space-y-2">
            <Label htmlFor={field.name}>Deskripsi (Opsional)</Label>
            <Input
              id={field.name}
              value={field.state.value}
              onBlur={field.handleBlur}
              onChange={(e) => field.handleChange(e.target.value)}
              placeholder="Penjelasan singkat kategori ini"
            />
          </div>
        )}
      </form.Field>

      <form.Field name="parent_id">
        {(field) => (
          <div className="space-y-2">
            <Label htmlFor={field.name}>Induk Kategori (Opsional)</Label>
            <select
              id={field.name}
              value={field.state.value || ''}
              onBlur={field.handleBlur}
              onChange={(e) => field.handleChange(e.target.value)}
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <option value="">Tidak ada induk (Kategori Utama)</option>
              {categories
                .filter((cat) => cat.id !== initialData?.id) // Prevent self-referencing
                .map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.name}
                  </option>
                ))}
            </select>
          </div>
        )}
      </form.Field>

      <div className="flex justify-end pt-4 border-t border-border">
        <form.Subscribe
          selector={(state) => [state.canSubmit, state.isSubmitting]}
          children={([canSubmit, isSubmitting]: [boolean, boolean]) => (
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
