import { Label } from '@/dashboard/components/ui/label'
import { Textarea } from '@/dashboard/components/ui/textarea'
import { useFieldContext } from '@/dashboard/hooks/form.hook'
import { ErrorDisplay } from '../error-display'

export function TextareaField({
  label,
  placeholder,
}: {
  label: string
  placeholder?: string
}) {
  const field = useFieldContext<string>()
  return (
    <div className="grid gap-3">
      <Label htmlFor={field.name}>{label}</Label>
      <Textarea
        id={field.name}
        name={field.name}
        value={field.state.value}
        onBlur={field.handleBlur}
        onChange={e => field.handleChange(e.target.value)}
        placeholder={placeholder}
      />
      <ErrorDisplay errors={field.state.meta.errors} />
    </div>
  )
}
